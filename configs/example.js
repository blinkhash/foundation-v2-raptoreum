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

// Export Configuration
module.exports = config;
