const utils = require('./utils');

////////////////////////////////////////////////////////////////////////////////

// Main Transactions Function
const Transactions = function(config) {

  const _this = this;
  this.config = config;

  // Mainnet Configuration
  this.configMainnet = {
    bech32: '',
    bip32: {
      public: Buffer.from('0488B21E', 'hex').readUInt32LE(0),
      private: Buffer.from('0488ADE4', 'hex').readUInt32LE(0),
    },
    peerMagic: '72746d2e',
    pubKeyHash: Buffer.from('3C', 'hex').readUInt8(0),
    scriptHash: Buffer.from('10', 'hex').readUInt8(0),
    wif: Buffer.from('80', 'hex').readUInt8(0),
    coin: 'rtm',
  };

  // Testnet Configuration
  this.configTestnet = {
    bech32: '',
    bip32: {
      public: Buffer.from('043587CF', 'hex').readUInt32LE(0),
      private: Buffer.from('04358394', 'hex').readUInt32LE(0),
    },
    peerMagic: '7472746d',
    pubKeyHash: Buffer.from('7B', 'hex').readUInt8(0),
    scriptHash: Buffer.from('13', 'hex').readUInt8(0),
    wif: Buffer.from('EF', 'hex').readUInt8(0),
    coin: 'rtm',
  };

  // Calculate Generation Transaction
  this.handleGeneration = function(rpcData, placeholder) {

    const txLockTime = 0;
    const txInSequence = 0;
    const txInPrevOutHash = '';
    const txInPrevOutIndex = Math.pow(2, 32) - 1;
    const txOutputBuffers = [];

    let txExtraPayload;
    let txVersion = 3;
    const network = !_this.config.settings.testnet ?
      _this.configMainnet :
      _this.configTestnet;

    // Use Version Found in CoinbaseTxn
    if (rpcData.coinbasetxn && rpcData.coinbasetxn.data) {
      txVersion = parseInt(utils.reverseHex(rpcData.coinbasetxn.data.slice(0, 8)), 16);
    }

    // Support Coinbase v3 Block Template
    if (rpcData.coinbase_payload && rpcData.coinbase_payload.length > 0) {
      txExtraPayload = Buffer.from(rpcData.coinbase_payload, 'hex');
      txVersion = txVersion + (5 << 16);
    }

    // Calculate Coin Block Reward
    let reward = rpcData.coinbasevalue;

    // Handle Pool/Coinbase Addr/Flags
    const poolAddressScript = utils.addressToScript(_this.config.primary.address, network);
    const coinbaseAux = rpcData.coinbaseaux && rpcData.coinbaseaux.flags ?
      Buffer.from(rpcData.coinbaseaux.flags, 'hex') :
      Buffer.from([]);

    // Build Initial ScriptSig
    let scriptSig = Buffer.concat([
      utils.serializeNumber(rpcData.height),
      coinbaseAux,
      utils.serializeNumber(Date.now() / 1000 | 0),
      Buffer.from([placeholder.length]),
    ]);

    // Add Auxiliary Data to ScriptSig
    if (_this.config.auxiliary && _this.config.auxiliary.enabled && rpcData.auxData) {
      scriptSig = Buffer.concat([
        scriptSig,
        Buffer.from(_this.config.auxiliary.coin.header, 'hex'),
        Buffer.from(rpcData.auxData.hash, 'hex'),
        utils.packUInt32LE(1),
        utils.packUInt32LE(0)
      ]);
    }

    // Build First Part of Generation Transaction
    const p1 = Buffer.concat([
      utils.packUInt32LE(txVersion),
      utils.varIntBuffer(1),
      utils.uint256BufferFromHash(txInPrevOutHash),
      utils.packUInt32LE(txInPrevOutIndex),
      utils.varIntBuffer(scriptSig.length + placeholder.length),
      scriptSig,
    ]);

    // Handle Smartnodes
    if (rpcData.smartnode.length > 0) {
      rpcData.smartnode.forEach((payee) => {
        const payeeReward = payee.amount;
        let payeeScript;
        if (payee.script) payeeScript = Buffer.from(payee.script, 'hex');
        else payeeScript = utils.addressToScript(payee.payee, network);
        reward -= payeeReward;
        txOutputBuffers.push(Buffer.concat([
          utils.packUInt64LE(payeeReward),
          utils.varIntBuffer(payeeScript.length),
          payeeScript,
        ]));
      });
    }

    // Handle Superblocks
    if (rpcData.superblock.length > 0) {
      rpcData.superblock.forEach((payee) => {
        const payeeReward = payee.amount;
        let payeeScript;
        if (payee.script) payeeScript = Buffer.from(payee.script, 'hex');
        else payeeScript = utils.addressToScript(payee.payee, network);
        reward -= payeeReward;
        txOutputBuffers.push(Buffer.concat([
          utils.packUInt64LE(payeeReward),
          utils.varIntBuffer(payeeScript.length),
          payeeScript,
        ]));
      });
    }

    // Handle Founder Transactions
    if (rpcData.founder_payments_started && rpcData.founder) {
      const founderReward = rpcData.founder.amount;
      let founderScript;
      if (rpcData.founder.script) founderScript = Buffer.from(rpcData.founder.script, 'hex');
      else founderScript = utils.addressToScript(rpcData.founder.payee, network);
      reward -= founderReward;
      txOutputBuffers.push(Buffer.concat([
        utils.packUInt64LE(founderReward),
        utils.varIntBuffer(founderScript.length),
        founderScript,
      ]));
    }


    // Handle Recipient Transactions
    let recipientTotal = 0;
    _this.config.primary.recipients.forEach((recipient) => {
      const recipientReward = Math.floor(recipient.percentage * reward);
      const recipientScript = utils.addressToScript(recipient.address, network);
      recipientTotal += recipientReward;
      txOutputBuffers.push(Buffer.concat([
        utils.packUInt64LE(recipientReward),
        utils.varIntBuffer(recipientScript.length),
        recipientScript,
      ]));
    });

    // Handle Pool Transaction
    reward -= recipientTotal;
    txOutputBuffers.unshift(Buffer.concat([
      utils.packUInt64LE(reward),
      utils.varIntBuffer(poolAddressScript.length),
      poolAddressScript
    ]));

    // Build Second Part of Generation Transaction
    const p2 = Buffer.concat([
      utils.packUInt32LE(txInSequence),
      utils.varIntBuffer(txOutputBuffers.length),
      Buffer.concat(txOutputBuffers),
      utils.packUInt32LE(txLockTime),
      utils.varIntBuffer(txExtraPayload.length),
      txExtraPayload
    ]);

    return [p1, p2];
  };
};

module.exports = Transactions;
