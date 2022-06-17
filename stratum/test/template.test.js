const Algorithms = require('../main/algorithms');
const Template = require('../main/template');
const config = require('../../configs/example');
const testdata = require('../../daemon/test/daemon.mock');
const utils = require('../main/utils');

config.primary.address = 'RHP3VKiSYH4putQeSKLwr47QDdERa6H6G1';
config.primary.recipients = [];

const jobId = 1;
const extraNonce = Buffer.from('f000000ff111111f', 'hex');

////////////////////////////////////////////////////////////////////////////////

describe('Test template functionality', () => {

  let configCopy, rpcDataCopy;
  beforeEach(() => {
    configCopy = JSON.parse(JSON.stringify(config));
    rpcDataCopy = JSON.parse(JSON.stringify(testdata.getBlockTemplate()));
  });

  test('Test current bigint implementation [1]', () => {
    const template = new Template(jobId.toString(16), configCopy, rpcDataCopy, extraNonce);
    expect(Number(template.target).toFixed(9)).toBe('2.248756111453702e+72');
  });

  test('Test current bigint implementation [2]', () => {
    rpcDataCopy.target = null;
    const template = new Template(jobId.toString(16), configCopy, rpcDataCopy, extraNonce);
    expect(Number(template.target).toFixed(9)).toBe('1.1042625655198232e+71');
  });

  test('Test if target is not defined', () => {
    const template = new Template(jobId.toString(16), configCopy, rpcDataCopy, extraNonce);
    delete rpcDataCopy.target;
    expect(Number(template.target).toFixed(9)).toBe('2.248756111453702e+72');
    expect(template.difficulty.toFixed(9)).toBe('0.000011989');
  });

  test('Test template difficulty calculation', () => {
    const template = new Template(jobId.toString(16), configCopy, rpcDataCopy, extraNonce);
    expect(template.difficulty.toFixed(9)).toBe('0.000011989');
  });

  test('Test generation transaction handling', () => {
    const template = new Template(jobId.toString(16), configCopy, rpcDataCopy, extraNonce);
    expect(template.generation.length).toBe(2);
    expect(template.generation[0].slice(0, -5)).toStrictEqual(Buffer.from('03000500010000000000000000000000000000000000000000000000000000000000000000ffffffff0f5104', 'hex'));
    expect(template.generation[1]).toStrictEqual(Buffer.from('0000000003f3e7bd4f570000001976a91458dc54f51551db0f20508df7e6e734b477eb7d8088ac85e87648170000001976a9144a3ae8c7ac2e308c1cce30efae12ea3d68803b6388ac21ba1dd2050000001976a9147a1636c0913039c7a3f0b124dc6e625ade02f0c688ac00000000460200b6dc0100c0bad32ec53b58694dd54ea434345b840e8f0c61a9666c33f1e140f50f7540fdeec22668d6d66da92433abbc5f8222fe9c77a5908e5dd386b65e82949d7f23b3', 'hex'));
  });

  test('Test coinbase serialization [1]', () => {
    const template = new Template(jobId.toString(16), configCopy, rpcDataCopy, extraNonce);
    const extraNonce1 = Buffer.from('01', 'hex');
    const extraNonce2 = Buffer.from('00', 'hex');
    const coinbase = template.handleCoinbase(extraNonce1, extraNonce2);
    expect(coinbase.slice(0, 44)).toStrictEqual(Buffer.from('03000500010000000000000000000000000000000000000000000000000000000000000000ffffffff0f5104', 'hex'));
    expect(coinbase.slice(49, 51)).toStrictEqual(Buffer.from('0100', 'hex'));
    expect(coinbase.slice(51)).toStrictEqual(Buffer.from('0000000003f3e7bd4f570000001976a91458dc54f51551db0f20508df7e6e734b477eb7d8088ac85e87648170000001976a9144a3ae8c7ac2e308c1cce30efae12ea3d68803b6388ac21ba1dd2050000001976a9147a1636c0913039c7a3f0b124dc6e625ade02f0c688ac00000000460200b6dc0100c0bad32ec53b58694dd54ea434345b840e8f0c61a9666c33f1e140f50f7540fdeec22668d6d66da92433abbc5f8222fe9c77a5908e5dd386b65e82949d7f23b3', 'hex'));
  });

  test('Test coinbase serialization [2]', () => {
    const coinbaseBuffer = Buffer.from('01000000010000000000000000000000000000000000000000000000000000000000000000ffffffff020101ffffffff0100f2052a010000001976a914614ca2f0f4baccdd63f45a0e0e0ff7ffb88041fb88ac00000000', 'hex');
    const hashDigest = Algorithms.sha256d.hash();
    const coinbaseHash = hashDigest(coinbaseBuffer);
    expect(coinbaseHash).toStrictEqual(Buffer.from('afd031100bff85a9ac01f1718be0b3d6c20228592f0242ea1e4d91a519b53031', 'hex'));
  });

  test('Test header serialization [1]', () => {
    const template = new Template(jobId.toString(16), configCopy, rpcDataCopy, extraNonce);
    const merkleRoot = '3130b519a5914d1eea42022f592802c2d6b3e08b71f101aca985ff0b1031d0af';
    const time = '6036c54f'.toString('hex');
    const nonce = 'fe1a0000'.toString('hex');
    const headerBuffer = template.handleHeader(template.rpcData.version, merkleRoot, time, nonce);
    expect(headerBuffer).toStrictEqual(Buffer.from('0000002031ee4d6293ec64da34859495fcb14b2de1435717947d90b896e8464c569387ba00060003000008000701000100010000000908050000000001000301000000004fc53660f0ff0f1e00001afe', 'hex'));
  });

  test('Test header serialization [2]', () => {
    const headerBuffer = Buffer.from('00000020e22777bc309503ee6be3c65f370ba629b6497dbe8b804cbd8365ef83fbae1997afd031100bff85a9ac01f1718be0b3d6c20228592f0242ea1e4d91a519b530314fc53660f0ff0f1e00001afe', 'hex');
    const hashDigest = Algorithms.sha256d.hash();
    const headerHash = hashDigest(headerBuffer, 1614202191);
    expect(headerHash).toStrictEqual(Buffer.from('6927c80704a1616664c5c91157d895587ac0381976010411cbec9aade2f75a1d', 'hex'));
  });

  test('Test block serialization [1]', () => {
    const template = new Template(jobId.toString(16), configCopy, rpcDataCopy, extraNonce);
    const headerBuffer = Buffer.from('00000020e22777bc309503ee6be3c65f370ba629b6497dbe8b804cbd8365ef83fbae1997afd031100bff85a9ac01f1718be0b3d6c20228592f0242ea1e4d91a519b530314fc53660f0ff0f1e00001afe', 'hex');
    const coinbase = Buffer.from('01000000010000000000000000000000000000000000000000000000000000000000000000ffffffff020101ffffffff0100f2052a010000001976a914614ca2f0f4baccdd63f45a0e0e0ff7ffb88041fb88ac00000000', 'hex');
    const templateHex = template.handleBlocks(headerBuffer, coinbase, null, null);
    expect(templateHex).toStrictEqual(Buffer.from('00000020e22777bc309503ee6be3c65f370ba629b6497dbe8b804cbd8365ef83fbae1997afd031100bff85a9ac01f1718be0b3d6c20228592f0242ea1e4d91a519b530314fc53660f0ff0f1e00001afe0201000000010000000000000000000000000000000000000000000000000000000000000000ffffffff020101ffffffff0100f2052a010000001976a914614ca2f0f4baccdd63f45a0e0e0ff7ffb88041fb88ac0000000002000000032cfc9fcf4f1e47d6dc7897c00e99d96eda36d671fab41859782e1edc8cf0ef38000000006b483045022100e3c6c4f3656be9e4ac735694a02c0eaa989c606b9de6a6bab80db91b7019a8eb022042e227f6f6f6f94d5e4bcb892b030b7af9d4d8cf032709a84dd6411ad859a7530121029231a17cb7f7baf35a2cc5c22253857672f3681a0fb5f9b99b848c8d74724448feffffff9f9a3024733e77c1d3534ad5095dbac1a58daf59d3ac88beed62b84e8a5b6068010000006b483045022100a26bea225a7bdc433a08dc18da35ccdf92df1b44fee227db298dcc8e7a941e2502205b38ae06b20d91af061676ceb27ffc38dcf440fe75d3a6fed13bc59123e93d7e0121029ac49a28967f8ebf4e626d0126b2a7587b0420035909ac92746b9b816741fddcfefffffff9e6e4e76fb52c8e0f0894733f418a62b232d1ec263448156651f9b11456817e000000006b4830450221008172da70e89a6aae1d76a3eb9d5d0e76546eb94b289bc7c8bc581cbde508e9dc0220025a06125f721085c6a25dac323e0bad30021bfd43af7fb6ad3b53b4ee48f87301210314c5d4b52428e4670aaf67d861a0a017b5615315884d0a0da06b51cd10df0f87feffffff02234b1400000000001976a9146af90bc44256b99a65ff6a53b6e5eec32539821c88ac003b5808000000001976a9140ea13a85edd6fbfe82c995200d1186cc7e02586588acb5dc0100', 'hex'));
  });

  test('Test block serialization [2]', () => {
    const headerBuffer = Buffer.from('00000020e22777bc309503ee6be3c65f370ba629b6497dbe8b804cbd8365ef83fbae1997afd031100bff85a9ac01f1718be0b3d6c20228592f0242ea1e4d91a519b530314fc53660f0ff0f1e00001afe', 'hex');
    const hashDigest = Algorithms.sha256d.hash();
    const blockHash = hashDigest(headerBuffer, 1614202191);
    expect(blockHash).toStrictEqual(Buffer.from('6927c80704a1616664c5c91157d895587ac0381976010411cbec9aade2f75a1d', 'hex'));
  });

  test('Test template submission', () => {
    const template = new Template(jobId.toString(16), configCopy, rpcDataCopy, extraNonce);
    const extraNonce1 = Buffer.from('01', 'hex');
    const extraNonce2 = Buffer.from('00', 'hex');
    const time = '6036c54f'.toString('hex');
    const nonce = 'fe1a0000'.toString('hex');
    const templateSubmitted1 = template.handleSubmissions([extraNonce1, extraNonce2, time, nonce]);
    const templateSubmitted2 = template.handleSubmissions([extraNonce1, extraNonce2, time, nonce]);
    expect(templateSubmitted1).toBe(true);
    expect(templateSubmitted2).toBe(false);
  });

  test('Test current job parameters [1]', () => {
    const template = new Template(jobId.toString(16), configCopy, rpcDataCopy, extraNonce);
    const jobParams = [
      template.jobId,
      template.previous,
      template.generation[0].toString('hex'),
      template.generation[1].toString('hex'),
      utils.getMerkleSteps(template.rpcData.transactions).map((step) => step.toString('hex')),
      utils.packInt32BE(template.rpcData.version).toString('hex'),
      template.rpcData.bits,
      utils.packInt32BE(template.rpcData.curtime).toString('hex'),
      true
    ];
    const currentParams = template.handleParameters(true);
    expect(currentParams).toStrictEqual(jobParams);
  });

  test('Test current job parameters [2]', () => {
    const template = new Template(jobId.toString(16), configCopy, rpcDataCopy, extraNonce);
    const jobParams = [
      template.jobId,
      template.previous,
      template.generation[0].toString('hex'),
      template.generation[1].toString('hex'),
      utils.getMerkleSteps(template.rpcData.transactions).map((step) => step.toString('hex')),
      utils.packInt32BE(template.rpcData.version).toString('hex'),
      template.rpcData.bits,
      utils.packInt32BE(template.rpcData.curtime).toString('hex'),
      true
    ];
    template.jobParams = jobParams;
    const currentParams = template.handleParameters(true);
    expect(currentParams).toStrictEqual(jobParams);
  });
});
