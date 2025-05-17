const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../middleware/auth');
const Timetable = require('../models/Timetable');

// Get current timetable
router.get('/', authenticate, async (req, res) => {
  try {
    const timetable = await Timetable.findOne().sort({ lastUpdated: -1 });
    if (!timetable) {
      return res.status(404).json({ message: 'No timetable found' });
    }
    res.json(timetable.periods);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching timetable', error: error.message });
  }
});

// Update timetable (admin only)
router.put('/', authenticate, isAdmin, async (req, res) => {
  try {
    const periods = req.body;
    
    // Validate periods
    if (!Array.isArray(periods) || periods.length !== 5) {
      return res.status(400).json({ message: 'Timetable must have exactly 5 periods' });
    }

    // Validate each period
    for (const period of periods) {
      if (!period.startTime || !period.endTime) {
        return res.status(400).json({ message: 'Each period must have start and end times' });
      }
    }

    // Create new timetable
    const timetable = new Timetable({ periods });
    await timetable.save();

    res.json({ message: 'Timetable updated successfully', periods: timetable.periods });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error updating timetable', error: error.message });
  }
});

module.exports = router; 