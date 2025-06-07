const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
app.use((req, res, next) => {
  console.log(`Request received → ${req.method} ${req.url}`);
  next();
});
app.use(express.json({ limit: '10mb' })); 

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

const EmotionLog = require('./models/EmotionLog');
const mongoose = require('mongoose');
const emotionLogRoute = require('./routes/emotionLog');
const cors = require('cors');
app.use(cors({
  origin: 'http://127.0.0.1:5501' // allow this origin (your frontend)
}));



mongoose.connect('mongodb://localhost:27017/emotionDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));
const PORT = 5000;

// Middleware
app.use(express.json());

app.use('/models', express.static(path.join(__dirname, 'models')));



//routes
app.get('/test-image', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'placeholder-avatar.jpg'));
});

app.get('/test', (req, res) => {
  console.log('Test endpoint hit');
  res.send('Test successful');
});


app.use('/', emotionLogRoute);

// Ensure screenshots folder exists
const screenshotDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir);
}

// Route to handle emotion logging
app.post('/logEmotion', (req, res) => {
    console.log('Received logEmotion POST');

    const { studentId, emotion, timestamp, screenshotData } = req.body;

    if (!studentId || !emotion || !timestamp || !screenshotData) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    // ✅ Extract base64 data and type
    const matches = screenshotData.match(/^data:image\/(jpeg|png);base64,(.+)$/);
    if (!matches) {
        return res.status(400).json({ message: 'Unsupported image format or invalid base64' });
    }

    const imageExtension = matches[1]; // "jpeg" or "png"
    const base64Data = matches[2];

    const filename = `${studentId}_${emotion}_${timestamp}.${imageExtension}`;
    const filepath = path.join(__dirname, 'uploads', filename);

    fs.writeFile(filepath, base64Data, 'base64', (err) => {
        if (err) {
            console.error('Error saving screenshot:', err);
            return res.status(500).json({ message: 'Failed to save screenshot' });
        }

        console.log(`✅ Saved screenshot: ${filename}`);

        EmotionLog.create({
            studentId,
            emotion,
            timestamp,
            screenshotPath: `uploads/${filename}`
        })
        .then(() => {
            console.log('✅ Emotion log saved to DB');
            res.status(200).json({ message: 'Screenshot and log saved successfully' });
        })
        .catch((err) => {
            console.error('❌ Failed to save to DB:', err);
            res.status(500).json({ message: 'Failed to save to database' });
        });
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
