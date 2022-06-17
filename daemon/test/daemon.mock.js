// Mock Daemon GetBlockTemplate Data
exports.getBlockTemplate = function() {
  return {
    'capabilities': [
      'proposal'
    ],
    'version': 536870912,
    'rules': [
      'v17'
    ],
    'vbavailable': {
    },
    'vbrequired': 0,
    'previousblockhash': 'ba8793564c46e896b8907d94175743e12d4bb1fc95948534da64ec93624dee31',
    'transactions': [
      {
        'data': '02000000032cfc9fcf4f1e47d6dc7897c00e99d96eda36d671fab41859782e1edc8cf0ef38000000006b483045022100e3c6c4f3656be9e4ac735694a02c0eaa989c606b9de6a6bab80db91b7019a8eb022042e227f6f6f6f94d5e4bcb892b030b7af9d4d8cf032709a84dd6411ad859a7530121029231a17cb7f7baf35a2cc5c22253857672f3681a0fb5f9b99b848c8d74724448feffffff9f9a3024733e77c1d3534ad5095dbac1a58daf59d3ac88beed62b84e8a5b6068010000006b483045022100a26bea225a7bdc433a08dc18da35ccdf92df1b44fee227db298dcc8e7a941e2502205b38ae06b20d91af061676ceb27ffc38dcf440fe75d3a6fed13bc59123e93d7e0121029ac49a28967f8ebf4e626d0126b2a7587b0420035909ac92746b9b816741fddcfefffffff9e6e4e76fb52c8e0f0894733f418a62b232d1ec263448156651f9b11456817e000000006b4830450221008172da70e89a6aae1d76a3eb9d5d0e76546eb94b289bc7c8bc581cbde508e9dc0220025a06125f721085c6a25dac323e0bad30021bfd43af7fb6ad3b53b4ee48f87301210314c5d4b52428e4670aaf67d861a0a017b5615315884d0a0da06b51cd10df0f87feffffff02234b1400000000001976a9146af90bc44256b99a65ff6a53b6e5eec32539821c88ac003b5808000000001976a9140ea13a85edd6fbfe82c995200d1186cc7e02586588acb5dc0100',
        'hash': '024abd639ca4ce79334de99ddf649ec722e89a5459580f1614fafe426b353cbd',
        'depends': [
        ],
        'fee': 665,
        'specialTxfee': 0,
        'sigops': 2
      }
    ],
    'coinbaseaux': {
      'flags': ''
    },
    'coinbasevalue': 500000000665,
    'longpollid': 'ba8793564c46e896b8907d94175743e12d4bb1fc95948534da64ec93624dee31225092',
    'target': '000145d300000000000000000000000000000000000000000000000000000000',
    'mintime': 1655491033,
    'mutable': [
      'time',
      'transactions',
      'prevblock'
    ],
    'noncerange': '00000000ffffffff',
    'sigoplimit': 20000,
    'sizelimit': 1000000,
    'curtime': 1614201893,
    'bits': '1e0ffff0',
    'previousbits': '1e0ffff0',
    'height': 1,
    'smartnode': [
      {
        'payee': 'RHP3VKiSYH4putQeSKLwr47QDdERa6H6G1',
        'script': '76a9144a3ae8c7ac2e308c1cce30efae12ea3d68803b6388ac',
        'amount': 100000000133
      }
    ],
    'smartnode_payments_started': true,
    'smartnode_payments_enforced': true,
    'superblock': [
    ],
    'superblocks_started': false,
    'superblocks_enabled': false,
    'founder': {
      'payee': 'RHP3VKiSYH4putQeSKLwr47QDdERa6H6G1',
      'script': '76a9147a1636c0913039c7a3f0b124dc6e625ade02f0c688ac',
      'amount': 25000000033
    },
    'founder_payments_started': true,
    'coinbase_payload': '0200b6dc0100c0bad32ec53b58694dd54ea434345b840e8f0c61a9666c33f1e140f50f7540fdeec22668d6d66da92433abbc5f8222fe9c77a5908e5dd386b65e82949d7f23b3'
  };
};

