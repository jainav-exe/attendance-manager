const mongoose = require('mongoose');

const dailyMessageSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    default: Date.now,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

// Ensure only one message per day
dailyMessageSchema.index({ date: 1 }, { unique: true });

module.exports = mongoose.model('DailyMessage', dailyMessageSchema); 