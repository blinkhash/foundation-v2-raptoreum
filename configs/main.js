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
config.identifier = '';

// Logger Configuration
config.logger = {};
config.logger.logColors = true;
config.logger.logLevel = 'log';

// Clustering Configuration
config.clustering = {};
config.clustering.enabled = true;
config.clustering.forks = 'auto';

// TLS Configuration
config.tls = {};
config.tls.ca = 'rootCA.crt';
config.tls.key = 'server.key';
config.tls.cert = 'server.crt';

// Export Configuration
module.exports = config;