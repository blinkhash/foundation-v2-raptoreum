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

// CryptoNight Rotations
config.rotations = {};
config.rotations.enabled = true;
config.rotations.DarkDarkliteFast = 1.01; // Rotation 1
config.rotations.DarkDarkliteLite = 1.02; // Rotation 2
config.rotations.DarkDarkliteTurtle = 1.03; // Rotation 3
config.rotations.DarkDarkliteTurtlelite = 1.04; // Rotation 4
config.rotations.DarkFastLite = 1.05; // Rotation 5
config.rotations.DarkFastTurtle = 1.06; // Rotation 6
config.rotations.DarkFastTurtlelite = 1.07; // Rotation 7
config.rotations.DarkLiteTurtle = 1.08; // Rotation 8
config.rotations.DarkLiteTurtlelite = 1.09; // Rotation 9
config.rotations.DarkTurtleTurtlelite = 1.1; // Rotation 10
config.rotations.DarkliteFastLite = 1.11; // Rotation 11
config.rotations.DarkliteFastTurtle = 1.12; // Rotation 12
config.rotations.DarkliteFastTurtlelite = 1.13; // Rotation 13
config.rotations.DarkliteLiteTurtle = 1.14; // Rotation 14
config.rotations.DarkliteLiteTurtlelite = 1.15; // Rotation 15
config.rotations.DarkliteTurtleTurtlelite = 1.16; // Rotation 16
config.rotations.FastLiteTurtle = 1.17; // Rotation 17
config.rotations.FastLiteTurtlelite = 1.18; // Rotation 18
config.rotations.FastTurtleliteTurtle = 1.19; // Rotation 19
config.rotations.LiteTurtleTurtlelite = 1.2; // Rotation 20

// Banning Configuration
config.banning = {};
config.banning.banLength = 600000; // ms;
config.banning.checkThreshold = 500;
config.banning.invalidPercent = 50;
config.banning.purgeInterval = 300000; // ms;

// Port Configuration
config.ports = [];

const ports1 = {};
ports1.port = 3002;
ports1.enabled = true;
ports1.type = 'shared';
ports1.tls = false;
ports1.difficulty = {};
ports1.difficulty.initial = 32;
ports1.difficulty.minimum = 8;
ports1.difficulty.maximum = 512;
ports1.difficulty.targetTime = 15;
ports1.difficulty.retargetTime = 90;
ports1.difficulty.variance = 0.3;
config.ports.push(ports1);

// Settings Configuration
config.settings = {};
config.settings.blockRefreshInterval = 1000; // ms;
config.settings.connectionTimeout = 600000; // ms;
config.settings.jobRebroadcastTimeout = 60000; // ms;

// Primary Configuration
////////////////////////////////////////////////////////////////////////////////

// Miscellaneous Configuration
config.primary = {};
config.primary.address = '[address]';

// Coin Configuration
config.primary.coin = {};
config.primary.coin.name = 'Raptoreum';
config.primary.coin.symbol = 'RTM';

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

// Export Configuration
module.exports = config;
