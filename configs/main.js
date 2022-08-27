/*
 *
 * Example (Main)
 *
 */

// Main Configuration
////////////////////////////////////////////////////////////////////////////////

// Miscellaneous Configuration
const config = {};
config.language = 'english';
config.identifier = 'EU';

// Logger Configuration
config.logger = {};
config.logger.logColors = true;
config.logger.logLevel = 'debug';

// Clustering Configuration
config.clustering = {};
config.clustering.enabled = false;
config.clustering.forks = 'auto';

// TLS Configuration
config.tls = {};
config.tls.ca = 'rootCA.crt';
config.tls.key = 'server.crt';
config.tls.cert = 'server.key';

// Export Configuration
module.exports = config;
