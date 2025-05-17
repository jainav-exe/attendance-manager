const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  period: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  status: {
    type: String,
    required: true,
    enum: ['present', 'absent', 'late']
  },
  timestamp: {
    type: Date,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  reason: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate attendance records
attendanceSchema.index({ student: 1, period: 1, date: 1 }, { unique: true });

// Add method to check if attendance can be marked
attendanceSchema.statics.canMarkAttendance = async function(studentId, period, timestamp) {
  const timetable = await mongoose.model('Timetable').findOne().sort({ lastUpdated: -1 });
  if (!timetable) return false;

  const periodData = timetable.periods[period - 1];
  if (!periodData) return false;

  const [startHours, startMinutes] = periodData.startTime.split(':').map(Number);
  const startTime = startHours * 60 + startMinutes;
  
  const now = new Date(timestamp);
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  // Allow marking only in the first minute of the period
  return currentTime >= startTime && currentTime < startTime + 1;
};

module.exports = mongoose.model('Attendance', attendanceSchema); 