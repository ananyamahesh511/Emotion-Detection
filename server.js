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
app.use('/api/emotion-logs', emotionLogRoute);
const cors = require('cors');
app.use(cors({
  origin: 'http://127.0.0.1:5501' // allow this origin (your frontend)
}));

// Get all emotion logs
app.get('/', async (req, res) => {
  try {
    const logs = await EmotionLog.find({}, 'studentId emotion timestamp screenshotPath').sort({ timestamp: -1 });
    res.json(logs);
  } catch (error) {
    console.error('Failed to fetch logs:', error);
    res.status(500).json({ message: 'Error fetching logs' });
  }
});

//mongoose connections
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




//Gallery 
app.get('/gallery', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'gallery.html'));
});


const uploadsDir = path.join(__dirname, 'uploads');

app.get('/api/gallery', (req, res) => {
  fs.readdir(uploadsDir, (err, files) => {
    if (err) {
      console.error('Error reading uploads:', err);
      return res.status(500).json({ error: 'Failed to load images' });
    }

    // Filter only .jpg or .png files
    const images = files.filter(file => /\.(jpg|jpeg|png)$/.test(file));
    res.json(images);
  });
});


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
            timestamp: new Date(timestamp),
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

//gallery
app.get('/api/logEmotion', async (req, res) => {
  try {
    const logs = await EmotionLog.find().sort({ timestamp: -1 });

    const logsWithImages = await Promise.all(
      logs.map(async (log) => {
        const imagePath = path.join(__dirname, log.screenshotPath);
        try {
          const imageBuffer = await fs.promises.readFile(imagePath);
          const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;

          return {
            studentId: log.studentId,
            emotion: log.emotion,
            timestamp: log.timestamp,
            screenshotData: base64Image
          };
        } catch (err) {
          console.error(`Failed to read image for log ${log._id}:`, err);
          return null; // skip this log
        }
      })
    );

    // Filter out any null logs (due to missing images)
    res.json(logsWithImages.filter(log => log !== null));
  } catch (error) {
    console.error('Failed to fetch logs with images:', error);
    res.status(500).json({ message: 'Error fetching logs' });
  }
});
app.use('/', emotionLogRoute);

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
