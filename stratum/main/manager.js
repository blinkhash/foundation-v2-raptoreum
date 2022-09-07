const Algorithms = require('./algorithms');
const Template = require('./template');
const events = require('events');
const fastRoot = require('merkle-lib/fastRoot');
const utils = require('./utils');

////////////////////////////////////////////////////////////////////////////////

// Main Manager Function
const Manager = function(config, configMain) {

  const _this = this;
  this.config = config;
  this.configMain = configMain;

  // Job Variables
  this.validJobs = {};
  this.jobCounter = utils.jobCounter();
  this.currentJob = null;

  // ExtraNonce Variables
  this.extraNonceCounter = utils.extraNonceCounter(4);
  this.extraNoncePlaceholder = Buffer.from('f000000ff111111f', 'hex');
  this.extraNonce2Size = _this.extraNoncePlaceholder.length - _this.extraNonceCounter.size;

  // Calculate CryptoNight Rotation Difficulty Ratio
  this.handleAlgorithmRotation = function(currentHash, newHash) {
    const currentRotation = utils.getCryptoNightRotation(currentHash);
    const currentIndex = utils.getDifficultyIndex(currentRotation, config.rotations);
    const newRotation = utils.getCryptoNightRotation(newHash);
    const newIndex = utils.getDifficultyIndex(newRotation, config.rotations);
    console.log(currentRotation);
    console.log(currentIndex);
    console.log(newRotation);
    console.log(newIndex);
    const difficultyRatio = Math.floor(100 * newIndex / currentIndex) / 100;

    _this.emit('manager.block.rotation', difficultyRatio);
  }
  
  // Check if New Block is Processed
  this.handleUpdates = function(rpcData) {

    // Build New Block Template
    const tmpTemplate = new Template(
      _this.jobCounter.next(),
      _this.config,
      Object.assign({}, rpcData),
      _this.extraNoncePlaceholder);

    // Detect CryptoNight rotation
    if (tmpTemplate.rpcData.height > _this.currentJob.rpcData.height) {
      _this.handleAlgorithmRotation(_this.currentJob.rpcData.previousblockhash, tmpTemplate.rpcData.previousblockhash);
    }

    // Update Current Template
    _this.currentJob = tmpTemplate;
    _this.emit('manager.block.updated', tmpTemplate);
    _this.validJobs[tmpTemplate.jobId] = tmpTemplate;
    return true;
  };

  // Check if New Block is Processed
  this.handleTemplate = function(rpcData, newBlock) {

    console.log('when does this happen?');

    // If Current Job !== Previous Job
    let isNewBlock = _this.currentJob === null;
    if (!isNewBlock && rpcData.height >= _this.currentJob.rpcData.height &&
        ((_this.currentJob.rpcData.previousblockhash !== rpcData.previousblockhash) ||
        (_this.currentJob.rpcData.bits !== rpcData.bits))) {
      isNewBlock = true;
    }

    // Build New Block Template
    if (!isNewBlock && !newBlock) return false;
    const tmpTemplate = new Template(
      _this.jobCounter.next(),
      _this.config,
      Object.assign({}, rpcData),
      _this.extraNoncePlaceholder);

      
    // Detect CryptoNight rotation
    if (_this.currentJob != null && (tmpTemplate.rpcData.height > _this.currentJob.rpcData.height)) {
      console.log('current: ' + _this.currentJob.rpcData.height);
      console.log('new: ' + tmpTemplate.rpcData.height);
      console.log('new rotation processed');
      _this.handleAlgorithmRotation(_this.currentJob.rpcData.previousblockhash, tmpTemplate.rpcData.previousblockhash);
    }

    // Update Current Template
    _this.validJobs = {};
    _this.currentJob = tmpTemplate;
    _this.emit('manager.block.new', tmpTemplate);
    _this.validJobs[tmpTemplate.jobId] = tmpTemplate;
    return true;
  };

  // Process Submitted Share
  this.handleShare = function(jobId, client, submission) {

    // Main Submission Variables
    let difficulty = client.difficulty;
    const submitTime = Date.now() / 1000 | 0;
    const job = _this.validJobs[jobId];
    const nTimeInt = parseInt(submission.nTime, 16);

    // Establish Hashing Algorithms
    const headerDigest = Algorithms.ghostrider.hash();
    const coinbaseDigest = Algorithms.sha256d.hash();
    const blockDigest = Algorithms.sha256d.hash();

    // Share is Invalid
    const shareError = function(error) {
      _this.emit('manager.share', {
        job: jobId,
        id: client.id,
        ip: client.socket.remoteAddress,
        port: client.socket.localPort,
        addrPrimary: client.addrPrimary,
        addrAuxiliary: client.addrAuxiliary,
        difficulty: difficulty,
        identifier: _this.configMain.identifier || '',
        error: error[1],
      }, false);
      return { error: error, response: null };
    };

    // Edge Cases to Check if Share is Invalid
    if (typeof job === 'undefined' || job.jobId != jobId) {
      return shareError([21, 'job not found']);
    }
    if (submission.extraNonce2.length / 2 !== _this.extraNonce2Size) {
      return shareError([20, 'incorrect size of extranonce2']);
    }
    if (submission.nTime.length !== 8) {
      return shareError([20, 'incorrect size of ntime']);
    }
    if (nTimeInt < job.rpcData.curtime || nTimeInt > submitTime + 7200) {
      return shareError([20, 'ntime out of range']);
    }
    if (submission.nonce.length !== 8) {
      return shareError([20, 'incorrect size of nonce']);
    }
    if (!client.addrPrimary) {
      return shareError([20, 'worker address isn\'t set properly']);
    }
    if (!job.handleSubmissions([submission.extraNonce1, submission.extraNonce2, submission.nTime, submission.nonce])) {
      return shareError([22, 'duplicate share']);
    }

    // Establish Share Information
    let blockValid = false;
    const version = job.rpcData.version;
    const extraNonce1Buffer = Buffer.from(submission.extraNonce1, 'hex');
    const extraNonce2Buffer = Buffer.from(submission.extraNonce2, 'hex');

    // Generate Coinbase Buffer
    const coinbaseBuffer = job.handleCoinbase(extraNonce1Buffer, extraNonce2Buffer);
    const coinbaseHash = coinbaseDigest(coinbaseBuffer);
    const hashes = utils.convertHashToBuffer(job.rpcData.transactions);
    const transactions = [coinbaseHash].concat(hashes);
    const merkleRoot = fastRoot(transactions, utils.sha256d);

    // Start Generating Block Hash
    const headerBuffer = job.handleHeader(version, merkleRoot, submission.nTime, submission.nonce);
    const headerHash = headerDigest(headerBuffer, nTimeInt);
    const headerBigInt = utils.bufferToBigInt(utils.reverseBuffer(headerHash));

    // Calculate Share Difficulty
    const shareMultiplier = Algorithms.ghostrider.multiplier;
    const shareDiff = Algorithms.ghostrider.diff / Number(headerBigInt) * shareMultiplier;
    const blockDiffAdjusted = job.difficulty * Algorithms.ghostrider.multiplier;
    const blockHash = utils.reverseBuffer(blockDigest(headerBuffer, submission.nTime)).toString('hex');
    const blockHex = job.handleBlocks(headerBuffer, coinbaseBuffer).toString('hex');

    // Check if Share is Valid Block Candidate
    if (job.target >= headerBigInt) {
      blockValid = true;
    } else {
      if (shareDiff / difficulty < 0.99) {
        if (client.previousDifficulty && shareDiff >= client.previousDifficulty) {
          difficulty = client.previousDifficulty;
        } else {
          return shareError([23, 'low difficulty share of ' + shareDiff]);
        }
      }
    }

    // Build Primary Share Object Data
    const shareData = {
      job: jobId,
      id: client.id,
      ip: client.socket.remoteAddress,
      port: client.socket.localPort,
      addrPrimary: client.addrPrimary,
      addrAuxiliary: client.addrAuxiliary,
      blockDiffPrimary : blockDiffAdjusted,
      blockType: blockValid ? 'primary' : 'share',
      coinbase: coinbaseBuffer,
      difficulty: difficulty,
      hash: blockHash,
      hex: blockHex,
      header: headerHash,
      headerDiff: headerBigInt,
      height: job.rpcData.height,
      identifier: _this.configMain.identifier || '',
      reward: job.rpcData.coinbasevalue,
      shareDiff: shareDiff.toFixed(8),
    };

    const auxShareData = {
      job: jobId,
      id: client.id,
      ip: client.socket.remoteAddress,
      port: client.socket.localPort,
      addrPrimary: client.addrPrimary,
      addrAuxiliary: client.addrAuxiliary,
      blockDiffPrimary : blockDiffAdjusted,
      blockType: 'auxiliary',
      coinbase: coinbaseBuffer,
      difficulty: difficulty,
      hash: blockHash,
      hex: blockHex,
      header: headerHash,
      headerDiff: headerBigInt,
      identifier: _this.configMain.identifier || '',
      shareDiff: shareDiff.toFixed(8),
    };

    _this.emit('manager.share', shareData, auxShareData, blockValid);
    return { error: null, hash: blockHash, hex: blockHex, response: true };
  };
};

module.exports = Manager;
Manager.prototype.__proto__ = events.EventEmitter.prototype;
