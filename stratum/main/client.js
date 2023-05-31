const events = require('events');
const utils = require('./utils');

////////////////////////////////////////////////////////////////////////////////

// Main Client Function
const Client = function(config, socket, id, authorizeFn) {

  const _this = this;
  this.id = id;
  this.config = config;
  this.socket = socket;
  this.authorizeFn = authorizeFn;

  // Get Correct Active Port Limits
  const activePort = _this.config.ports
    .filter((port) => port.port === _this.socket.localPort)
    .filter((port) => typeof port.difficulty.minimum !== undefined)
    .filter((port) => typeof port.difficulty.maximum !== undefined)

  this.minDiff = activePort[0].difficulty.minimum;
  this.maxDiff = activePort[0].difficulty.maximum;

  // Client Variables
  this.activity = Date.now();
  this.authorized = false;
  this.difficulty = 0;
  this.messages = '';
  this.shares = { valid: 0, invalid: 0 };

  // Difficulty Variables
  this.pendingDifficulty = null;

  // Send JSON Messages
  this.sendJson = function() {
    let response = '';
    Object.keys(arguments).forEach((arg) => {
      response += JSON.stringify(arguments[arg]) + '\n';
    });
    _this.socket.write(response);
  };

  // Get Label of Stratum Client
  this.sendLabel = function() {
    const worker = _this.addrPrimary || '(unauthorized)';
    const address = _this.socket.remoteAddress;
    return `${ worker } [${ address }]`;
  };

  // Push Updated Difficulty to Queue
  this.enqueueDifficulty = function(difficulty) {
    const newDiff = utils.roundTo(difficulty, 4);
    _this.pendingDifficulty = newDiff;
    _this.emit('client.difficulty.queued', newDiff);
  };

  // Validate Client Name
  this.validateName = function(name) {
    if (name.length >= 1) {
      name = name.toString().replace(/[^a-zA-Z0-9.,_-]+/g, '');
    }
    const addresses = name.split(',');
    if (addresses.length > 1) {
      return [addresses[0], addresses[1]];
    } else {
      return [addresses[0], null];
    }
  };

  // Validate Client Password
  this.validatePassword = function(password) {
    if (password.length >= 1) {
      password = password.toString().replace(/[^a-zA-Z0-9.,=]+/g, '');
    }
    const values = password.split(',');
    const flags = {};
    values.forEach((value) => {
      if (/^d=[+-]?(\d*\.)?\d+$/.test(value)) {
        flags.difficulty = parseFloat(value.split('=')[1]);
      }
    });
    return flags;
  };

  // Validate Sent Messages
  this.validateMessages = function(message) {
    switch (message.method) {

    // Supported Stratum Messages
    case 'keepalived':
      _this.handleKeepalived(message);
      break;
    case 'mining.subscribe':
      _this.handleSubscribe(message);
      break;
      case 'mining.authorize':
      _this.handleAuthorize(message);
      break;
    case 'mining.configure':
      _this.handleConfigure(message);
      break;
    case 'mining.multi_version':
      _this.handleMultiVersion(message);
      break;
    case 'mining.submit':
      _this.activity = Date.now();
      _this.handleSubmit(message);
      break;

      // Unsupported Stratum Messages
    case 'mining.get_transactions':
      _this.sendJson({
        id: message.id,
        result: [],
        error: [20, 'Not supported.', null]
      });
      break;
    case 'mining.extranonce.subscribe':
      _this.sendJson({
        id: message.id,
        result: false,
        error: [20, 'Not supported.', null]
      });
      break;
    default:
      _this.emit('client.mining.unknown', message);
      break;
    }
  };

  // Validate Socket Data
  this.validateData = function(data) {

    // Client is Flooding Server
    _this.messages += data;
    if (Buffer.byteLength(_this.messages, 'utf8') > 10240) {
      _this.emit('client.socket.flooded');
      _this.socket.destroy();
      return;
    }

    // Handle Individual Messages
    if (_this.messages.indexOf('\n') !== -1) {
      const messages = _this.messages.split('\n');
      const incomplete = _this.messages.slice(-1) === '\n' ? '' : messages.pop();
      messages.forEach((message) => {
        if (message === '') return;
        try {
          _this.validateMessages(JSON.parse(message));
        } catch(e) {
          _this.emit('client.socket.malformed', e);
          _this.socket.destroy();
          return;
        }
      });
      _this.messages = incomplete;
    }
  };

  // Check for Banning Users
  this.considerBan = function(shareValid) {

    // Keep Track of Valid/Invalid Shares
    if (shareValid === true) _this.shares.valid += 1;
    else _this.shares.invalid += 1;

    // Check if Tracked Shares Exceeds Ban Threshold
    const totalShares = _this.shares.valid + _this.shares.invalid;
    if (totalShares >= _this.config.settings.banning.checkThreshold) {
      if (((_this.shares.invalid / totalShares) * 100) < _this.config.settings.banning.invalidPercent) {
        this.shares = { valid: 0, invalid: 0 };
      } else {
        _this.socket.destroy();
        _this.emit('client.ban.trigger');
        return true;
      }
    }

    // No Ban Necessary
    return false;
  };

  // Broadcast Difficulty to Stratum Client
  this.broadcastDifficulty = function(difficulty) {

    // Handle Previous Difficulty
    if (difficulty === _this.difficulty) return false;
    _this.previousDifficulty = _this.difficulty;
    _this.difficulty = difficulty;

    // Process Algorithm Difficulty
    _this.sendJson({
      id: null,
      method: 'mining.set_difficulty',
      params: [difficulty],
    });

    // Difficulty Updated Correctly
    return true;
  };

  // Broadcast Mining Job to Stratum Client
  this.broadcastMiningJob = function(parameters, diffIndex, diffRatio) {

    // Check Processed Shares
    const activityAgo = Date.now() - _this.activity;
    if (activityAgo > _this.config.settings.timeout.connection) {
      const message = `The last submitted share was ${ activityAgo / 1000 | 0 } seconds ago`;
      _this.emit('client.socket.timeout', message);
      _this.socket.destroy();
      return;
    }

    // Set New Pending Difficulty
    let result = null;
    if (_this.pendingDifficulty > 0) {

      // Apply CN Round Difficulty Index
      _this.pendingDifficulty *= diffIndex;

      // Check Limits
      if (_this.minDiff > _this.pendingDifficulty) {
        _this.pendingDifficulty = _this.minDiff;
      } else if (_this.maxDiff < _this.pendingDifficulty) {
        _this.pendingDifficulty = _this.maxDiff;
      }
      result = _this.broadcastDifficulty(_this.pendingDifficulty);
    } else if (diffRatio != 1 && _this.difficulty > 0) {
      
      // Apply CN Round Difficulty Ratio
      _this.pendingDifficulty = _this.difficulty * diffRatio;

      // Check Limits
      if (_this.minDiff > _this.pendingDifficulty) {
        _this.pendingDifficulty = _this.minDiff;
      } else if (_this.maxDiff < _this.pendingDifficulty) {
        _this.pendingDifficulty = _this.maxDiff;
      }
      result = _this.broadcastDifficulty(_this.pendingDifficulty);
    }
    
    // Emit Difficulty Update
    _this.pendingDifficulty = null;
    if (result != null) _this.emit('client.difficulty.updated', _this.difficulty);

    // Broadcast Mining Job to Client
    _this.sendJson({
      id: null,
      method: 'mining.notify',
      params: parameters
    });
  };

  // Manage Stratum Keepalived
  this.handleKeepalived = function(message) {

    // Broadcast Keepalived Response
    _this.sendJson({
      id: message.id,
      result: {
        "status": "KEEPALIVED"
      },
      error: null,
    });

    // Keep Worker Connection Alive
    _this.activity = Date.now();
  };

  // Manage Stratum Subscription
  this.handleSubscribe = function(message) {

    // Emit Subscription Event
    _this.emit('client.subscription', message, (error, extraNonce1, extraNonce2Size) => {
      if (error) {
        _this.sendJson({ id: message.id, result: null, error: error });
        return;
      }

      // Assign Client ExtraNonce
      _this.extraNonce1 = extraNonce1;
      _this.sendJson({
        id: message.id,
        result: [[
          ['mining.set_difficulty', _this.id],
          ['mining.notify', _this.id]],
        extraNonce1,
        extraNonce2Size],
        error: null
      });
    });
  };

  // Manage Stratum Authorization
  this.handleAuthorize = function(message) {

    // Handle Client Authentication
    const clientAddrs = _this.validateName(message.params[0]);
    const clientFlags = _this.validatePassword(message.params[1]);

    // Set Initial Variables
    _this.addrPrimary = clientAddrs[0];
    _this.addrAuxiliary = clientAddrs[1];
    _this.clientPassword = message.params[1];

    // Check to Authorize Client
    _this.authorizeFn(
      _this.socket.remoteAddress,
      _this.socket.localPort,
      _this.addrPrimary,
      _this.addrAuxiliary,
      _this.clientPassword,
      (result) => {
        _this.authorized = (!result.error && result.authorized);
        if (result.disconnect) {
          _this.socket.destroy();
          return;
        }
        _this.sendJson({
          id: message.id,
          result: _this.authorized,
          error: result.error
        });

        // Emit Authorization Event
        _this.emit('client.authorization', clientFlags);
      }
    );
  };

  // Manage Stratum Configuration
  this.handleConfigure = function(message) {

    // Broadcast Version Updates
    _this.sendJson({
      id: message.id,
      result: {
        'version-rolling': false,
      },
      error: null
    });

    // Update Version Mask
    _this.asicboost = false;
    _this.versionMask = '00000000';
  };

  // Manage Stratum Multi-Versions
  this.handleMultiVersion = function() {

    // AsicBoost is Not Supported
    _this.asicboost = false;
    _this.versionMask = '00000000';
  };

  // Manage Stratum Submission
  this.handleSubmit = function(message) {

    // Check that Address is Set
    if (!_this.addrPrimary) {
      const workerData = _this.validateName(message.params[0]);
      _this.addrPrimary = workerData[0];
      _this.addrAuxiliary = workerData[1];
    }

    // Check that Client is Authorized
    if (!_this.authorized) {
      _this.sendJson({
        id: message.id,
        result: null,
        error: [24, 'unauthorized worker', null]
      });
      _this.considerBan(false);
      return;
    }

    // Check that Client is Subscribed
    if (!_this.extraNonce1) {
      _this.sendJson({
        id: message.id,
        result: null,
        error: [25, 'not subscribed', null]
      });
      _this.considerBan(false);
      return;
    }

    // Submit Share to Pool Server
    message.params[0] = _this.validateName(message.params[0]);
    _this.emit('client.submit', message, (error, result) => {
      if (!_this.considerBan(result)) {
        _this.sendJson({
          id: message.id,
          result: result,
          error: error
        });
      }
    });
  };

  // Establish Stratum Connection
  this.setupClient = function() {

    // Setup Main Socket Connection
    _this.socket.setEncoding('utf8');
    _this.emit('client.ban.check');

    // Process Socket Events
    _this.socket.on('data', (data) => _this.validateData(data));
    _this.socket.on('error', (error) => _this.emit('client.socket.error', error));
    _this.socket.on('close', () => _this.emit('client.socket.disconnect'));
  };
};

module.exports = Client;
Client.prototype.__proto__ = events.EventEmitter.prototype;