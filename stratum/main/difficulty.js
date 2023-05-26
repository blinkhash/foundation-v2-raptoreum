const events = require('events');
const utils = require('./utils');

////////////////////////////////////////////////////////////////////////////////

// Main Difficulty Function
const Difficulty = function(config) {

  const _this = this;
  this.config = config;
  this.clients = {};

  // Difficulty Variables
  this.maxSize = 60 / _this.config.targetTime * 600;
  this.maxBoundary = 1 + _this.config.variance;
  this.minBoundary = 1 - _this.config.variance;

  // Difficulty Saved Values
  this.lastRetargetTime = null;
  this.lastSavedTime = null;

  // Get New Difficulty for Updates
  this.setDifficulty = function(client) {

    // Check that Client is Recorded
    if (!(Object.keys(_this.clients).includes(client.id))) return;

    const timestamps = _this.clients[client.id].timestamps;
    const difficulties = _this.clients[client.id].difficulties;
    const queueLength = difficulties.length;

    // Configure Recent Queue Parameters
    const recentWeight = 0.2;
    const recentRatio = 0.1;
    const recentCap = 20;
    const recentRatioIndex = Math.floor(queueLength * (1 - recentRatio)) - 1;
    const recentCapIndex = queueLength - recentCap - 1;
    const recentIndex = Math.max(recentRatioIndex, recentCapIndex, 0);

    // Check that Queue has Sufficient Entries
    if (queueLength < 2) return null;

    // Process Historical Queue
    const historicalDiffSum = difficulties.reduce((a, b) => a + b, 0);
    const historicalQueueInterval = timestamps[timestamps.length - 1] - timestamps[0];
    const historicalDifficulty =  _this.config.targetTime / historicalQueueInterval * historicalDiffSum;
    
    // Process Recent Queue
    const recentDifficulties = difficulties.slice(recentIndex);
    const recentDiffSum = recentDifficulties.reduce((a, b) => a + b, 0);
    const recentQueueInterval = timestamps[timestamps.length - 1] - timestamps[recentIndex];
    const recentDifficulty = _this.config.targetTime / recentQueueInterval * recentDiffSum;

    // Calculate and Return New Difficulty Average
    const newDifficulty = utils.roundTo(historicalDifficulty * (1 - recentWeight) + recentDifficulty * recentWeight, 4);
    return newDifficulty || null;
  };

  // Handle Individual Clients
  this.handleClient = function(client) {

    // Add Event Listeners to Client Instance

    // Client Subscribes
    client.on('client.subscription', () => {
      if (!(Object.keys(_this.clients).includes(client.id))) {
        const curTime = (Date.now() / 1000) | 0;
        _this.clients[client.id] = { difficulties: [], timestamps: [] };
        _this.clients[client.id].timestamps.push(curTime);
        _this.lastRetargetTime = curTime - _this.config.retargetTime / 2;
        _this.lastSavedTime = curTime;
      }
    });

    // Client Submission
    client.on('client.submit', () => _this.handleDifficulty(client));
  };

  // Handle Difficulty Updates
  this.handleDifficulty = function(client) {

    // Update Current Time/Values
    const curTime = (Date.now() / 1000) | 0;

    // Append New Value to Queue
    const queue = _this.clients[client.id];
    queue.difficulties.push(client.difficulty);
    queue.timestamps.push(curTime);
    if (queue.difficulties.length > _this.maxSize) {
      queue.difficulties.shift();
      queue.timestamps.shift();
    };

    // Calculate Difference Between Desired vs. Average Time
    if (curTime - _this.lastRetargetTime < _this.config.retargetTime) return;
    const newDifficulty = _this.setDifficulty(client);
    const diffCorrection = newDifficulty / client.difficulty || 1; 

    // Difficulty Will Be Updated
    if (newDifficulty != null && diffCorrection != 1 && (diffCorrection > _this.maxBoundary || diffCorrection < _this.minBoundary)) {
      _this.emit('client.difficulty.new', client, newDifficulty);
    };

    // Update Retarget Time
    _this.lastRetargetTime = curTime;
  };
};

module.exports = Difficulty;
Difficulty.prototype.__proto__ = events.EventEmitter.prototype;
