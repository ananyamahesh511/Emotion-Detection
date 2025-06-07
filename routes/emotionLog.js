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

router.delete('/:id', async (req, res) => {
  try {
    const log = await EmotionLog.findById(req.params.id);
    if (!log) return res.status(404).json({ error: 'Log not found' });

    // Extract filename from imageUrl
    const filename = path.basename(log.imageUrl);
    const filePath = path.join(__dirname, '..', 'uploads', filename);

    // Delete the image file
    fs.unlink(filePath, (err) => {
      if (err) {
        console.warn(`Could not delete file: ${filePath}`);
      } else {
        console.log(`Deleted file: ${filePath}`);
      }
    });

    // Delete the MongoDB record
    await log.deleteOne();

    res.json({ success: true, message: 'Log and image deleted' });
  } catch (err) {
    console.error('Error deleting log:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
