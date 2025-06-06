const { https } = require('follow-redirects');
const fs = require('fs');
const path = require('path');

const baseUrl = 'https://github.com/justadudewhohacks/face-api.js/raw/master/weights/';
const models = [
  'tiny_face_detector_model-shard1',
  'tiny_face_detector_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
  'face_landmark_68_model-weights_manifest.json',
  'face_recognition_model-shard1',
  'face_recognition_model-weights_manifest.json',
  'face_expression_model-shard1',
  'face_expression_model-weights_manifest.json',
];

const modelsDir = path.join(__dirname, 'models');

if (!fs.existsSync(modelsDir)) {
  fs.mkdirSync(modelsDir);
}

function downloadFile(file) {
  return new Promise((resolve, reject) => {
    const url = baseUrl + file;
    const filePath = path.join(modelsDir, file);
    const fileStream = fs.createWriteStream(filePath);

    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to get '${url}' (${res.statusCode})`));
        return;
      }
      res.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close(() => {
          console.log(`Downloaded ${file}`);
          resolve();
        });
      });
    }).on('error', (err) => {
      fs.unlink(filePath, () => reject(err));
    });
  });
}

(async () => {
  try {
    for (const model of models) {
      await downloadFile(model);
    }
    console.log('✅ All models downloaded successfully!');
  } catch (err) {
    console.error('❌ Error downloading models:', err);
  }
})();
