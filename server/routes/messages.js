const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../middleware/auth');
const DailyMessage = require('../models/DailyMessage');
const Timetable = require('../models/Timetable');

// Get today's daily message
router.get('/daily', authenticate, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const message = await DailyMessage.findOne({ date: today });
    res.json(message || { message: '' });
  } catch (error) {
    console.error('Error fetching daily message:', error);
    res.status(500).json({ message: 'Error fetching daily message' });
  }
});

// Update today's daily message (admin only)
router.put('/daily', authenticate, isAdmin, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const today = new Date().toISOString().split('T')[0];
    const dailyMessage = await DailyMessage.findOneAndUpdate(
      { date: today },
      { message, createdBy: req.user._id },
      { upsert: true, new: true }
    );

    res.json(dailyMessage);
  } catch (error) {
    console.error('Error updating daily message:', error);
    res.status(500).json({ message: 'Error updating daily message' });
  }
});

// Get current period's message
router.get('/period/:period', authenticate, async (req, res) => {
  try {
    const { period } = req.params;
    const timetable = await Timetable.findOne().sort({ lastUpdated: -1 });
    
    if (!timetable) {
      return res.status(404).json({ message: 'No timetable found' });
    }

    const periodData = timetable.periods[period - 1];
    if (!periodData) {
      return res.status(404).json({ message: 'Period not found' });
    }

    res.json({ message: periodData.message || '' });
  } catch (error) {
    console.error('Error fetching period message:', error);
    res.status(500).json({ message: 'Error fetching period message' });
  }
});

// Get all period messages (admin only)
router.get('/periods', authenticate, isAdmin, async (req, res) => {
  try {
    const timetable = await Timetable.findOne().sort({ lastUpdated: -1 });
    
    if (!timetable) {
      return res.status(404).json({ message: 'No timetable found' });
    }

    const periodMessages = timetable.periods.map((period, index) => ({
      period: index + 1,
      message: period.message || ''
    }));

    res.json(periodMessages);
  } catch (error) {
    console.error('Error fetching period messages:', error);
    res.status(500).json({ message: 'Error fetching period messages' });
  }
});

module.exports = router; 