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

    // Check that Queue has Sufficient Entries
    if (queueLength < 2) return null;

    // Process Queue
    const difficultySum = difficulties.reduce((a, b) => a + b, 0);
    const queueInterval = timestamps[timestamps.length - 1] - timestamps[0];
    const targetDifficulty =  _this.config.targetTime / queueInterval * difficultySum;

    // Return New Difficulty
    return utils.roundTo(targetDifficulty, 4) || null;
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
