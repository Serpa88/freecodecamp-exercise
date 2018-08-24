const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const User = new Schema({
  username: String
});

const Exercise = new Schema({
  userId: Schema.Types.ObjectId,
  description: String,
  duration: Number,
  date: {type: Date, default: Date.now }
});

module.exports = {User: mongoose.model('User', User), Exercise: mongoose.model('Exercise', Exercise)};