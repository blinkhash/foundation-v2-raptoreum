const Transactions = require('../main/transactions');
const config = require('../../configs/example');
const testdata = require('../../daemon/test/daemon.mock');

config.primary.address = 'RHP3VKiSYH4putQeSKLwr47QDdERa6H6G1';
config.primary.recipients = [];

const auxiliaryConfig = {
  'enabled': false,
  'coin': {
    'header': 'fabe6d6d',
  }
};

const auxiliaryData = {
  'chainid': 1,
  'hash': '17a35a38e70cd01488e0d5ece6ded04a9bc8125865471d36b9d5c47a08a5907c',
};

const extraNonce = Buffer.from('f000000ff111111f', 'hex');

////////////////////////////////////////////////////////////////////////////////

describe('Test transactions functionality', () => {

  let configCopy, rpcDataCopy;
  beforeEach(() => {
    configCopy = JSON.parse(JSON.stringify(config));
    rpcDataCopy = JSON.parse(JSON.stringify(testdata.getBlockTemplate()));
  });

  test('Test main transaction builder [1]', () => {
    const transaction = new Transactions(configCopy).handleGeneration(rpcDataCopy, extraNonce);
    expect(transaction[0].slice(0, -5)).toStrictEqual(Buffer.from('03000500010000000000000000000000000000000000000000000000000000000000000000ffffffff0f5104', 'hex'));
    expect(transaction[1]).toStrictEqual(Buffer.from('0000000003f3e7bd4f570000001976a91458dc54f51551db0f20508df7e6e734b477eb7d8088ac85e87648170000001976a9144a3ae8c7ac2e308c1cce30efae12ea3d68803b6388ac21ba1dd2050000001976a9147a1636c0913039c7a3f0b124dc6e625ade02f0c688ac00000000460200b6dc0100c0bad32ec53b58694dd54ea434345b840e8f0c61a9666c33f1e140f50f7540fdeec22668d6d66da92433abbc5f8222fe9c77a5908e5dd386b65e82949d7f23b3', 'hex'));
  });

  test('Test main transaction builder [2]', () => {
    rpcDataCopy.coinbasetxn = {};
    rpcDataCopy.coinbasetxn.data = '0500008085202';
    const transaction = new Transactions(configCopy).handleGeneration(rpcDataCopy, extraNonce);
    expect(transaction[0].slice(0, -5)).toStrictEqual(Buffer.from('05000580010000000000000000000000000000000000000000000000000000000000000000ffffffff0f5104', 'hex'));
    expect(transaction[1]).toStrictEqual(Buffer.from('0000000003f3e7bd4f570000001976a91458dc54f51551db0f20508df7e6e734b477eb7d8088ac85e87648170000001976a9144a3ae8c7ac2e308c1cce30efae12ea3d68803b6388ac21ba1dd2050000001976a9147a1636c0913039c7a3f0b124dc6e625ade02f0c688ac00000000460200b6dc0100c0bad32ec53b58694dd54ea434345b840e8f0c61a9666c33f1e140f50f7540fdeec22668d6d66da92433abbc5f8222fe9c77a5908e5dd386b65e82949d7f23b3', 'hex'));
  });

  test('Test main transaction builder [3]', () => {
    configCopy.primary.recipients.push({ address: 'RHP3VKiSYH4putQeSKLwr47QDdERa6H6G1', percentage: 0.05 });
    const transaction = new Transactions(configCopy).handleGeneration(rpcDataCopy, extraNonce);
    expect(transaction[0].slice(0, -5)).toStrictEqual(Buffer.from('03000500010000000000000000000000000000000000000000000000000000000000000000ffffffff0f5104', 'hex'));
    expect(transaction[1]).toStrictEqual(Buffer.from('00000000045b9c27f2520000001976a91458dc54f51551db0f20508df7e6e734b477eb7d8088ac85e87648170000001976a9144a3ae8c7ac2e308c1cce30efae12ea3d68803b6388ac21ba1dd2050000001976a9147a1636c0913039c7a3f0b124dc6e625ade02f0c688ac984b965d040000001976a91458dc54f51551db0f20508df7e6e734b477eb7d8088ac00000000460200b6dc0100c0bad32ec53b58694dd54ea434345b840e8f0c61a9666c33f1e140f50f7540fdeec22668d6d66da92433abbc5f8222fe9c77a5908e5dd386b65e82949d7f23b3', 'hex'));
  });

  test('Test main transaction builder [4]', () => {
    configCopy.primary.recipients.push({ address: 'RHP3VKiSYH4putQeSKLwr47QDdERa6H6G1', percentage: 0.05 });
    configCopy.primary.recipients.push({ address: 'RHP3VKiSYH4putQeSKLwr47QDdERa6H6G1', percentage: 0.05 });
    const transaction = new Transactions(configCopy).handleGeneration(rpcDataCopy, extraNonce);
    expect(transaction[0].slice(0, -5)).toStrictEqual(Buffer.from('03000500010000000000000000000000000000000000000000000000000000000000000000ffffffff0f5104', 'hex'));
    expect(transaction[1]).toStrictEqual(Buffer.from('0000000005c35091944e0000001976a91458dc54f51551db0f20508df7e6e734b477eb7d8088ac85e87648170000001976a9144a3ae8c7ac2e308c1cce30efae12ea3d68803b6388ac21ba1dd2050000001976a9147a1636c0913039c7a3f0b124dc6e625ade02f0c688ac984b965d040000001976a91458dc54f51551db0f20508df7e6e734b477eb7d8088ac984b965d040000001976a91458dc54f51551db0f20508df7e6e734b477eb7d8088ac00000000460200b6dc0100c0bad32ec53b58694dd54ea434345b840e8f0c61a9666c33f1e140f50f7540fdeec22668d6d66da92433abbc5f8222fe9c77a5908e5dd386b65e82949d7f23b3', 'hex'));
  });

  test('Test main transaction builder [5]', () => {
    rpcDataCopy.coinbaseaux.flags = 'test';
    const transaction = new Transactions(configCopy).handleGeneration(rpcDataCopy, extraNonce);
    expect(transaction[0].slice(0, -5)).toStrictEqual(Buffer.from('03000500010000000000000000000000000000000000000000000000000000000000000000ffffffff0f5104', 'hex'));
    expect(transaction[1]).toStrictEqual(Buffer.from('0000000003f3e7bd4f570000001976a91458dc54f51551db0f20508df7e6e734b477eb7d8088ac85e87648170000001976a9144a3ae8c7ac2e308c1cce30efae12ea3d68803b6388ac21ba1dd2050000001976a9147a1636c0913039c7a3f0b124dc6e625ade02f0c688ac00000000460200b6dc0100c0bad32ec53b58694dd54ea434345b840e8f0c61a9666c33f1e140f50f7540fdeec22668d6d66da92433abbc5f8222fe9c77a5908e5dd386b65e82949d7f23b3', 'hex'));
  });

  test('Test main transaction builder [6]', () => {
    delete rpcDataCopy.default_witness_commitment;
    const transaction = new Transactions(configCopy).handleGeneration(rpcDataCopy, extraNonce);
    expect(transaction[0].slice(0, -5)).toStrictEqual(Buffer.from('03000500010000000000000000000000000000000000000000000000000000000000000000ffffffff0f5104', 'hex'));
    expect(transaction[1]).toStrictEqual(Buffer.from('0000000003f3e7bd4f570000001976a91458dc54f51551db0f20508df7e6e734b477eb7d8088ac85e87648170000001976a9144a3ae8c7ac2e308c1cce30efae12ea3d68803b6388ac21ba1dd2050000001976a9147a1636c0913039c7a3f0b124dc6e625ade02f0c688ac00000000460200b6dc0100c0bad32ec53b58694dd54ea434345b840e8f0c61a9666c33f1e140f50f7540fdeec22668d6d66da92433abbc5f8222fe9c77a5908e5dd386b65e82949d7f23b3', 'hex'));
  });

  test('Test main transaction builder [7]', () => {
    rpcDataCopy.auxData = auxiliaryData;
    configCopy.auxiliary = auxiliaryConfig;
    configCopy.auxiliary.enabled = true;
    const transaction = new Transactions(configCopy).handleGeneration(rpcDataCopy, extraNonce);
    expect(transaction[0].slice(0, 44)).toStrictEqual(Buffer.from('03000500010000000000000000000000000000000000000000000000000000000000000000ffffffff3b5104', 'hex'));
    expect(transaction[0].slice(49, 53)).toStrictEqual(Buffer.from('fabe6d6d', 'hex'));
    expect(transaction[0].slice(53)).toStrictEqual(Buffer.from('17a35a38e70cd01488e0d5ece6ded04a9bc8125865471d36b9d5c47a08a5907c0100000000000000', 'hex'));
    expect(transaction[1]).toStrictEqual(Buffer.from('0000000003f3e7bd4f570000001976a91458dc54f51551db0f20508df7e6e734b477eb7d8088ac85e87648170000001976a9144a3ae8c7ac2e308c1cce30efae12ea3d68803b6388ac21ba1dd2050000001976a9147a1636c0913039c7a3f0b124dc6e625ade02f0c688ac00000000460200b6dc0100c0bad32ec53b58694dd54ea434345b840e8f0c61a9666c33f1e140f50f7540fdeec22668d6d66da92433abbc5f8222fe9c77a5908e5dd386b65e82949d7f23b3', 'hex'));
  });

  test('Test main transaction builder [8]', () => {
    configCopy.settings.testnet = true;
    configCopy.primary.address = 'rX78neTQ1fc5huciK9Ltq22qZMUHi3kdig';
    const transaction = new Transactions(configCopy).handleGeneration(rpcDataCopy, extraNonce);
    expect(transaction[0].slice(0, -5)).toStrictEqual(Buffer.from('03000500010000000000000000000000000000000000000000000000000000000000000000ffffffff0f5104', 'hex'));
    expect(transaction[1]).toStrictEqual(Buffer.from('0000000003f3e7bd4f570000001976a91410d23f3dd2f1c0bc6b7962d79ff8bddd14a7d15788ac85e87648170000001976a9144a3ae8c7ac2e308c1cce30efae12ea3d68803b6388ac21ba1dd2050000001976a9147a1636c0913039c7a3f0b124dc6e625ade02f0c688ac00000000460200b6dc0100c0bad32ec53b58694dd54ea434345b840e8f0c61a9666c33f1e140f50f7540fdeec22668d6d66da92433abbc5f8222fe9c77a5908e5dd386b65e82949d7f23b3', 'hex'));
  });
});
