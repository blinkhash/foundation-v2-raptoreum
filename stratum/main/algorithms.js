////////////////////////////////////////////////////////////////////////////////

// Main Algorithms Function
const Algorithms = {

  // Ghostrider Algorithm
  'ghostrider': {
    multiplier: Math.pow(2, 16),
    diff: parseInt('0x00000000ffff0000000000000000000000000000000000000000000000000000'),
  },

  // Sha256d Algorithm
  'sha256d': {
    multiplier: 1,
    diff: parseInt('0x00000000ffff0000000000000000000000000000000000000000000000000000'),
  },
};

module.exports = Algorithms;
