const Algorithms = require('../main/algorithms');

////////////////////////////////////////////////////////////////////////////////

describe('Test algorithm functionality', () => {

  // Deterministic w/ Argument
  test('Test implemented ghostrider algorithm', () => {
    const start = Buffer.from('000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f');
    const main = Buffer.from('affb18b37144a5829c610c249b8f2b165aabcc27eeb39c4f3b4d07c0bb431bcc', 'hex');
    const output = Buffer.from('5438a6e89f606117ca8024cda972a0fc134a718fba8908ce961e8963d75a4bdc', 'hex');
    expect(Algorithms.ghostrider.hash({}).apply(null, [start, main]).length).toBe(32);
    expect(Algorithms.ghostrider.hash({}).apply(null, [start, main])).toStrictEqual(output);
  });

  // Deterministic
  test('Test implemented sha256d algorithm', () => {
    const start = Buffer.from('000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f');
    const output = Buffer.from('dc83687981432eb309f7c96a51f8bd10cec4a4630f47fdca1c2768d34ba9031a', 'hex');
    expect(Algorithms.sha256d.hash({}).apply(null, [start]).length).toBe(32);
    expect(Algorithms.sha256d.hash({}).apply(null, [start])).toStrictEqual(output);
  });
});
