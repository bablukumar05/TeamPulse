const express = require('express');
const router = express.Router();
const TimeLog = require('../models/TimeLog');

// Start timer for a task
router.post('/start', async (req, res) => {
  try {
    const { taskId, userId } = req.body;
    
    // Check if there is an existing running time log
    const existingLog = await TimeLog.findOne({ task: taskId, user: userId, endTime: { $exists: false } });
    if (existingLog) {
      return res.status(400).json({ message: 'Timer is already running for this task' });
    }

    const timeLog = new TimeLog({
      task: taskId,
      user: userId,
      startTime: new Date()
    });
    
    await timeLog.save();
    res.status(201).json(timeLog);
  } catch (error) {
    res.status(500).json({ message: 'Failed to start timer', error: error.message });
  }
});

// Stop timer for a task
router.put('/stop/:id', async (req, res) => {
  try {
    const timeLog = await TimeLog.findById(req.params.id);
    if (!timeLog) return res.status(404).json({ message: 'Time log not found' });
    if (timeLog.endTime) return res.status(400).json({ message: 'Timer already stopped' });

    timeLog.endTime = new Date();
    timeLog.durationInSeconds = Math.round((timeLog.endTime - timeLog.startTime) / 1000);
    
    await timeLog.save();
    res.status(200).json(timeLog);
  } catch (error) {
    res.status(500).json({ message: 'Failed to stop timer', error: error.message });
  }
});

// Get total time logged for a specific task
router.get('/task/:taskId', async (req, res) => {
  try {
    const logs = await TimeLog.find({ task: req.params.taskId });
    
    let totalSeconds = logs.reduce((acc, log) => acc + (log.durationInSeconds || 0), 0);
    
    // Also add duration for currently running timer
    const runningLog = logs.find(log => !log.endTime);
    if (runningLog) {
      totalSeconds += Math.round((new Date() - runningLog.startTime) / 1000);
    }
    
    res.status(200).json({ logs, totalSeconds, isRunning: !!runningLog, currentLogId: runningLog ? runningLog._id : null });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch task time logs', error: error.message });
  }
});

module.exports = router;