// Mock Daemon GetAuxBlock Data
exports.getAuxBlock = function() {
  return {
    'chainid': 1,
    'height': 1,
    'hash': '8719aefb83ef6583bd4c808bbe7d49b629a60b375fc6e36bee039530bc7727e2',
    'target': Buffer.from('00000ffff0000000000000000000000000000000000000000000000000000000', 'hex'),
  };
};

// Mock Daemon GetBlockchainInfo Data
exports.getBlockchainInfo = function() {
  return {
    'chain': 'main',
    'blocks': 1,
    'headers': 1,
    'bestblockhash': '1d5af7e2ad9aeccb110401761938c07a5895d85711c9c5646661a10407c82769',
    'difficulty': 0.000244140625,
    'mediantime': 1614202191,
    'verificationprogress': 3.580678270509504e-08,
    'initialblockdownload': false,
    'chainwork': '0000000000000000000000000000000000000000000000000000000000200020',
    'size_on_disk': 472,
    'pruned': false,
    'softforks': [
      {
        'id': 'bip34',
        'version': 2,
        'reject': {
          'status': false
        }
      },
      {
        'id': 'bip66',
        'version': 3,
        'reject': {
          'status': false
        }
      },
      {
        'id': 'bip65',
        'version': 4,
        'reject': {
          'status': false
        }
      }
    ],
    'bip9_softforks': {
      'csv': {
        'status': 'defined',
        'startTime': 1485561600,
        'timeout': 1517356801,
        'since': 0
      },
      'segwit': {
        'status': 'defined',
        'startTime': 1485561600,
        'timeout': 1517356801,
        'since': 0
      }
    },
    'warnings': ''
  };
};

// Mock Daemon GetInfo Data
exports.getInfo = function() {
  return {
    'version' : 89900,
    'protocolversion' : 70002,
    'walletversion' : 60000,
    'balance' : 0.00000000,
    'blocks' : 1,
    'timeoffset' : -2,
    'connections' : 8,
    'proxy' : '',
    'difficulty' : 510929738.01615179,
    'testnet' : false,
    'keypoololdest' : 1386220819,
    'keypoolsize' : 101,
    'paytxfee' : 0.00000000,
    'errors' : 'This is a pre-release test build - use at your own risk - do not use for mining or merchant applications'
  };
};

// Mock Daemon GetPeerInfo Data
exports.getPeerInfo = function() {
  return {
    'id': 20,
    'addr': '18.213.13.51:9333',
    'addrlocal': '173.73.155.96:61108',
    'addrbind': '192.168.1.155:61108',
    'services': '000000000000040d',
    'relaytxes': true,
    'lastsend': 1615676709,
    'lastrecv': 1615676709,
    'bytessent': 1793,
    'bytesrecv': 1782,
    'conntime': 1615674308,
    'timeoffset': 0,
    'pingtime': 0.007751,
    'minping': 0.00522,
    'version': 70015,
    'subver': '/LitecoinCore:0.18.1/',
    'inbound': false,
    'addnode': false,
    'startingheight': 1,
    'banscore': 0,
    'synced_headers': 1,
    'synced_blocks': 1,
    'inflight': [],
    'whitelisted': false,
    'minfeefilter': 0.00001000,
    'bytessent_per_msg': {
      'addr': 55,
      'feefilter': 32,
      'getaddr': 24,
      'getheaders': 93,
      'ping': 672,
      'pong': 672,
      'sendcmpct': 66,
      'sendheaders': 24,
      'verack': 24,
      'version': 131
    },
    'bytesrecv_per_msg': {
      'addr': 55,
      'feefilter': 32,
      'headers': 106,
      'ping': 672,
      'pong': 672,
      'sendcmpct': 66,
      'sendheaders': 24,
      'verack': 24,
      'version': 131
    }
  };
};
