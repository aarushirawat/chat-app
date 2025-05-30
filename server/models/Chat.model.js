const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  username: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now, expires: 60 * 60 * 24 } // 24 hours in seconds
});

module.exports = mongoose.model('Chat', chatSchema);
