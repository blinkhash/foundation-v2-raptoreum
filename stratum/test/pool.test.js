const Pool = require('../main/pool');
const config = require('../../configs/example');
const configMain = require('../../configs/main');
const events = require('events');
const nock = require('nock');
const testdata = require('../../daemon/test/daemon.mock');

config.primary.address = 'RHP3VKiSYH4putQeSKLwr47QDdERa6H6G1';
config.primary.recipients[0].address = 'RHP3VKiSYH4putQeSKLwr47QDdERa6H6G1';

const auxiliaryConfig = {
  'enabled': true,
  'coin': {
    'name': 'Namecoin',
    'header': 'fabe6d6d',
  }
};

const auxiliaryDaemons = [{
  'host': '127.0.0.1',
  'port': '9996',
  'username': 'foundation',
  'password': 'foundation'
}];

nock.disableNetConnect();
nock.enableNetConnect('127.0.0.1');
process.env.forkId = '0';

////////////////////////////////////////////////////////////////////////////////

function mockSetupDaemons(pool, callback) {
  nock('http://127.0.0.1:9998')
    .post('/', (body) => body.method === 'getpeerinfo')
    .reply(200, JSON.stringify({
      id: 'nocktest',
      error: null,
      result: null,
    }));
  nock('http://127.0.0.1:9996')
    .post('/', (body) => body.method === 'getpeerinfo')
    .reply(200, JSON.stringify({
      id: 'nocktest',
      error: null,
      result: null,
    }));
  pool.setupDaemons(() => callback());
}

function mockSetupSettings(pool, callback) {
  nock('http://127.0.0.1:9998')
    .post('/').reply(200, JSON.stringify([
      { id: 'nocktest', error: null, result: { isvalid: true, address: 'RHP3VKiSYH4putQeSKLwr47QDdERa6H6G1' }},
      { id: 'nocktest', error: null, result: { networkhashps: 0 }},
      { id: 'nocktest', error: null, result: { chain: 'main', difficulty: 0 }},
      { id: 'nocktest', error: null, result: { protocolversion: 1, connections: 1 }},
    ]));
  pool.setupSettings(() => callback());
}

function mockSetupPrimaryBlockchain(pool, callback) {
  nock('http://127.0.0.1:9998')
    .post('/', (body) => body.method === 'getblocktemplate')
    .reply(200, JSON.stringify({
      id: 'nocktest',
      error: null,
      result: testdata.getBlockTemplate(),
    }));
  pool.setupPrimaryBlockchain(() => callback());
}

function mockSetupAuxiliaryBlockchain(pool, callback) {
  if (pool.auxiliary.enabled) {
    nock('http://127.0.0.1:9996')
      .post('/', (body) => body.method === 'getauxblock')
      .reply(200, JSON.stringify({
        id: 'nocktest',
        error: null,
        result: testdata.getAuxBlock(),
      }));
  }
  pool.setupAuxiliaryBlockchain(() => callback());
}

function mockSetupFirstJob(pool, callback) {
  nock('http://127.0.0.1:9998')
    .post('/', (body) => body.method === 'getblocktemplate')
    .reply(200, JSON.stringify({
      id: 'nocktest',
      error: null,
      result: testdata.getBlockTemplate(),
    }));
  if (pool.auxiliary.enabled) {
    nock('http://127.0.0.1:9996')
      .post('/', (body) => body.method === 'getauxblock')
      .reply(200, JSON.stringify({
        id: 'nocktest',
        error: null,
        result: testdata.getAuxBlock(),
      }));
  }
  pool.setupFirstJob(() => callback());
}

////////////////////////////////////////////////////////////////////////////////

function mockSocket() {
  const socket = new events.EventEmitter();
  socket.remoteAddress = '127.0.0.1',
  socket.destroy = () => {};
  socket.setEncoding = () => {};
  socket.setKeepAlive = () => {};
  socket.write = (data) => {
    socket.emit('log', data);
  };
  return socket;
}

function mockClient() {
  const socket = mockSocket();
  const client = new events.EventEmitter();
  client.id = 'test';
  client.addrPrimary = 'RHP3VKiSYH4putQeSKLwr47QDdERa6H6G1';
  client.previousDifficulty = 0;
  client.difficulty = 1,
  client.extraNonce1 = 0,
  client.socket = socket;
  client.socket.localPort = 3002;
  client.sendLabel = () => {
    return 'client [example]';
  };
  client.broadcastMiningJob = () => {};
  client.broadcastDifficulty = () => {};
  return client;
}

////////////////////////////////////////////////////////////////////////////////

