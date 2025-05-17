const cron = require('node-cron');
const mongoose = require('mongoose');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Timetable = require('../models/Timetable');

// Function to convert time string (HH:MM) to minutes since midnight
const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

// Function to get current period based on time
const getCurrentPeriod = async () => {
  const timetable = await Timetable.findOne().sort({ lastUpdated: -1 });
  if (!timetable) return null;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
  for (let i = 0; i < timetable.periods.length; i++) {
    const period = timetable.periods[i];
    const startMinutes = timeToMinutes(period.startTime);
    const endMinutes = timeToMinutes(period.endTime);
    
    if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
      return { period: i + 1, startTime: period.startTime };
    }
  }
  return null;
};

// Function to mark students absent for a period
const markStudentsAbsent = async (period, date) => {
  try {
    // Get all students
    const students = await User.find({ role: 'student' });
    
    // For each student, check if they have marked attendance
    for (const student of students) {
      const existingAttendance = await Attendance.findOne({
        student: student._id,
        period,
        date
      });

      // If no attendance record exists, mark as absent
      if (!existingAttendance) {
        const attendance = new Attendance({
          student: student._id,
          period,
          status: 'absent',
          timestamp: new Date(),
          date
        });
        await attendance.save();
        console.log(`Marked student ${student.name} absent for period ${period}`);
      }
    }
  } catch (error) {
    console.error('Error marking students absent:', error);
  }
};

// Schedule the cron job to run every minute
const startAttendanceCron = () => {
  cron.schedule('* * * * *', async () => {
    try {
      const currentPeriod = await getCurrentPeriod();
      if (!currentPeriod) return;

      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const periodStartMinutes = timeToMinutes(currentPeriod.startTime);
      
      // If we're exactly 1 minute after period start, mark absent students
      if (currentMinutes === periodStartMinutes + 1) {
        const today = now.toISOString().split('T')[0];
        await markStudentsAbsent(currentPeriod.period, today);
      }
    } catch (error) {
      console.error('Error in attendance cron job:', error);
    }
  });
};

module.exports = { startAttendanceCron }; 