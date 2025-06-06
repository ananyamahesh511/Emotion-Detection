// models/EmotionLog.js
const mongoose = require('mongoose');

const emotionLogSchema = new mongoose.Schema({
    studentId: String,
    emotion: String,
    timestamp: String,
    screenshotPath: String // relative path to the saved image
});

module.exports = mongoose.model('EmotionLog', emotionLogSchema);
