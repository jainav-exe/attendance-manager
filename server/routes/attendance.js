const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../middleware/auth');
const Attendance = require('../models/Attendance');
const Timetable = require('../models/Timetable');

// Mark attendance
router.post('/mark', authenticate, async (req, res) => {
  try {
    const { period, status, timestamp } = req.body;
    const studentId = req.user._id;

    // Validate input
    if (!period || !status || !timestamp) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if attendance can be marked
    const canMark = await Attendance.canMarkAttendance(studentId, period, timestamp);
    if (!canMark) {
      return res.status(400).json({ message: 'Attendance cannot be marked at this time' });
    }

    // Check if attendance already marked for this period
    const existingAttendance = await Attendance.findOne({
      student: studentId,
      period,
      date: new Date(timestamp).toISOString().split('T')[0]
    });

    if (existingAttendance) {
      return res.status(400).json({ message: 'Attendance already marked for this period' });
    }

    // Create attendance record
    const attendance = new Attendance({
      student: studentId,
      period,
      status,
      timestamp: new Date(timestamp),
      date: new Date(timestamp).toISOString().split('T')[0]
    });

    await attendance.save();
    res.json({ message: 'Attendance marked successfully', attendance });
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({ message: 'Error marking attendance' });
  }
});

// Get attendance records for a student
router.get('/:studentId', authenticate, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate } = req.query;

    // Check if user is admin or the student themselves
    if (req.user.role !== 'admin' && req.user._id.toString() !== studentId) {
      return res.status(403).json({ message: 'Not authorized to view these records' });
    }

    // Validate dates if provided
    const query = { student: studentId };
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const attendance = await Attendance.find(query)
      .sort({ date: -1, period: 1 })
      .populate('student', 'name email');

    res.json(attendance);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ message: 'Error fetching attendance records' });
  }
});

// Get attendance statistics (admin only)
router.get('/stats/overview', authenticate, isAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const query = {};
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const stats = await Attendance.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            date: '$date',
            period: '$period',
            status: '$status'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: {
            date: '$_id.date',
            period: '$_id.period'
          },
          stats: {
            $push: {
              status: '$_id.status',
              count: '$count'
            }
          }
        }
      }
    ]);

    res.json(stats);
  } catch (error) {
    console.error('Error fetching attendance stats:', error);
    res.status(500).json({ message: 'Error fetching attendance statistics' });
  }
});

module.exports = router; 