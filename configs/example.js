/*
 *
 * Example (Raptoreum)
 *
 */

// Main Configuration
////////////////////////////////////////////////////////////////////////////////

// Miscellaneous Configuration
const config = {};
config.enabled = true;
config.settings = {};

// GR Hashing Library
config.hashLib = {};
config.hashLib.name = '';

// Banning Configuration
config.settings.banning = {};
config.settings.banning.banLength = 600000; // ms;
config.settings.banning.checkThreshold = 500;
config.settings.banning.invalidPercent = 50;
config.settings.banning.purgeInterval = 300000; // ms;

// Timeout Configuration
config.settings.timeout = {};
config.settings.timeout.connection = 600000; // ms
config.settings.timeout.rebroadcast = 60000; // ms

// Interval Configuration
config.settings.interval = {};
config.settings.interval.blocks = 1000; // ms

// CryptoNight Rotations
config.rotations = {};
config.rotations.enabled = true;
config.rotations.DarkDarkliteFast = 0.1; // Rotation 1
config.rotations.DarkDarkliteLite = 0.2; // Rotation 2
config.rotations.DarkDarkliteTurtle = 0.3; // Rotation 3
config.rotations.DarkDarkliteTurtlelite = 0.4; // Rotation 4
config.rotations.DarkFastLite = 0.5; // Rotation 5
config.rotations.DarkFastTurtle = 0.6; // Rotation 6
config.rotations.DarkFastTurtlelite = 0.7; // Rotation 7
config.rotations.DarkLiteTurtle = 0.8; // Rotation 8
config.rotations.DarkLiteTurtlelite = 0.9; // Rotation 9
config.rotations.DarkTurtleTurtlelite = 1; // Rotation 10
config.rotations.DarkliteFastLite = 1.1; // Rotation 11
config.rotations.DarkliteFastTurtle = 1.2; // Rotation 12
config.rotations.DarkliteFastTurtlelite = 1.3; // Rotation 13
config.rotations.DarkliteLiteTurtle = 1.4; // Rotation 14
config.rotations.DarkliteLiteTurtlelite = 1.5; // Rotation 15
config.rotations.DarkliteTurtleTurtlelite = 1.6; // Rotation 16
config.rotations.FastLiteTurtle = 1.7; // Rotation 17
config.rotations.FastLiteTurtlelite = 1.8; // Rotation 18
config.rotations.FastTurtleTurtlelite = 1.9; // Rotation 19
config.rotations.LiteTurtleTurtlelite = 2; // Rotation 20

// Shared Configuration
////////////////////////////////////////////////////////////////////////////////

// Port Configuration
config.ports = [];

const ports1 = {};
ports1.port = 3002;
ports1.enabled = true;
ports1.tls = false;
ports1.difficulty = {};
ports1.difficulty.initial = 32;
ports1.difficulty.minimum = 8;
ports1.difficulty.maximum = 512;
ports1.difficulty.targetTime = 15;
ports1.difficulty.retargetTime = 90;
ports1.difficulty.variance = 0.3;
config.ports.push(ports1);

// Primary Configuration
////////////////////////////////////////////////////////////////////////////////

// Miscellaneous Configuration
config.primary = {};
config.primary.address = '[address]';

// Coin Configuration
config.primary.coin = {};
config.primary.coin.name = 'Raptoreum';
config.primary.coin.symbol = 'RTM';
config.primary.coin.algorithm = 'ghostrider';

// Daemon Configuration
config.primary.daemons = [];

const daemons1 = {};
daemons1.host = '127.0.0.1';
daemons1.port = 9998;
daemons1.username = '';
daemons1.password = '';
config.primary.daemons.push(daemons1);

// Recipients Configuration
config.primary.recipients = [];

const recipient1 = {};
recipient1.address = '[address]';
recipient1.percentage = 0.05;
config.primary.recipients.push(recipient1);

// ZMQ Configuration
config.primary.zmq = {};
config.primary.zmq.enabled = false;
config.primary.zmq.host = '127.0.0.1';
config.primary.zmq.port = 29000;

// Export Configuration
module.exports = config;