describe('Test pool functionality', () => {

  let configCopy, configMainCopy, rpcDataCopy, auxDataCopy;
  let blockchainDataCopy, peerDataCopy;
  beforeEach(() => {
    configCopy = JSON.parse(JSON.stringify(config));
    configMainCopy = JSON.parse(JSON.stringify(configMain));
    rpcDataCopy = JSON.parse(JSON.stringify(testdata.getBlockTemplate()));
    auxDataCopy = JSON.parse(JSON.stringify(testdata.getAuxBlock()));
    blockchainDataCopy = JSON.parse(JSON.stringify(testdata.getBlockchainInfo()));
    peerDataCopy = JSON.parse(JSON.stringify(testdata.getPeerInfo()));
  });

  beforeEach(() => nock.cleanAll());
  afterAll(() => nock.restore());
  beforeAll(() => {
    if (!nock.isActive()) nock.activate();
    nock.enableNetConnect();
  });

  test('Test initialization of pool', () => {
    const pool = new Pool(configCopy, configMainCopy, () => {});
    expect(typeof pool).toBe('object');
  });

  test('Test port difficulty setup [1]', () => {
    const pool = new Pool(configCopy, configMainCopy, () => {});
    mockSetupDaemons(pool, () => {
      pool.setupPorts();
      expect(typeof pool.difficulty).toBe('object');
      expect(typeof pool.difficulty['3002']).toBe('object');
      expect(typeof pool.difficulty['3002'].handleClient).toBe('function');
      expect(pool.difficulty['3002']._eventsCount).toBe(1);
    });
  });

  test('Test port difficulty setup [2]', (done) => {
    const pool = new Pool(configCopy, configMainCopy, () => {});
    mockSetupDaemons(pool, () => {
      pool.difficulty['3002'] = { removeAllListeners: () => done() };
      pool.setupPorts();
    });
  });

  test('Test port difficulty setup [3]', (done) => {
    const client = { enqueueDifficulty: () => done() };
    const pool = new Pool(configCopy, configMainCopy, () => {});
    mockSetupDaemons(pool, () => {
      pool.setupPorts();
      pool.difficulty['3002'].emit('client.difficulty.new', client);
    });
  });

  test('Test pool settings setup [1]', (done) => {
    const pool = new Pool(configCopy, configMainCopy, () => {});
    pool.on('pool.log', (type, text) => {
      expect(type).toBe('error');
      expect(text).toContain('Could not start pool, error with RPC response');
      done();
    });
    mockSetupDaemons(pool, () => {
      pool.setupSettings(() => {});
    });
  });

  test('Test pool settings setup [2]', (done) => {
    const pool = new Pool(configCopy, configMainCopy, () => {});
    mockSetupDaemons(pool, () => {
      nock('http://127.0.0.1:9998')
        .post('/').reply(200, JSON.stringify([
          { id: 'nocktest', error: null, result: { isvalid: true, address: 'RHP3VKiSYH4putQeSKLwr47QDdERa6H6G1' }},
          { id: 'nocktest', error: null, result: { networkhashps: 0 }},
          { id: 'nocktest', error: null, result: { chain: 'main', difficulty: 0 }},
          { id: 'nocktest', error: null, result: { protocolversion: 1, connections: 1 }},
        ]));
      pool.setupSettings(() => {
        expect(configCopy.primary.address).toBe('RHP3VKiSYH4putQeSKLwr47QDdERa6H6G1');
        expect(pool.settings.testnet).toBe(false);
        expect(typeof pool.statistics).toBe('object');
        done();
      });
    });
  });

  test('Test pool settings setup [3]', (done) => {
    const pool = new Pool(configCopy, configMainCopy, () => {});
    pool.on('pool.log', (type, text) => {
      expect(type).toBe('error');
      expect(text).toContain('Could not start pool, error with RPC command response: validateaddress');
      done();
    });
    mockSetupDaemons(pool, () => {
      nock('http://127.0.0.1:9998')
        .post('/').reply(200, JSON.stringify([
          { id: 'nocktest', error: true, result: { isvalid: true, address: 'RHP3VKiSYH4putQeSKLwr47QDdERa6H6G1' }},
          { id: 'nocktest', error: null, result: { networkhashps: 0 }},
          { id: 'nocktest', error: null, result: { chain: 'main', difficulty: 0 }},
          { id: 'nocktest', error: null, result: { protocolversion: 1, connections: 1 }},
        ]));
      pool.setupSettings(() => {});
    });
  });

  test('Test pool settings setup [4]', (done) => {
    const pool = new Pool(configCopy, configMainCopy, () => {});
    pool.on('pool.log', (type, text) => {
      expect(type).toBe('error');
      expect(text).toBe('The daemon reports that the given address is not valid');
      done();
    });
    mockSetupDaemons(pool, () => {
      nock('http://127.0.0.1:9998')
        .post('/').reply(200, JSON.stringify([
          { id: 'nocktest', error: null, result: { isvalid: false, address: 'RHP3VKiSYH4putQeSKLwr47QDdERa6H6G1' }},
          { id: 'nocktest', error: null, result: { networkhashps: 0 }},
          { id: 'nocktest', error: null, result: { chain: 'main', difficulty: 0 }},
          { id: 'nocktest', error: null, result: { protocolversion: 1, connections: 1 }},
        ]));
      pool.setupSettings(() => {});
    });
  });

  test('Test pool settings setup [5]', (done) => {
    const pool = new Pool(configCopy, configMainCopy, () => {});
    mockSetupDaemons(pool, () => {
      nock('http://127.0.0.1:9998')
        .post('/').reply(200, JSON.stringify([
          { id: 'nocktest', error: null, result: { isvalid: true, address: 'RHP3VKiSYH4putQeSKLwr47QDdERa6H6G1' }},
          { id: 'nocktest', error: null, result: { networkhashps: 0 }},
          { id: 'nocktest', error: null, result: { chain: 'main', difficulty: { 'proof-of-work': 8, 'proof-of-stake': 10 }}},
          { id: 'nocktest', error: null, result: { protocolversion: 1, connections: 1 }},
        ]));
      pool.setupSettings(() => {
        expect(configCopy.primary.address).toBe('RHP3VKiSYH4putQeSKLwr47QDdERa6H6G1');
        expect(pool.settings.testnet).toBe(false);
        expect(pool.statistics.difficulty).toBe(524288);
        done();
      });
    });
  });

  test('Test pool settings setup [6]', (done) => {
    const pool = new Pool(configCopy, configMainCopy, () => {});
    mockSetupDaemons(pool, () => {
      nock('http://127.0.0.1:9998')
        .post('/').reply(200, JSON.stringify([
          { id: 'nocktest', error: null, result: { isvalid: true, address: 'RHP3VKiSYH4putQeSKLwr47QDdERa6H6G1' }},
          { id: 'nocktest', error: null, result: { networkhashps: 0 }},
          { id: 'nocktest', error: null, result: { chain: 'test', difficulty: { 'proof-of-work': 8, 'proof-of-stake': 10 }}},
          { id: 'nocktest', error: null, result: { protocolversion: 1, connections: 1 }},
        ]));
      pool.setupSettings(() => {
        expect(configCopy.primary.address).toBe('RHP3VKiSYH4putQeSKLwr47QDdERa6H6G1');
        expect(pool.settings.testnet).toBe(true);
        expect(pool.statistics.difficulty).toBe(524288);
        done();
      });
    });
  });

  test('Test pool recipient setup [1]', (done) => {
    const pool = new Pool(configCopy, configMainCopy, () => {});
    mockSetupDaemons(pool, () => {
      mockSetupSettings(pool, () => {
        pool.setupRecipients();
        expect(pool.statistics.feePercentage).toBe(0.05);
        done();
      });
    });
  });

  test('Test pool recipient setup [2]', (done) => {
    configCopy.primary.recipients = [];
    const pool = new Pool(configCopy, configMainCopy, () => {});
    pool.on('pool.log', (type, text) => {
      expect(type).toBe('warning');
      expect(text).toBe('No recipients have been added, which means that no fees will be taken');
      done();
    });
    mockSetupDaemons(pool, () => {
      mockSetupSettings(pool, () => {
        pool.setupRecipients();
      });
    });
  });

  test('Test pool manager setup [1]', (done) => {
    const pool = new Pool(configCopy, configMainCopy, () => {});
    mockSetupDaemons(pool, () => {
      mockSetupSettings(pool, () => {
        pool.setupManager();
        expect(typeof pool.manager).toBe('object');
        expect(typeof pool.manager.handleTemplate).toBe('function');
        expect(pool.manager._eventsCount).toBe(3);
        done();
      });
    });
  });

  test('Test pool manager setup [2]', (done) => {
    const pool = new Pool(configCopy, configMainCopy, () => {});
    mockSetupDaemons(pool, () => {
      mockSetupSettings(pool, () => {
        pool.setupManager();
        pool.network = { broadcastMiningJobs: () => done() };
        pool.manager.emit('manager.block.new', rpcDataCopy);
      });
    });
  });

  test('Test pool manager setup [3]', (done) => {
    const pool = new Pool(configCopy, configMainCopy, () => {});
    mockSetupDaemons(pool, () => {
      mockSetupSettings(pool, () => {
        pool.setupManager();
        pool.manager.emit('manager.block.new', rpcDataCopy);
        done();
      });
    });
  });

  test('Test pool manager setup [4]', (done) => {
    const pool = new Pool(configCopy, configMainCopy, () => {});
    mockSetupDaemons(pool, () => {
      mockSetupSettings(pool, () => {
        pool.setupManager();
        pool.network = { broadcastMiningJobs: () => done() };
        pool.manager.emit('manager.block.updated', rpcDataCopy);
      });
    });
  });

  test('Test pool manager setup [5]', (done) => {
    const pool = new Pool(configCopy, configMainCopy, () => {});
    mockSetupDaemons(pool, () => {
      mockSetupSettings(pool, () => {
        pool.setupManager();
        pool.manager.emit('manager.block.updated', rpcDataCopy);
        done();
      });
    });
  });

  test('Test pool manager setup [6]', (done) => {
    const pool = new Pool(configCopy, configMainCopy, () => {});
    pool.on('pool.log', (type, text) => {
      expect(type).toBe('error');
      expect(text).toBe('RPC error with primary daemon instance (127.0.0.1) when submitting block: true');
      done();
    });
    mockSetupDaemons(pool, () => {
      mockSetupSettings(pool, () => {
        nock('http://127.0.0.1:9998')
          .post('/', (body) => body.method === 'submitblock')
          .reply(200, JSON.stringify({
            id: 'nocktest',
            error: true,
            result: null,
          }));
        pool.setupManager();
        const shareData = {
          job: 1,
          ip: 'ip_addr',
          port: 'port',
          addrPrimary: 'addr1',
          addrAuxiliary: 'addr2',
          blockDiff : 1,
          blockDiffActual: 1,
          blockType: 'primary',
          coinbase: null,
          difficulty: 1,
          hash: 'example blockhash',
          hex: Buffer.from('000011110000111100001111', 'hex'),
          header: null,
          headerDiff: null,
          height: 1,
          identifier: 'master',
          reward: 5000000000,
          shareDiff: 1,
        };
        const auxShareData = {
          job: 1,
          ip: 'ip_addr',
          port: 'port',
          addrPrimary: 'addr1',
          addrAuxiliary: 'addr2',
          blockDiff : 1,
          blockDiffActual: 1,
          blockType: 'auxiliary',
          coinbase: null,
          difficulty: 1,
          hash: 'example auxiliary blockhash',
          hex: Buffer.from('000011110000111100001111', 'hex'),
          header: null,
          headerDiff: null,
          identifier: 'master',
          shareDiff: 1,
        };
        pool.manager.emit('manager.share', shareData, auxShareData, true);
      });
    });
  });

  test('Test pool manager setup [7]', (done) => {
    const pool = new Pool(configCopy, configMainCopy, () => {});
    pool.on('pool.log', (type, text) => {
      expect(type).toBe('error');
      expect(text).toBe('Primary daemon instance (127.0.0.1) rejected a supposedly valid block');
      done();
    });
    mockSetupDaemons(pool, () => {
      mockSetupSettings(pool, () => {
        nock('http://127.0.0.1:9998')
          .post('/', (body) => body.method === 'submitblock')
          .reply(200, JSON.stringify({
            id: 'nocktest',
            error: null,
            result: 'rejected',
          }));
        pool.setupManager();
        const shareData = {
          job: 1,
          ip: 'ip_addr',
          port: 'port',
          addrPrimary: 'addr1',
          addrAuxiliary: 'addr2',
          blockDiff : 1,
          blockDiffActual: 1,
          blockType: 'primary',
          coinbase: null,
          difficulty: 1,
          hash: 'example blockhash',
          hex: Buffer.from('000011110000111100001111', 'hex'),
          header: null,
          headerDiff: null,
          height: 1,
          identifier: 'master',
          reward: 5000000000,
          shareDiff: 1,
        };
        const auxShareData = {
          job: 1,
          ip: 'ip_addr',
          port: 'port',
          addrPrimary: 'addr1',
          addrAuxiliary: 'addr2',
          blockDiff : 1,
          blockDiffActual: 1,
          blockType: 'auxiliary',
          coinbase: null,
          difficulty: 1,
          hash: 'example auxiliary blockhash',
          hex: Buffer.from('000011110000111100001111', 'hex'),
          header: null,
          headerDiff: null,
          identifier: 'master',
          shareDiff: 1,
        };
        pool.manager.emit('manager.share', shareData, auxShareData, true);
      });
    });
  });

  test('Test pool manager setup [8]', (done) => {
    const response = [];
    const pool = new Pool(configCopy, configMainCopy, () => {});
    pool.on('pool.log', (type, text) => {
      response.push([type, text]);
      if (response.length === 2) {
        expect(response[0][0]).toBe('special');
        expect(response[0][1]).toBe('Submitted a primary block (Raptoreum:1) successfully to Raptoreum\'s daemon instance(s)');
        expect(response[1][0]).toBe('error');
        expect(response[1][1]).toBe('The block was rejected by the network');
        done();
      }
    });
    mockSetupDaemons(pool, () => {
      mockSetupSettings(pool, () => {
        pool.on('pool.share', (data, type) => {
          expect(type).toBe(true);
          nock('http://127.0.0.1:9998')
            .post('/', (body) => body.method === 'getblocktemplate')
            .reply(200, JSON.stringify({
              id: 'nocktest',
              error: null,
              result: rpcDataCopy,
            }));
        });
        nock('http://127.0.0.1:9998')
          .post('/', (body) => body.method === 'submitblock')
          .reply(200, JSON.stringify({
            id: 'nocktest',
            error: null,
            result: null,
          }));
        nock('http://127.0.0.1:9998')
          .post('/', (body) => body.method === 'getblock')
          .reply(200, JSON.stringify({
            id: 'nocktest',
            error: null,
            result: null,
          }));
        pool.setupManager();
        const shareData = {
          job: 1,
          ip: 'ip_addr',
          port: 'port',
          addrPrimary: 'addr1',
          addrAuxiliary: 'addr2',
          blockDiff : 1,
          blockDiffActual: 1,
          blockType: 'primary',
          coinbase: null,
          difficulty: 1,
          hash: 'example blockhash',
          hex: Buffer.from('000011110000111100001111', 'hex'),
          header: null,
          headerDiff: null,
          height: 1,
          identifier: 'master',
          reward: 5000000000,
          shareDiff: 1,
        };
        const auxShareData = {
          job: 1,
          ip: 'ip_addr',
          port: 'port',
          addrPrimary: 'addr1',
          addrAuxiliary: 'addr2',
          blockDiff : 1,
          blockDiffActual: 1,
          blockType: 'auxiliary',
          coinbase: null,
          difficulty: 1,
          hash: 'example auxiliary blockhash',
          hex: Buffer.from('000011110000111100001111', 'hex'),
          header: null,
          headerDiff: null,
          identifier: 'master',
          shareDiff: 1,
        };
        pool.manager.emit('manager.share', shareData, auxShareData, true);
      });
    });
  });

  test('Test pool manager setup [9]', (done) => {
    const response = [];
    const pool = new Pool(configCopy, configMainCopy, () => {});
    pool.on('pool.log', (type, text) => {
      response.push([type, text]);
      if (response.length === 2) {
        expect(response[0][0]).toBe('special');
        expect(response[0][1]).toBe('Submitted a primary block (Raptoreum:1) successfully to Raptoreum\'s daemon instance(s)');
        expect(response[1][0]).toBe('special');
        expect(response[1][1]).toBe('Block notification via RPC after primary block submission');
        done();
      }
    });
    mockSetupDaemons(pool, () => {
      mockSetupSettings(pool, () => {
        pool.on('pool.share', (data, type) => {
          expect(type).toBe(true);
          nock('http://127.0.0.1:9998')
            .post('/', (body) => body.method === 'getblocktemplate')
            .reply(200, JSON.stringify({
              id: 'nocktest',
              error: null,
              result: rpcDataCopy,
            }));
        });
        nock('http://127.0.0.1:9998')
          .post('/', (body) => body.method === 'submitblock')
          .reply(200, JSON.stringify({
            id: 'nocktest',
            error: null,
            result: null,
          }));
        nock('http://127.0.0.1:9998')
          .post('/', (body) => body.method === 'getblock')
          .reply(200, JSON.stringify({
            id: 'nocktest',
            error: null,
            result: {
              hash: 'example blockhash',
              tx: 'example transaction',
              confirmations: 1,
            },
          }));
        pool.setupManager();
        const shareData = {
          job: 1,
          ip: 'ip_addr',
          port: 'port',
          addrPrimary: 'addr1',
          addrAuxiliary: 'addr2',
          blockDiff : 1,
          blockDiffActual: 1,
          blockType: 'primary',
          coinbase: null,
          difficulty: 1,
          hash: 'example blockhash',
          hex: Buffer.from('000011110000111100001111', 'hex'),
          header: null,
          headerDiff: null,
          height: 1,
          identifier: 'master',
          reward: 5000000000,
          shareDiff: 1,
        };
        const auxShareData = {
          job: 1,
          ip: 'ip_addr',
          port: 'port',
          addrPrimary: 'addr1',
          addrAuxiliary: 'addr2',
          blockDiff : 1,
          blockDiffActual: 1,
          blockType: 'auxiliary',
          coinbase: null,
          difficulty: 1,
          hash: 'example auxiliary blockhash',
          hex: Buffer.from('000011110000111100001111', 'hex'),
          header: null,
          headerDiff: null,
          identifier: 'master',
          shareDiff: 1,
        };
        pool.manager.emit('manager.share', shareData, auxShareData, true);
      });
    });
  });

  test('Test pool manager setup [10]', (done) => {
    const response = [];
    const pool = new Pool(configCopy, configMainCopy, () => {});
    pool.on('pool.log', (type, text) => {
      response.push([type, text]);
      if (response.length === 2) {
        expect(response[0][0]).toBe('special');
        expect(response[0][1]).toBe('Submitted a primary block (Raptoreum:1) successfully to Raptoreum\'s daemon instance(s)');
        expect(response[1][0]).toBe('error');
        expect(response[1][1]).toBe('RPC error with primary daemon instance (127.0.0.1) when requesting a primary template update: true');
        done();
      }
    });
    mockSetupDaemons(pool, () => {
      mockSetupSettings(pool, () => {
        pool.on('pool.share', (data, type) => {
          expect(type).toBe(true);
          nock('http://127.0.0.1:9998')
            .post('/', (body) => body.method === 'getblocktemplate')
            .reply(200, JSON.stringify({
              id: 'nocktest',
              error: true,
              result: null,
            }));
        });
        nock('http://127.0.0.1:9998')
          .post('/', (body) => body.method === 'submitblock')
          .reply(200, JSON.stringify({
            id: 'nocktest',
            error: null,
            result: null,
          }));
        nock('http://127.0.0.1:9998')
          .post('/', (body) => body.method === 'getblock')
          .reply(200, JSON.stringify({
            id: 'nocktest',
            error: null,
            result: {
              hash: 'example blockhash',
              tx: 'example transaction',
              confirmations: 1,
            },
          }));
        pool.setupManager();
        const shareData = {
          job: 1,
          ip: 'ip_addr',
          port: 'port',
          addrPrimary: 'addr1',
          addrAuxiliary: 'addr2',
          blockDiff : 1,
          blockDiffActual: 1,
          blockType: 'primary',
          coinbase: null,
          difficulty: 1,
          hash: 'example blockhash',
          hex: Buffer.from('000011110000111100001111', 'hex'),
          header: null,
          headerDiff: null,
          height: 1,
          identifier: 'master',
          reward: 5000000000,
          shareDiff: 1,
        };
        const auxShareData = {
          job: 1,
          ip: 'ip_addr',
          port: 'port',
          addrPrimary: 'addr1',
          addrAuxiliary: 'addr2',
          blockDiff : 1,
          blockDiffActual: 1,
          blockType: 'auxiliary',
          coinbase: null,
          difficulty: 1,
          hash: 'example auxiliary blockhash',
          hex: Buffer.from('000011110000111100001111', 'hex'),
          header: null,
          headerDiff: null,
          identifier: 'master',
          shareDiff: 1,
        };
        pool.manager.emit('manager.share', shareData, auxShareData, true);
      });
    });
  });

  test('Test pool manager setup [11]', (done) => {
    const pool = new Pool(configCopy, configMainCopy, () => {});
    pool.on('pool.log', (type, text) => {
      expect(type).toBe('error');
      expect(text).toBe('RPC error with primary daemon instance (127.0.0.1) when requesting a primary template update: true');
      done();
    });
    mockSetupDaemons(pool, () => {
      mockSetupSettings(pool, () => {
        pool.on('pool.share', (data, type) => {
          expect(type).toBe(true);
          nock('http://127.0.0.1:9998')
            .post('/', (body) => body.method === 'getblocktemplate')
            .reply(200, JSON.stringify({
              id: 'nocktest',
              error: true,
              result: null,
            }));
        });
        pool.setupManager();
        const shareData = {
          job: 1,
          ip: 'ip_addr',
          port: 'port',
          addrPrimary: 'addr1',
          addrAuxiliary: 'addr2',
          blockDiff : 1,
          blockDiffActual: 1,
          blockType: 'primary',
          coinbase: null,
          difficulty: 1,
          hash: 'example blockhash',
          hex: Buffer.from('000011110000111100001111', 'hex'),
          header: null,
          headerDiff: null,
          height: 1,
          identifier: 'master',
          reward: 5000000000,
          shareDiff: 1,
        };
        const auxShareData = {
          job: 1,
          ip: 'ip_addr',
          port: 'port',
          addrPrimary: 'addr1',
          addrAuxiliary: 'addr2',
          blockDiff : 1,
          blockDiffActual: 1,
          blockType: 'auxiliary',
          coinbase: null,
          difficulty: 1,
          hash: 'example auxiliary blockhash',
          hex: Buffer.from('000011110000111100001111', 'hex'),
          header: null,
          headerDiff: null,
          identifier: 'master',
          shareDiff: 1,
        };
        pool.manager.emit('manager.share', shareData, auxShareData, false);
      });
    });
  });

  test('Test pool manager setup [12]', (done) => {
    const pool = new Pool(configCopy, configMainCopy, () => {});
    pool.on('pool.log', (type, text) => {
      expect(type).toBe('error');
      expect(text).toBe('RPC error with primary daemon instance (127.0.0.1) when requesting a primary template update: true');
      done();
    });
    mockSetupDaemons(pool, () => {
      mockSetupSettings(pool, () => {
        pool.on('pool.share', (data, type) => {
          expect(type).toBe(false);
          nock('http://127.0.0.1:9998')
            .post('/', (body) => body.method === 'getblocktemplate')
            .reply(200, JSON.stringify({
              id: 'nocktest',
              error: true,
              result: null,
            }));
        });
        pool.setupManager();
        const shareData = {
          job: 1,
          ip: 'ip_addr',
          port: 'port',
          addrPrimary: 'addr1',
          addrAuxiliary: 'addr2',
          difficulty: 1,
          identifier: 'master',
          error: 'job not found',
        };
        pool.manager.emit('manager.share', shareData, null, false);
      });
    });
  });

  test('Test pool manager setup [13]', (done) => {
    const pool = new Pool(configCopy, configMainCopy, () => {});
    pool.on('pool.log', (type, text) => {
      expect(type).toBe('error');
      expect(text).toBe('RPC error with primary daemon instance (127.0.0.1) when requesting a primary template update: true');
      done();
    });
    mockSetupDaemons(pool, () => {
      mockSetupSettings(pool, () => {
        pool.on('pool.share', (data, type) => {
          expect(type).toBe(false);
          nock('http://127.0.0.1:9998')
            .post('/', (body) => body.method === 'getblocktemplate')
            .reply(200, JSON.stringify({
              id: 'nocktest',
              error: true,
              result: null,
            }));
        });
        pool.setupManager();
        const shareData = {
          job: 1,
          ip: 'ip_addr',
          port: 'port',
          addrPrimary: 'addr1',
          addrAuxiliary: 'addr2',
          difficulty: 1,
          identifier: 'master',
          error: 'invalid share',
        };
        pool.manager.emit('manager.share', shareData, null, false);
      });
    });
  });

  test('Test pool blockchain setup [1]', (done) => {
    const pool = new Pool(configCopy, configMainCopy, () => {});
    mockSetupDaemons(pool, () => {
      mockSetupSettings(pool, () => {
        nock('http://127.0.0.1:9998')
          .post('/', (body) => body.method === 'getblocktemplate')
          .reply(200, JSON.stringify({
            id: 'nocktest',
            error: null,
            result: rpcDataCopy,
          }));
        pool.setupPrimaryBlockchain(() => {
          done();
        });
      });
    });
  });

  test('Test pool blockchain setup [2]', (done) => {
    const pool = new Pool(configCopy, configMainCopy, () => {});
    pool.on('pool.log', (type, text) => {
      expect(type).toBe('warning');
      expect(text).toBe('Downloaded 100.00% of blockchain from 1 peers');
      done();
    });
    mockSetupDaemons(pool, () => {
      mockSetupSettings(pool, () => {
        nock('http://127.0.0.1:9998')
          .post('/', (body) => body.method === 'getblocktemplate')
          .reply(200, JSON.stringify({
            id: 'nocktest',
            error: { code: -10 },
            result: null,
          }));
        nock('http://127.0.0.1:9998')
          .post('/', (body) => body.method === 'getblockchaininfo')
          .reply(200, JSON.stringify({
            id: 'nocktest',
            error: null,
            result: blockchainDataCopy,
          }));
        nock('http://127.0.0.1:9998')
          .post('/', (body) => body.method === 'getpeerinfo')
          .reply(200, JSON.stringify({
            id: 'nocktest',
            error: null,
            result: [peerDataCopy],
          }));
        pool.setupPrimaryBlockchain(() => {});
      });
    });
  });

  test('Test pool blockchain setup [3]', (done) => {
    configCopy.auxiliary = auxiliaryConfig;
    configCopy.auxiliary.daemons = auxiliaryDaemons;
    const pool = new Pool(configCopy, configMainCopy, () => {});
    mockSetupDaemons(pool, () => {
      mockSetupSettings(pool, () => {
        nock('http://127.0.0.1:9996')
          .post('/', (body) => body.method === 'getauxblock')
          .reply(200, JSON.stringify({
            id: 'nocktest',
            error: null,
            result: auxDataCopy,
          }));
        pool.setupAuxiliaryBlockchain(() => {
          done();
        });
      });
    });
  });

  test('Test pool blockchain setup [4]', (done) => {
    configCopy.auxiliary = auxiliaryConfig;
    configCopy.auxiliary.daemons = auxiliaryDaemons;
    const pool = new Pool(configCopy, configMainCopy, () => {});
    pool.on('pool.log', (type, text) => {
      expect(type).toBe('warning');
      expect(text).toBe('Downloaded 100.00% of blockchain from 1 peers');
      done();
    });
    mockSetupDaemons(pool, () => {
      mockSetupSettings(pool, () => {
        nock('http://127.0.0.1:9996')
          .post('/', (body) => body.method === 'getauxblock')
          .reply(200, JSON.stringify({
            id: 'nocktest',
            error: { code: -10 },
            result: null,
          }));
        nock('http://127.0.0.1:9996')
          .post('/', (body) => body.method === 'getblockchaininfo')
          .reply(200, JSON.stringify({
            id: 'nocktest',
            error: null,
            result: blockchainDataCopy,
          }));
        nock('http://127.0.0.1:9996')
          .post('/', (body) => body.method === 'getpeerinfo')
          .reply(200, JSON.stringify({
            id: 'nocktest',
            error: null,
            result: [peerDataCopy],
          }));
        pool.setupAuxiliaryBlockchain(() => {});
      });
    });
  });

  test('Test pool blockchain setup [5]', (done) => {
    const pool = new Pool(configCopy, configMainCopy, () => {});
    mockSetupDaemons(pool, () => {
      mockSetupSettings(pool, () => {
        nock('http://127.0.0.1:9996')
          .post('/', (body) => body.method === 'getauxblock')
          .reply(200, JSON.stringify({
            id: 'nocktest',
            error: null,
            result: auxDataCopy,
          }));
        pool.setupAuxiliaryBlockchain(() => {
          done();
        });
      });
    });
  });

  test('Test pool first job setup [1]', (done) => {
    const pool = new Pool(configCopy, configMainCopy, () => {});
    mockSetupDaemons(pool, () => {
      mockSetupSettings(pool, () => {
        pool.setupManager();
        mockSetupPrimaryBlockchain(pool, () => {
          mockSetupAuxiliaryBlockchain(pool, () => {
            nock('http://127.0.0.1:9998')
              .post('/', (body) => body.method === 'getblocktemplate')
              .reply(200, JSON.stringify({
                id: 'nocktest',
                error: null,
                result: rpcDataCopy,
              }));
            pool.setupFirstJob(() => {
              expect(typeof pool.manager.currentJob).toBe('object');
              expect(pool.manager.currentJob.rpcData.height).toBe(1);
              done();
            });
          });
        });
      });
    });
  });

  test('Test pool first job setup [2]', (done) => {
    const response = [];
    const pool = new Pool(configCopy, configMainCopy, () => {});
    pool.on('pool.log', (type, text) => {
      response.push([type, text]);
      if (response.length === 2) {
        expect(response[0][0]).toBe('error');
        expect(response[0][1]).toBe('RPC error with primary daemon instance (127.0.0.1) when requesting a primary template update: true');
        expect(response[1][0]).toBe('error');
        expect(response[1][1]).toBe('RPC error with primary daemon instance when creating the first job');
        done();
      }
    });
    mockSetupDaemons(pool, () => {
      mockSetupSettings(pool, () => {
        pool.setupManager();
        mockSetupPrimaryBlockchain(pool, () => {
          mockSetupAuxiliaryBlockchain(pool, () => {
            nock('http://127.0.0.1:9998')
              .post('/', (body) => body.method === 'getblocktemplate')
              .reply(200, JSON.stringify({
                id: 'nocktest',
                error: true,
                result: null,
              }));
            pool.setupFirstJob(() => {});
          });
        });
      });
    });
  });

  test('Test pool first job setup [3]', (done) => {
    const pool = new Pool(configCopy, configMainCopy, () => {});
    pool.on('pool.log', (type, text) => {
      expect(type).toBe('warning');
      expect(text).toBe('Network difficulty (0) is lower than the difficulty on port 3002 (32)');
      done();
    });
    mockSetupDaemons(pool, () => {
      mockSetupSettings(pool, () => {
        pool.setupManager();
        mockSetupPrimaryBlockchain(pool, () => {
          mockSetupAuxiliaryBlockchain(pool, () => {
            nock('http://127.0.0.1:9998')
              .post('/', (body) => body.method === 'getblocktemplate')
              .reply(200, JSON.stringify({
                id: 'nocktest',
                error: null,
                result: rpcDataCopy,
              }));
            pool.setupFirstJob(() => {});
          });
        });
      });
    });
  });

  test('Test pool first job setup [4]', (done) => {
    const pool = new Pool(configCopy, configMainCopy, () => {});
    mockSetupDaemons(pool, () => {
      mockSetupSettings(pool, () => {
        pool.setupManager();
        pool.statistics.difficulty = 400;
        mockSetupPrimaryBlockchain(pool, () => {
          mockSetupAuxiliaryBlockchain(pool, () => {
            nock('http://127.0.0.1:9998')
              .post('/', (body) => body.method === 'getblocktemplate')
              .reply(200, JSON.stringify({
                id: 'nocktest',
                error: null,
                result: rpcDataCopy,
              }));
            pool.setupFirstJob(() => done());
          });
        });
      });
    });
  });

  test('Test pool block polling setup [1]', (done) => {
    rpcDataCopy.height = 2;
    rpcDataCopy.previousblockhash = '1d5af7e2ad9aeccb110401761938c07a5895d85711c9c5646661a10407c82769';
    const response = [];
    const pool = new Pool(configCopy, configMainCopy, () => {});
    pool.on('pool.log', (type, text) => {
      response.push([type, text]);
      if (response.length === 2) {
        expect(response[0][0]).toBe('warning');
        expect(response[0][1]).toBe('Network difficulty (0) is lower than the difficulty on port 3002 (32)');
        expect(response[1][0]).toBe('log');
        expect(response[1][1]).toBe('Requested template from primary chain (Raptoreum:2) via RPC polling');
        done();
      }
    });
    mockSetupDaemons(pool, () => {
      mockSetupSettings(pool, () => {
        pool.setupManager();
        mockSetupPrimaryBlockchain(pool, () => {
          mockSetupAuxiliaryBlockchain(pool, () => {
            mockSetupFirstJob(pool, () => {
              nock('http://127.0.0.1:9998')
                .persist()
                .post('/', (body) => body.method === 'getblocktemplate')
                .reply(200, JSON.stringify({
                  id: 'nocktest',
                  error: null,
                  result: rpcDataCopy,
                }));
              nock('http://127.0.0.1:9998')
                .persist()
                .post('/', (body) => body.method === 'getblockchaininfo')
                .reply(200, JSON.stringify({
                  id: 'nocktest',
                  error: null,
                  result: blockchainDataCopy,
                }));
              pool.setupBlockPolling();
            });
          });
        });
      });
    });
  });

  test('Test pool block polling setup [2]', (done) => {
    auxDataCopy.height = 2;
    auxDataCopy.hash = '1d5af7e2ad9aeccb110401761938c07a5895d85711c9c5646661a10407c82769';
    configCopy.auxiliary = auxiliaryConfig;
    configCopy.auxiliary.daemons = auxiliaryDaemons;
    const response = [];
    const pool = new Pool(configCopy, configMainCopy, () => {});
    pool.on('pool.log', (type, text) => {
      response.push([type, text]);
      if (response.length === 3) {
        expect(response[0][0]).toBe('warning');
        expect(response[0][1]).toBe('Network difficulty (0) is lower than the difficulty on port 3002 (32)');
        expect(response[1][0]).toBe('log');
        expect(response[1][1]).toBe('Requested template from primary chain (Raptoreum:1) via RPC polling');
        expect(response[2][0]).toBe('log');
        expect(response[2][1]).toBe('Requested template from auxiliary chain (Namecoin:2) via RPC polling');
        done();
      }
    });
    mockSetupDaemons(pool, () => {
      mockSetupSettings(pool, () => {
        pool.setupManager();
        mockSetupPrimaryBlockchain(pool, () => {
          mockSetupAuxiliaryBlockchain(pool, () => {
            mockSetupFirstJob(pool, () => {
              nock('http://127.0.0.1:9998')
                .persist()
                .post('/', (body) => body.method === 'getblocktemplate')
                .reply(200, JSON.stringify({
                  id: 'nocktest',
                  error: null,
                  result: rpcDataCopy,
                }));
              nock('http://127.0.0.1:9996')
                .persist()
                .post('/', (body) => body.method === 'getauxblock')
                .reply(200, JSON.stringify({
                  id: 'nocktest',
                  error: null,
                  result: auxDataCopy,
                }));
              nock('http://127.0.0.1:9998')
                .persist()
                .post('/', (body) => body.method === 'getblockchaininfo')
                .reply(200, JSON.stringify({
                  id: 'nocktest',
                  error: null,
                  result: blockchainDataCopy,
                }));
              nock('http://127.0.0.1:9996')
                .persist()
                .post('/', (body) => body.method === 'getblockchaininfo')
                .reply(200, JSON.stringify({
                  id: 'nocktest',
                  error: null,
                  result: blockchainDataCopy,
                }));
              pool.setupBlockPolling();
            });
          });
        });
      });
    });
  });

  test('Test pool block polling setup [3]', (done) => {
    auxDataCopy.height = 2;
    auxDataCopy.hash = '1d5af7e2ad9aeccb110401761938c07a5895d85711c9c5646661a10407c82769';
    configCopy.auxiliary = auxiliaryConfig;
    configCopy.auxiliary.daemons = auxiliaryDaemons;
    const response = [];
    const pool = new Pool(configCopy, configMainCopy, () => {});
    pool.on('pool.log', (type, text) => {
      response.push([type, text]);
      if (response.length === 2) {
        expect(response[0][0]).toBe('warning');
        expect(response[0][1]).toBe('Network difficulty (0) is lower than the difficulty on port 3002 (32)');
        expect(response[1][0]).toBe('error');
        expect(response[1][1]).toBe('RPC error with auxiliary daemon instance (127.0.0.1) when requesting an auxiliary template update: true');
        done();
      }
    });
    mockSetupDaemons(pool, () => {
      mockSetupSettings(pool, () => {
        pool.setupManager();
        mockSetupPrimaryBlockchain(pool, () => {
          mockSetupAuxiliaryBlockchain(pool, () => {
            mockSetupFirstJob(pool, () => {
              nock('http://127.0.0.1:9998')
                .persist()
                .post('/', (body) => body.method === 'getblocktemplate')
                .reply(200, JSON.stringify({
                  id: 'nocktest',
                  error: null,
                  result: rpcDataCopy,
                }));
              nock('http://127.0.0.1:9996')
                .persist()
                .post('/', (body) => body.method === 'getauxblock')
                .reply(200, JSON.stringify({
                  id: 'nocktest',
                  error: true,
                  result: null,
                }));
              nock('http://127.0.0.1:9998')
                .persist()
                .post('/', (body) => body.method === 'getblockchaininfo')
                .reply(200, JSON.stringify({
                  id: 'nocktest',
                  error: null,
                  result: blockchainDataCopy,
                }));
              nock('http://127.0.0.1:9996')
                .persist()
                .post('/', (body) => body.method === 'getblockchaininfo')
                .reply(200, JSON.stringify({
                  id: 'nocktest',
                  error: null,
                  result: blockchainDataCopy,
                }));
              pool.setupBlockPolling();
            });
          });
        });
      });
    });
  });

  test('Test pool block polling setup [4]', (done) => {
    auxDataCopy.height = 2;
    auxDataCopy.hash = '1d5af7e2ad9aeccb110401761938c07a5895d85711c9c5646661a10407c82769';
    auxDataCopy._target = auxDataCopy.target;
    auxDataCopy.target = null;
    configCopy.auxiliary = auxiliaryConfig;
    configCopy.auxiliary.daemons = auxiliaryDaemons;
    const response = [];
    const pool = new Pool(configCopy, configMainCopy, () => {});
    pool.on('pool.log', (type, text) => {
      response.push([type, text]);
      if (response.length === 3) {
        expect(response[0][0]).toBe('warning');
        expect(response[0][1]).toBe('Network difficulty (0) is lower than the difficulty on port 3002 (32)');
        expect(response[1][0]).toBe('log');
        expect(response[1][1]).toBe('Requested template from primary chain (Raptoreum:1) via RPC polling');
        expect(response[2][0]).toBe('log');
        expect(response[2][1]).toBe('Requested template from auxiliary chain (Namecoin:2) via RPC polling');
        done();
      }
    });
    mockSetupDaemons(pool, () => {
      mockSetupSettings(pool, () => {
        pool.setupManager();
        mockSetupPrimaryBlockchain(pool, () => {
          mockSetupAuxiliaryBlockchain(pool, () => {
            mockSetupFirstJob(pool, () => {
              nock('http://127.0.0.1:9998')
                .persist()
                .post('/', (body) => body.method === 'getblocktemplate')
                .reply(200, JSON.stringify({
                  id: 'nocktest',
                  error: null,
                  result: rpcDataCopy,
                }));
              nock('http://127.0.0.1:9996')
                .persist()
                .post('/', (body) => body.method === 'getauxblock')
                .reply(200, JSON.stringify({
                  id: 'nocktest',
                  error: null,
                  result: auxDataCopy,
                }));
              nock('http://127.0.0.1:9998')
                .persist()
                .post('/', (body) => body.method === 'getblockchaininfo')
                .reply(200, JSON.stringify({
                  id: 'nocktest',
                  error: null,
                  result: blockchainDataCopy,
                }));
              nock('http://127.0.0.1:9996')
                .persist()
                .post('/', (body) => body.method === 'getblockchaininfo')
                .reply(200, JSON.stringify({
                  id: 'nocktest',
                  error: null,
                  result: blockchainDataCopy,
                }));
              pool.setupBlockPolling();
            });
          });
        });
      });
    });
  });

  test('Test pool stratum setup [1]', (done) => {
    const pool = new Pool(configCopy, configMainCopy, () => {});
    mockSetupDaemons(pool, () => {
      mockSetupSettings(pool, () => {
        pool.setupManager();
        mockSetupPrimaryBlockchain(pool, () => {
          mockSetupAuxiliaryBlockchain(pool, () => {
            mockSetupFirstJob(pool, () => {
              pool.setupNetwork(() => {
                pool.network.on('network.stopped', () => done());
                expect(typeof pool.network).toBe('object');
                expect(typeof pool.network.handleClient).toBe('function');
                expect(typeof pool.network.broadcastMiningJobs).toBe('function');
                expect(pool.network._eventsCount).toBe(4);
                pool.network.stopNetwork();
              });
            });
          });
        });
      });
    });
  });

  test('Test pool stratum setup [2]', (done) => {
    const response = [];
    const pool = new Pool(configCopy, configMainCopy, () => {});
    pool.on('pool.log', (type, text) => {
      response.push([type, text]);
      if (response.length === 2) {
        pool.network.on('network.stopped', () => done());
        expect(response[0][0]).toBe('warning');
        expect(response[0][1]).toBe('Network difficulty (0) is lower than the difficulty on port 3002 (32)');
        expect(response[1][0]).toBe('debug');
        expect(response[1][1]).toBe('No new blocks for 60 seconds. Updating transactions and rebroadcasting work');
        pool.network.stopNetwork();
      }
    });
    mockSetupDaemons(pool, () => {
      mockSetupSettings(pool, () => {
        pool.setupManager();
        mockSetupPrimaryBlockchain(pool, () => {
          mockSetupAuxiliaryBlockchain(pool, () => {
            mockSetupFirstJob(pool, () => {
              pool.setupNetwork(() => {
                nock('http://127.0.0.1:9998')
                  .post('/', (body) => body.method === 'getblocktemplate')
                  .reply(200, JSON.stringify({
                    id: 'nocktest',
                    error: null,
                    result: rpcDataCopy,
                  }));
                pool.network.emit('network.timeout');
              });
            });
          });
        });
      });
    });
  });

  test('Test pool stratum setup [3]', (done) => {
    const response = [];
    const pool = new Pool(configCopy, configMainCopy, () => {});
    pool.on('pool.log', (type, text) => {
      response.push([type, text]);
      if (response.length === 3) {
        pool.network.on('network.stopped', () => done());
        expect(response[0][0]).toBe('warning');
        expect(response[0][1]).toBe('Network difficulty (0) is lower than the difficulty on port 3002 (32)');
        expect(response[2][0]).toBe('debug');
        expect(response[2][1]).toBe('No new blocks for 60 seconds. Updating transactions and rebroadcasting work');
        pool.network.stopNetwork();
      }
    });
    mockSetupDaemons(pool, () => {
      mockSetupSettings(pool, () => {
        pool.setupManager();
        mockSetupPrimaryBlockchain(pool, () => {
          mockSetupAuxiliaryBlockchain(pool, () => {
            mockSetupFirstJob(pool, () => {
              pool.setupNetwork(() => {
                nock('http://127.0.0.1:9998')
                  .post('/', (body) => body.method === 'getblocktemplate')
                  .reply(200, JSON.stringify({
                    id: 'nocktest',
                    error: true,
                    result: null,
                  }));
                pool.network.emit('network.timeout');
              });
            });
          });
        });
      });
    });
  });

  test('Test pool stratum setup [4]', (done) => {
    const client = mockClient();
    const pool = new Pool(configCopy, configMainCopy, () => {});
    pool.on('client.socket.success', () => {
      pool.network.on('network.stopped', () => done());
      pool.network.stopNetwork();
    });
    mockSetupDaemons(pool, () => {
      mockSetupSettings(pool, () => {
        pool.setupManager();
        mockSetupPrimaryBlockchain(pool, () => {
          mockSetupAuxiliaryBlockchain(pool, () => {
            mockSetupFirstJob(pool, () => {
              pool.setupNetwork(() => {
                pool.network.emit('client.connected', client);
              });
            });
          });
        });
      });
    });
  });

  test('Test pool stratum setup [5]', (done) => {
    const client = mockClient();
    const pool = new Pool(configCopy, configMainCopy, () => {});
    mockSetupDaemons(pool, () => {
      mockSetupSettings(pool, () => {
        pool.setupManager();
        mockSetupPrimaryBlockchain(pool, () => {
          mockSetupAuxiliaryBlockchain(pool, () => {
            mockSetupFirstJob(pool, () => {
              pool.setupNetwork(() => {
                pool.difficulty['3002'] = { handleClient: () => {
                  pool.network.on('network.stopped', () => done());
                  pool.network.stopNetwork();
                }};
                pool.network.emit('client.connected', client);
              });
            });
          });
        });
      });
    });
  });

  test('Test pool stratum setup [6]', (done) => {
    const response = [];
    const client = mockClient();
    const pool = new Pool(configCopy, configMainCopy, () => {});
    pool.on('pool.log', (type, text) => {
      response.push([type, text]);
      if (response.length === 2) {
        pool.network.on('network.stopped', () => done());
        expect(response[0][0]).toBe('warning');
        expect(response[0][1]).toBe('Network difficulty (0) is lower than the difficulty on port 3002 (32)');
        expect(response[1][0]).toBe('log');
        expect(response[1][1]).toBe('Difficulty update queued for worker: RHP3VKiSYH4putQeSKLwr47QDdERa6H6G1 (8)');
        pool.network.stopNetwork();
      }
    });
    pool.on('client.socket.success', () => {
      client.emit('client.difficulty.queued', 8);
    });
    mockSetupDaemons(pool, () => {
      mockSetupSettings(pool, () => {
        pool.setupManager();
        mockSetupPrimaryBlockchain(pool, () => {
          mockSetupAuxiliaryBlockchain(pool, () => {
            mockSetupFirstJob(pool, () => {
              pool.setupNetwork(() => {
                pool.network.emit('client.connected', client);
              });
            });
          });
        });
      });
    });
  });

  test('Test pool stratum setup [7]', (done) => {
    const response = [];
    const client = mockClient();
    const pool = new Pool(configCopy, configMainCopy, () => {});
    pool.on('pool.log', (type, text) => {
      response.push([type, text]);
      if (response.length === 2) {
        pool.network.on('network.stopped', () => done());
        expect(response[0][0]).toBe('warning');
        expect(response[0][1]).toBe('Network difficulty (0) is lower than the difficulty on port 3002 (32)');
        expect(response[1][0]).toBe('log');
        expect(response[1][1]).toBe('Difficulty updated successfully for worker: RHP3VKiSYH4putQeSKLwr47QDdERa6H6G1 (8)');
        pool.network.stopNetwork();
      }
    });
    pool.on('client.socket.success', () => {
      pool.difficulty[client.socket.localPort] = { clients: { 'test': ['test'] }};
      client.emit('client.difficulty.updated', 8);
    });
    mockSetupDaemons(pool, () => {
      mockSetupSettings(pool, () => {
        pool.setupManager();
        mockSetupPrimaryBlockchain(pool, () => {
          mockSetupAuxiliaryBlockchain(pool, () => {
            mockSetupFirstJob(pool, () => {
              pool.setupNetwork(() => {
                pool.network.emit('client.connected', client);
              });
            });
          });
        });
      });
    });
  });

  test('Test pool stratum setup [8]', (done) => {
    const response = [];
    const client = mockClient();
    const pool = new Pool(configCopy, configMainCopy, () => {});
    pool.on('pool.log', (type, text) => {
      response.push([type, text]);
      if (response.length === 2) {
        pool.network.on('network.stopped', () => done());
        expect(response[0][0]).toBe('warning');
        expect(response[0][1]).toBe('Network difficulty (0) is lower than the difficulty on port 3002 (32)');
        expect(response[1][0]).toBe('warning');
        expect(response[1][1]).toBe('A client (client [example]) sent a malformed message to the server: test');
        pool.network.stopNetwork();
      }
    });
    pool.on('client.socket.success', () => {
      client.emit('client.socket.malformed', 'test');
    });
    mockSetupDaemons(pool, () => {
      mockSetupSettings(pool, () => {
        pool.setupManager();
        mockSetupPrimaryBlockchain(pool, () => {
          mockSetupAuxiliaryBlockchain(pool, () => {
            mockSetupFirstJob(pool, () => {
              pool.setupNetwork(() => {
                pool.network.emit('client.connected', client);
              });
            });
          });
        });
      });
    });
  });

  test('Test pool stratum setup [9]', (done) => {
    const response = [];
    const client = mockClient();
    const pool = new Pool(configCopy, configMainCopy, () => {});
    pool.on('pool.log', (type, text) => {
      response.push([type, text]);
      if (response.length === 2) {
        pool.network.on('network.stopped', () => done());
        expect(response[0][0]).toBe('warning');
        expect(response[0][1]).toBe('Network difficulty (0) is lower than the difficulty on port 3002 (32)');
        expect(response[1][0]).toBe('warning');
        expect(response[1][1]).toBe('Socket flooding was detected from a client (client [example])');
        pool.network.stopNetwork();
      }
    });
    pool.on('client.socket.success', () => {
      client.emit('client.socket.flooded');
    });
    mockSetupDaemons(pool, () => {
      mockSetupSettings(pool, () => {
        pool.setupManager();
        mockSetupPrimaryBlockchain(pool, () => {
          mockSetupAuxiliaryBlockchain(pool, () => {
            mockSetupFirstJob(pool, () => {
              pool.setupNetwork(() => {
                pool.network.emit('client.connected', client);
              });
            });
          });
        });
      });
    });
  });

  test('Test pool stratum setup [10]', (done) => {
    const response = [];
    const client = mockClient();
    const pool = new Pool(configCopy, configMainCopy, () => {});
    pool.on('pool.log', (type, text) => {
      response.push([type, text]);
      if (response.length === 2) {
        pool.network.on('network.stopped', () => done());
        expect(response[0][0]).toBe('warning');
        expect(response[0][1]).toBe('Network difficulty (0) is lower than the difficulty on port 3002 (32)');
        expect(response[1][0]).toBe('warning');
        expect(response[1][1]).toBe('A socket error was detected from a client (client [example]): "test"');
        pool.network.stopNetwork();
      }
    });
    pool.on('client.socket.success', () => {
      client.emit('client.socket.error', 'test');
    });
    mockSetupDaemons(pool, () => {
      mockSetupSettings(pool, () => {
        pool.setupManager();
        mockSetupPrimaryBlockchain(pool, () => {
          mockSetupAuxiliaryBlockchain(pool, () => {
            mockSetupFirstJob(pool, () => {
              pool.setupNetwork(() => {
                pool.network.emit('client.connected', client);
              });
            });
          });
        });
      });
    });
  });

  test('Test pool stratum setup [11]', (done) => {
    const response = [];
    const client = mockClient();
    const pool = new Pool(configCopy, configMainCopy, () => {});
    pool.on('pool.log', (type, text) => {
      response.push([type, text]);
      if (response.length === 2) {
        pool.network.on('network.stopped', () => done());
        expect(response[0][0]).toBe('warning');
        expect(response[0][1]).toBe('Network difficulty (0) is lower than the difficulty on port 3002 (32)');
        expect(response[1][0]).toBe('warning');
        expect(response[1][1]).toBe('A client (client [example]) was timed out from the server: "test"');
        pool.network.stopNetwork();
      }
    });
    pool.on('client.socket.success', () => {
      client.emit('client.socket.timeout', 'test');
    });
    mockSetupDaemons(pool, () => {
      mockSetupSettings(pool, () => {
        pool.setupManager();
        mockSetupPrimaryBlockchain(pool, () => {
          mockSetupAuxiliaryBlockchain(pool, () => {
            mockSetupFirstJob(pool, () => {
              pool.setupNetwork(() => {
                pool.network.emit('client.connected', client);
              });
            });
          });
        });
      });
    });
  });

  test('Test pool stratum setup [12]', (done) => {
    const response = [];
    const client = mockClient();
    const pool = new Pool(configCopy, configMainCopy, () => {});
    pool.on('pool.log', (type, text) => {
      response.push([type, text]);
      if (response.length === 2) {
        pool.network.on('network.stopped', () => done());
        expect(response[0][0]).toBe('warning');
        expect(response[0][1]).toBe('Network difficulty (0) is lower than the difficulty on port 3002 (32)');
        expect(response[1][0]).toBe('warning');
        expect(response[1][1]).toBe('A client (client [example]) disconnected from the server');
        pool.network.stopNetwork();
      }
    });
    pool.on('client.socket.success', () => {
      client.emit('client.socket.disconnect');
    });
    mockSetupDaemons(pool, () => {
      mockSetupSettings(pool, () => {
        pool.setupManager();
        mockSetupPrimaryBlockchain(pool, () => {
          mockSetupAuxiliaryBlockchain(pool, () => {
            mockSetupFirstJob(pool, () => {
              pool.setupNetwork(() => {
                pool.network.emit('client.connected', client);
              });
            });
          });
        });
      });
    });
  });

  test('Test pool stratum setup [13]', (done) => {
    const response = [];
    const client = mockClient();
    const pool = new Pool(configCopy, configMainCopy, () => {});
    pool.on('pool.log', (type, text) => {
      response.push([type, text]);
      if (response.length === 2) {
        pool.network.on('network.stopped', () => done());
        expect(response[0][0]).toBe('warning');
        expect(response[0][1]).toBe('Network difficulty (0) is lower than the difficulty on port 3002 (32)');
        expect(response[1][0]).toBe('warning');
        expect(response[1][1]).toBe('A client (client [example]) disconnected from the server');
        pool.network.stopNetwork();
      }
    });
    pool.on('client.socket.success', () => {
      client.emit('client.socket.disconnect');
    });
    mockSetupDaemons(pool, () => {
      mockSetupSettings(pool, () => {
        pool.setupManager();
        mockSetupPrimaryBlockchain(pool, () => {
          mockSetupAuxiliaryBlockchain(pool, () => {
            mockSetupFirstJob(pool, () => {
              pool.setupNetwork(() => {
                pool.network.emit('client.connected', client);
              });
            });
          });
        });
      });
    });
  });

  test('Test pool stratum setup [14]', (done) => {
    const response = [];
    const client = mockClient();
    const pool = new Pool(configCopy, configMainCopy, () => {});
    pool.on('pool.log', (type, text) => {
      response.push([type, text]);
      if (response.length === 2) {
        pool.network.on('network.stopped', () => done());
        expect(response[0][0]).toBe('warning');
        expect(response[0][1]).toBe('Network difficulty (0) is lower than the difficulty on port 3002 (32)');
        expect(response[1][0]).toBe('warning');
        expect(response[1][1]).toBe('Rejected incoming connection (client [example]). The client is banned for 1000 seconds');
        pool.network.stopNetwork();
      }
    });
    pool.on('client.socket.success', () => {
      client.emit('client.ban.kicked', 1000);
    });
    mockSetupDaemons(pool, () => {
      mockSetupSettings(pool, () => {
        pool.setupManager();
        mockSetupPrimaryBlockchain(pool, () => {
          mockSetupAuxiliaryBlockchain(pool, () => {
            mockSetupFirstJob(pool, () => {
              pool.setupNetwork(() => {
                pool.network.emit('client.connected', client);
              });
            });
          });
        });
      });
    });
  });

  test('Test pool stratum setup [15]', (done) => {
    const response = [];
    const client = mockClient();
    const pool = new Pool(configCopy, configMainCopy, () => {});
    pool.on('pool.log', (type, text) => {
      response.push([type, text]);
      if (response.length === 2) {
        pool.network.on('network.stopped', () => done());
        expect(response[0][0]).toBe('warning');
        expect(response[0][1]).toBe('Network difficulty (0) is lower than the difficulty on port 3002 (32)');
        expect(response[1][0]).toBe('log');
        expect(response[1][1]).toBe('Forgave banned client (client [example]). They can now reconnect to the pool');
        pool.network.stopNetwork();
      }
    });
    pool.on('client.socket.success', () => {
      client.emit('client.ban.forgave');
    });
    mockSetupDaemons(pool, () => {
      mockSetupSettings(pool, () => {
        pool.setupManager();
        mockSetupPrimaryBlockchain(pool, () => {
          mockSetupAuxiliaryBlockchain(pool, () => {
            mockSetupFirstJob(pool, () => {
              pool.setupNetwork(() => {
                pool.network.emit('client.connected', client);
              });
            });
          });
        });
      });
    });
  });

  test('Test pool stratum setup [16]', (done) => {
    const response = [];
    const client = mockClient();
    const pool = new Pool(configCopy, configMainCopy, () => {});
    pool.on('pool.log', (type, text) => {
      response.push([type, text]);
      if (response.length === 2) {
        pool.network.on('network.stopped', () => done());
        expect(response[0][0]).toBe('warning');
        expect(response[0][1]).toBe('Network difficulty (0) is lower than the difficulty on port 3002 (32)');
        expect(response[1][0]).toBe('warning');
        expect(response[1][1]).toBe('Because of malicious behavior, a client (client [example]) has been banned');
        pool.network.stopNetwork();
      }
    });
    pool.on('client.socket.success', () => {
      client.emit('client.ban.trigger');
    });
    mockSetupDaemons(pool, () => {
      mockSetupSettings(pool, () => {
        pool.setupManager();
        mockSetupPrimaryBlockchain(pool, () => {
          mockSetupAuxiliaryBlockchain(pool, () => {
            mockSetupFirstJob(pool, () => {
              pool.setupNetwork(() => {
                pool.network.emit('client.connected', client);
              });
            });
          });
        });
      });
    });
  });

  test('Test pool stratum setup [17]', (done) => {
    const response = [];
    const client = mockClient();
    const pool = new Pool(configCopy, configMainCopy, () => {});
    pool.on('pool.log', (type, text) => {
      response.push([type, text]);
      if (response.length === 2) {
        pool.network.on('network.stopped', () => done());
        expect(response[0][0]).toBe('warning');
        expect(response[0][1]).toBe('Network difficulty (0) is lower than the difficulty on port 3002 (32)');
        expect(response[1][0]).toBe('warning');
        expect(response[1][1]).toBe('A client (client [example]) sent an unknown stratum method to the server: test');
        pool.network.stopNetwork();
      }
    });
    pool.on('client.socket.success', () => {
      client.emit('client.mining.unknown', { method: 'test' });
    });
    mockSetupDaemons(pool, () => {
      mockSetupSettings(pool, () => {
        pool.setupManager();
        mockSetupPrimaryBlockchain(pool, () => {
          mockSetupAuxiliaryBlockchain(pool, () => {
            mockSetupFirstJob(pool, () => {
              pool.setupNetwork(() => {
                pool.network.emit('client.connected', client);
              });
            });
          });
        });
      });
    });
  });

  test('Test pool stratum setup [18]', (done) => {
    const client = mockClient();
    const pool = new Pool(configCopy, configMainCopy, () => {});
    pool.on('client.socket.success', () => {
      client.emit('client.subscription', {}, () => {
        pool.network.on('network.stopped', () => done());
        pool.network.stopNetwork();
      });
    });
    mockSetupDaemons(pool, () => {
      mockSetupSettings(pool, () => {
        pool.setupManager();
        mockSetupPrimaryBlockchain(pool, () => {
          mockSetupAuxiliaryBlockchain(pool, () => {
            mockSetupFirstJob(pool, () => {
              pool.setupNetwork(() => {
                pool.network.emit('client.connected', client);
              });
            });
          });
        });
      });
    });
  });

  test('Test pool stratum setup [19]', (done) => {
    configCopy.ports = [{ 'port': 3002, 'enabled': true, 'difficulty': {}}];
    const client = mockClient();
    const pool = new Pool(configCopy, configMainCopy, () => {});
    pool.on('client.socket.success', () => {
      client.emit('client.subscription', {}, () => {
        pool.network.on('network.stopped', () => done());
        pool.network.stopNetwork();
      });
    });
    mockSetupDaemons(pool, () => {
      mockSetupSettings(pool, () => {
        pool.setupManager();
        mockSetupPrimaryBlockchain(pool, () => {
          mockSetupAuxiliaryBlockchain(pool, () => {
            mockSetupFirstJob(pool, () => {
              pool.setupNetwork(() => {
                pool.network.emit('client.connected', client);
              });
            });
          });
        });
      });
    });
  });

  test('Test pool stratum setup [20]', (done) => {
    const client = mockClient();
    const pool = new Pool(configCopy, configMainCopy, () => {});
    pool.on('client.socket.success', () => {
      pool.manager = { handleShare: () => {
        return { error: true, response: null };
      }};
      client.emit('client.submit', { params: [null, 'id', 'extraNonce', 'time', 'nonce', 'version'] }, (error, result) => {
        pool.network.on('network.stopped', () => done());
        expect(error).toBe(true);
        expect(result).toBe(null);
        pool.network.stopNetwork();
      });
    });
    mockSetupDaemons(pool, () => {
      mockSetupSettings(pool, () => {
        pool.setupManager();
        mockSetupPrimaryBlockchain(pool, () => {
          mockSetupAuxiliaryBlockchain(pool, () => {
            mockSetupFirstJob(pool, () => {
              pool.setupNetwork(() => {
                pool.network.emit('client.connected', client);
              });
            });
          });
        });
      });
    });
  });

  test('Test pool stratum setup [21]', (done) => {
    const client = mockClient();
    const pool = new Pool(configCopy, configMainCopy, () => {});
    pool.on('client.socket.success', () => {
      pool.manager = { handleShare: () => {
        return { error: null, response: true };
      }};
      client.emit('client.submit', { params: [null, 'id', 'extraNonce', 'time', 'nonce', 'version'] }, (error, result) => {
        pool.network.on('network.stopped', () => done());
        expect(error).toBe(null);
        expect(result).toBe(true);
        pool.network.stopNetwork();
      });
    });
    mockSetupDaemons(pool, () => {
      mockSetupSettings(pool, () => {
        pool.setupManager();
        mockSetupPrimaryBlockchain(pool, () => {
          mockSetupAuxiliaryBlockchain(pool, () => {
            mockSetupFirstJob(pool, () => {
              pool.setupNetwork(() => {
                pool.network.emit('client.connected', client);
              });
            });
          });
        });
      });
    });
  });

  test('Test pool stratum authentication [1]', (done) => {
    const pool = new Pool(configCopy, configMainCopy, () => {});
    mockSetupDaemons(pool, () => {
      nock('http://127.0.0.1:9998')
        .post('/', (body) => body.method === 'validateaddress')
        .reply(200, JSON.stringify({
          id: 'nocktest',
          error: null,
          result: { isvalid: true, address: 'RHP3VKiSYH4putQeSKLwr47QDdERa6H6G1' }
        }));
      pool.checkWorker(pool.primary.daemon, 'RHP3VKiSYH4putQeSKLwr47QDdERa6H6G1', (valid) => {
        expect(valid).toBe(true);
        done();
      });
    });
  });

  test('Test pool stratum authentication [2]', (done) => {
    const pool = new Pool(configCopy, configMainCopy, () => {});
    mockSetupDaemons(pool, () => {
      nock('http://127.0.0.1:9998')
        .post('/', (body) => body.method === 'validateaddress')
        .reply(200, JSON.stringify({
          id: 'nocktest',
          error: null,
          result: { isvalid: true, address: 'RHP3VKiSYH4putQeSKLwr47QDdERa6H6G1' }
        }));
      pool.checkWorker(pool.primary.daemon, 'RHP3VKiSYH4putQeSKLwr47QDdERa6H6G1.worker1', (valid) => {
        expect(valid).toBe(true);
        done();
      });
    });
  });

  test('Test pool stratum authentication [3]', (done) => {
    const pool = new Pool(configCopy, configMainCopy, () => {});
    mockSetupDaemons(pool, () => {
      nock('http://127.0.0.1:9998')
        .post('/', (body) => body.method === 'validateaddress')
        .reply(200, JSON.stringify({
          id: 'nocktest',
          error: null,
          result: { isvalid: true, address: 'RHP3VKiSYH4putQeSKLwr47QDdERa6H6G1' }
        }));
      pool.checkPrimaryWorker('0.0.0.0', 3001, 'RHP3VKiSYH4putQeSKLwr47QDdERa6H6G1', (valid) => {
        expect(valid).toBe(true);
        done();
      });
    });
  });

  test('Test pool stratum authentication [4]', (done) => {
    const pool = new Pool(configCopy, configMainCopy, () => {});
    mockSetupDaemons(pool, () => {
      nock('http://127.0.0.1:9998')
        .post('/', (body) => body.method === 'validateaddress')
        .reply(200, JSON.stringify({
          id: 'nocktest',
          error: null,
          result: { isvalid: false, address: 'RHP3VKiSYH4putQeSKLwr47QDdERa6H6G1' }
        }));
      pool.checkPrimaryWorker('0.0.0.0', 3001, 'RHP3VKiSYH4putQeSKLwr47QDdERa6H6G1', () => {}, (result) => {
        expect(result).toStrictEqual({ 'error': null, 'authorized': false, 'disconnect': false });
        done();
      });
    });
  });

  test('Test pool stratum authentication [5]', (done) => {
    const pool = new Pool(configCopy, configMainCopy, () => {});
    mockSetupDaemons(pool, () => {
      nock('http://127.0.0.1:9998')
        .post('/', (body) => body.method === 'validateaddress')
        .reply(200, JSON.stringify({
          id: 'nocktest',
          error: true,
          result: null
        }));
      pool.checkPrimaryWorker('0.0.0.0', 3001, 'RHP3VKiSYH4putQeSKLwr47QDdERa6H6G1', () => {}, (result) => {
        expect(result).toStrictEqual({ 'error': null, 'authorized': false, 'disconnect': false });
        done();
      });
    });
  });

  test('Test pool stratum authentication [6]', (done) => {
    configCopy.auxiliary = auxiliaryConfig;
    configCopy.auxiliary.daemons = auxiliaryDaemons;
    const pool = new Pool(configCopy, configMainCopy, () => {});
    mockSetupDaemons(pool, () => {
      nock('http://127.0.0.1:9996')
        .post('/', (body) => body.method === 'validateaddress')
        .reply(200, JSON.stringify({
          id: 'nocktest',
          error: null,
          result: { isvalid: true, address: 'RHP3VKiSYH4putQeSKLwr47QDdERa6H6G1' }
        }));
      pool.checkAuxiliaryWorker('0.0.0.0', 3001, 'RHP3VKiSYH4putQeSKLwr47QDdERa6H6G1', (valid) => {
        expect(valid).toBe(true);
        done();
      });
    });
  });

  test('Test pool stratum authentication [7]', (done) => {
    configCopy.auxiliary = auxiliaryConfig;
    configCopy.auxiliary.daemons = auxiliaryDaemons;
    const pool = new Pool(configCopy, configMainCopy, () => {});
    mockSetupDaemons(pool, () => {
      nock('http://127.0.0.1:9996')
        .post('/', (body) => body.method === 'validateaddress')
        .reply(200, JSON.stringify({
          id: 'nocktest',
          error: null,
          result: { isvalid: false, address: 'RHP3VKiSYH4putQeSKLwr47QDdERa6H6G1' }
        }));
      pool.checkAuxiliaryWorker('0.0.0.0', 3001, 'RHP3VKiSYH4putQeSKLwr47QDdERa6H6G1', () => {}, (result) => {
        expect(result).toStrictEqual({ 'error': null, 'authorized': false, 'disconnect': false });
        done();
      });
    });
  });

  test('Test pool stratum authentication [8]', (done) => {
    configCopy.auxiliary = auxiliaryConfig;
    configCopy.auxiliary.daemons = auxiliaryDaemons;
    const pool = new Pool(configCopy, configMainCopy, () => {});
    mockSetupDaemons(pool, () => {
      pool.checkAuxiliaryWorker('0.0.0.0', 3001, null, () => {}, (result) => {
        expect(result).toStrictEqual({ 'error': null, 'authorized': false, 'disconnect': false });
        done();
      });
    });
  });

  test('Test pool stratum authentication [9]', (done) => {
    const pool = new Pool(configCopy, configMainCopy, () => {});
    mockSetupDaemons(pool, () => {
      pool.checkAuxiliaryWorker('0.0.0.0', 3001, null, (valid) => {
        expect(valid).toBe(true);
        done();
      });
    });
  });

  test('Test pool stratum authentication [10]', (done) => {
    const pool = new Pool(configCopy, configMainCopy, () => {});
    mockSetupDaemons(pool, () => {
      nock('http://127.0.0.1:9998')
        .post('/', (body) => body.method === 'validateaddress')
        .reply(200, JSON.stringify({
          id: 'nocktest',
          error: null,
          result: { isvalid: true, address: 'RHP3VKiSYH4putQeSKLwr47QDdERa6H6G1' }
        }));
      pool.authorizeWorker('0.0.0.0', 3001, 'RHP3VKiSYH4putQeSKLwr47QDdERa6H6G1', null, 'test', (result) => {
        expect(result).toStrictEqual({ 'error': null, 'authorized': true, 'disconnect': false });
        done();
      });
    });
  });

  test('Test pool stratum authentication [11]', (done) => {
    configCopy.auxiliary = auxiliaryConfig;
    configCopy.auxiliary.daemons = auxiliaryDaemons;
    const pool = new Pool(configCopy, configMainCopy, () => {});
    mockSetupDaemons(pool, () => {
      nock('http://127.0.0.1:9998')
        .post('/', (body) => body.method === 'validateaddress')
        .reply(200, JSON.stringify({
          id: 'nocktest',
          error: null,
          result: { isvalid: true, address: 'RHP3VKiSYH4putQeSKLwr47QDdERa6H6G1' }
        }));
      nock('http://127.0.0.1:9996')
        .post('/', (body) => body.method === 'validateaddress')
        .reply(200, JSON.stringify({
          id: 'nocktest',
          error: null,
          result: { isvalid: true, address: 'RHP3VKiSYH4putQeSKLwr47QDdERa6H6G1' }
        }));
      pool.authorizeWorker('0.0.0.0', 3001, 'RHP3VKiSYH4putQeSKLwr47QDdERa6H6G1', 'RHP3VKiSYH4putQeSKLwr47QDdERa6H6G1', 'test', (result) => {
        expect(result).toStrictEqual({ 'error': null, 'authorized': true, 'disconnect': false });
        done();
      });
    });
  });

  test('Test pool stratum authentication [11]', (done) => {
    configCopy.auxiliary = auxiliaryConfig;
    configCopy.auxiliary.daemons = auxiliaryDaemons;
    const pool = new Pool(configCopy, configMainCopy, () => {});
    mockSetupDaemons(pool, () => {
      nock('http://127.0.0.1:9998')
        .post('/', (body) => body.method === 'validateaddress')
        .reply(200, JSON.stringify({
          id: 'nocktest',
          error: null,
          result: { isvalid: true, address: 'RHP3VKiSYH4putQeSKLwr47QDdERa6H6G1' }
        }));
      nock('http://127.0.0.1:9996')
        .post('/', (body) => body.method === 'validateaddress')
        .reply(200, JSON.stringify({
          id: 'nocktest',
          error: true,
          result: null
        }));
      pool.authorizeWorker('0.0.0.0', 3001, 'RHP3VKiSYH4putQeSKLwr47QDdERa6H6G1', 'RHP3VKiSYH4putQeSKLwr47QDdERa6H6G1', 'test', (result) => {
        expect(result).toStrictEqual({ 'error': null, 'authorized': false, 'disconnect': false });
        done();
      });
    });
  });
});
