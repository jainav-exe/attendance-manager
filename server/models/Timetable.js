const mongoose = require('mongoose');

const periodSchema = new mongoose.Schema({
  startTime: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: props => `${props.value} is not a valid time format (HH:MM)`
    }
  },
  endTime: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: props => `${props.value} is not a valid time format (HH:MM)`
    }
  },
  message: {
    type: String,
    default: '',
    trim: true
  }
});

const timetableSchema = new mongoose.Schema({
  periods: {
    type: [periodSchema],
    required: true,
    validate: {
      validator: function(periods) {
        return periods.length === 5; // Must have exactly 5 periods
      },
      message: 'Timetable must have exactly 5 periods'
    }
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Ensure periods don't overlap
timetableSchema.pre('save', function(next) {
  const periods = this.periods;
  
  for (let i = 0; i < periods.length; i++) {
    const current = periods[i];
    const currentStart = this.timeToMinutes(current.startTime);
    const currentEnd = this.timeToMinutes(current.endTime);
    
    // Check if start time is before end time
    if (currentStart >= currentEnd) {
      return next(new Error('Start time must be before end time'));
    }
    
    // Check for overlaps with other periods
    for (let j = i + 1; j < periods.length; j++) {
      const other = periods[j];
      const otherStart = this.timeToMinutes(other.startTime);
      const otherEnd = this.timeToMinutes(other.endTime);
      
      if ((currentStart < otherEnd && currentEnd > otherStart)) {
        return next(new Error('Periods cannot overlap'));
      }
    }
  }
  
  next();
});

// Helper method to convert time string to minutes
timetableSchema.methods.timeToMinutes = function(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

module.exports = mongoose.model('Timetable', timetableSchema); 