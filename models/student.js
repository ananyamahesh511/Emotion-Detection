// models/Student.js

const mongoose = require('mongoose');

const EmotionLogSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  emotion: String,
  screenshotPath: String
});

const StudentSchema = new mongoose.Schema({
  name: String,
  id_number: { type: String, unique: true },
  faceDescriptor: [Number],  // 128-dimensional array from face-api.js
  emotionLogs: [EmotionLogSchema]
});

module.exports = mongoose.model('Student', StudentSchema);
