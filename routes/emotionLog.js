const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const EmotionLog = require('../models/EmotionLog');

router.post('/logEmotion', async (req, res) => {
  try {
    const { studentId, emotion, timestamp, screenshotData } = req.body;

    const uploadsDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir);
    }

    const fileName = `emotion_${studentId}_${Date.now()}.jpg`;
    const filePath = path.join(uploadsDir, fileName);

    const base64Data = screenshotData.replace(/^data:image\/jpeg;base64,/, '');
    fs.writeFileSync(filePath, base64Data, 'base64');

    const emotionLog = new EmotionLog({
      studentId,
      emotion,
      timestamp,
      screenshotPath: `uploads/${fileName}`
    });

    await emotionLog.save();

    res.json({ message: 'Emotion log saved' });
  } catch (error) {
    console.error('Error saving emotion log:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
