const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    match: [/^[A-Za-z ]{2,}$/, 'Username must be a real name (letters and spaces only)'],
  },
  password: { type: String, required: true }
});

module.exports = mongoose.model('User', userSchema);

