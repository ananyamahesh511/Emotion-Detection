const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const EmotionLog = require('./models/EmotionLog'); // adjust if needed

const mongoURI = 'mongodb://localhost:27017/your-db-name';

mongoose.connect(mongoURI);

mongoose.connection.once('open', async () => {
  console.log('Connected to MongoDB');

  const uploadsDir = path.join(__dirname, 'uploads');
  const files = fs.readdirSync(uploadsDir);

  // Fetch only logs where imageUrl exists and is non-empty
  const logs = await EmotionLog.find({ imageUrl: { $exists: true, $ne: null } }, 'imageUrl');

  // Filter out any entries where imageUrl is invalid
  const imageFilenames = logs
    .map(log => log.imageUrl)
    .filter(Boolean)
    .map(imageUrl => path.basename(imageUrl));

  let deleted = 0;

  for (const file of files) {
    if (!imageFilenames.includes(file)) {
      const filePath = path.join(uploadsDir, file);
      fs.unlinkSync(filePath);
      console.log(`Deleted orphaned file: ${file}`);
      deleted++;
    }
  }

  console.log(`Cleanup complete. ${deleted} files deleted.`);
  mongoose.disconnect();
});
