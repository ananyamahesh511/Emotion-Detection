
// DOM Elements
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const emotionText = document.getElementById('emotion-text');
const suggestionText = document.getElementById('suggestion-text');
const loadingElement = document.getElementById('loading');
const debugPanel = document.getElementById('debug-panel');
//global variables
let faceMatcher;
// Configuration
const emotions = ['angry', 'disgusted', 'fearful', 'happy', 'neutral', 'sad', 'surprised'];
const emotionColors = {
    angry: '#FF0000',
    disgusted: '#800080',
    fearful: '#FFA500',
    happy: '#00FF00',
    neutral: '#FFFFFF',
    sad: '#0000FF',
    surprised: '#FFFF00'
};

// Emotion Detection Configuration
const EMOTION_THRESHOLD = 0.5; // Minimum confidence threshold
const EMOTION_STABILITY_FRAMES = 5; // Number of frames to confirm emotion
const SCREENSHOT_COOLDOWN = 3000; // 3 seconds between screenshots

// Screenshot handling
const negativeEmotions = ['angry', 'disgusted', 'fearful', 'sad'];
const screenshots = [];
const maxScreenshots = 3;
let screenshotQueue = []; // Queue to handle multiple screenshots

// State
let isRunning = false;
let lastEmotionUpdate = 0;
let lastScreenshotTime = 0;
let emotionHistories = new Map(); // Map to store emotion histories for multiple faces
const EMOTION_UPDATE_INTERVAL = 500; // Update emotion every 500ms

// Mock database of people (replace with your actual database)
const peopleDatabase = [
    {
        id: "1",
        name: "Ananya",
        photo: "placeholder-avatar.jpg",
        contact: {
            phone: "9945565509",
            email: "ann@gmail.com.com",
            address: "Bangalore"
        }
    }
];



// Simulate loading labeled face descriptors
async function loadLabeledDescriptors() {
    const labeledDescriptors = [];

    for (const person of peopleDatabase) {
        const img = await faceapi.fetchImage(person.photo); // image must be clear face
        const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();

        if (detections) {
            const descriptor = detections.descriptor;
            labeledDescriptors.push(new faceapi.LabeledFaceDescriptors(String(person.id), [descriptor]));
        }
    }

    faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6); // 0.6 is the similarity threshold
}


// Function to get stable emotion for a face
function getStableEmotion(expressions, faceId) {
    let dominantEmotion = 'neutral';
    let maxConfidence = 0;

    // Find the emotion with highest confidence above threshold
    for (const [emotion, confidence] of Object.entries(expressions)) {
        if (confidence > maxConfidence && confidence > EMOTION_THRESHOLD) {
            maxConfidence = confidence;
            dominantEmotion = emotion;
        }
    }

    // Initialize emotion history for this face if it doesn't exist
    if (!emotionHistories.has(faceId)) {
        emotionHistories.set(faceId, []);
    }
    let emotionHistory = emotionHistories.get(faceId);

    // Add to emotion history
    emotionHistory.push(dominantEmotion);
    if (emotionHistory.length > EMOTION_STABILITY_FRAMES) {
        emotionHistory.shift();
    }

    // Check if the emotion is stable
    const stableEmotion = emotionHistory.reduce((acc, curr) => {
        acc[curr] = (acc[curr] || 0) + 1;
        return acc;
    }, {});

    // Return most frequent emotion if it appears in majority of frames
    const majorityCount = Math.ceil(EMOTION_STABILITY_FRAMES / 2);
    for (const [emotion, count] of Object.entries(stableEmotion)) {
        if (count >= majorityCount) {
            return { emotion, confidence: maxConfidence };
        }
    }

    return { emotion: 'neutral', confidence: maxConfidence };
}

// Function to capture screenshot
async function captureScreenshot(emotion, faceBox, allDetections,confidence) {

    console.log(`📸 Attempting to capture screenshot: ${emotion}, confidence: ${confidence}`);

    const now = Date.now();
    if (now - lastScreenshotTime < SCREENSHOT_COOLDOWN) {
        // Add to queue instead of returning
        screenshotQueue.push({ emotion, faceBox, allDetections });
        return;
    }

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;
    const tempCtx = tempCanvas.getContext('2d');

    // Draw the video frame
    tempCtx.drawImage(video, 0, 0);

    // Draw boxes around all faces showing negative emotions
    allDetections.forEach((detection, index) => {
        const { emotion: currentEmotion } = getStableEmotion(detection.expressions, index);
        if (negativeEmotions.includes(currentEmotion)) {
            const box = detection.detection.box;

            // Draw colored box based on emotion
            tempCtx.strokeStyle = emotionColors[currentEmotion];
            tempCtx.lineWidth = 3;
            tempCtx.strokeRect(box.x, box.y, box.width, box.height);

            // Add emotion label
            tempCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            tempCtx.fillRect(box.x, box.y - 30, 120, 30);
            tempCtx.fillStyle = emotionColors[currentEmotion];
            tempCtx.font = '20px Arial';
            tempCtx.fillText(`#${index + 1}: ${currentEmotion}`, box.x + 5, box.y - 5);
        }
    });

    const screenshot = {
        emotion: emotion,
        timestamp: now,
        dataUrl: tempCanvas.toDataURL('image/jpeg',0.8)
    };

    screenshots.push(screenshot);
    if (screenshots.length > maxScreenshots) {
        screenshots.shift(); // Remove oldest screenshot
    }

    // Convert base64 to just the data part
    const base64Image = screenshot.dataUrl.split(',')[1];


    // Match the face from the screenshot to find the student
    const singleFace = await faceapi
        .detectSingleFace(tempCanvas, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

    if (singleFace) {
        const bestMatch = faceMatcher.findBestMatch(singleFace.descriptor);
        const matchedId = bestMatch.label;

        if (matchedId !== 'unknown' && negativeEmotions.includes(emotion)) {
            console.log("📤 Sending emotion data to server...");

            fetch('http://localhost:5000/logEmotion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId: matchedId,
                    emotion: emotion,
                    timestamp: now,
                    screenshotData: base64Image
                })
            })
                .then(res => res.json())
                .then(data => console.log('Screenshot log response:', data))
                .catch(err => console.error('Screenshot log error:', err));

        }
    }


    lastScreenshotTime = now;
    updateScreenshotsDisplay();

    // Process queued screenshots after cooldown
    setTimeout(() => {
        if (screenshotQueue.length > 0) {
            const next = screenshotQueue.shift();
            captureScreenshot(next.emotion, next.faceBox, next.allDetections);
        }
    }, SCREENSHOT_COOLDOWN);
}

// Function to update screenshots display
function updateScreenshotsDisplay() {
    screenshots.forEach((screenshot, index) => {
        const screenshotElement = document.getElementById(`screenshot${index + 1}`);
        if (screenshotElement) {
            screenshotElement.src = screenshot.dataUrl;
            screenshotElement.alt = `${screenshot.emotion} - ${new Date(screenshot.timestamp).toLocaleTimeString()}`;
        }
    });
}

// Function to update person details
function updatePersonDetails(person) {
    const personPhoto = document.getElementById('person-photo');
    const personName = document.getElementById('person-name');
    const personDetails = document.getElementById('person-details');

    if (person) {
        personPhoto.src = person.photo;
        personName.textContent = person.name;
        personDetails.innerHTML = `
            <p><strong>Phone:</strong> ${person.contact.phone}</p>
            <p><strong>Email:</strong> ${person.contact.email}</p>
            <p><strong>Address:</strong> ${person.contact.address}</p>
        `;
    } else {
        personPhoto.src = 'placeholder-avatar.jpg';
        personName.textContent = 'Person Name';
        personDetails.textContent = 'No person detected';
    }
}

// Draw face detection results
function drawDetections(detections) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    detections.forEach((detection, index) => {
        const box = detection.detection.box;
        const { emotion, confidence } = getStableEmotion(detection.expressions, index);

        ctx.strokeStyle = emotionColors[emotion];
        ctx.lineWidth = 2;
        ctx.strokeRect(box.x, box.y, box.width, box.height);

        // Draw face number
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(box.x, box.y - 30, 120, 30);
        ctx.fillStyle = emotionColors[emotion];
        ctx.font = '20px Arial';
        ctx.fillText(`#${index + 1}: ${emotion}`, box.x + 5, box.y - 5);
    });
}

// Update emotion display
function updateEmotionDisplay(detections) {
    if (detections.length === 0) {
        emotionText.textContent = 'No faces detected';
        suggestionText.textContent = '';
        return;
    }

    const emotionSummary = detections.map((detection, index) => {
        const { emotion, confidence } = getStableEmotion(detection.expressions, index);
        return `Person #${index + 1}: ${emotion} (${Math.round(confidence * 100)}%)`;
    }).join(' | ');

    emotionText.textContent = emotionSummary;

    // Show suggestion for the first person with a negative emotion
    const negativeDetection = detections.find(detection => {
        const { emotion } = getStableEmotion(detection.expressions, detections.indexOf(detection));
        return negativeEmotions.includes(emotion);
    });

    if (negativeDetection) {
        const { emotion } = getStableEmotion(negativeDetection.expressions, detections.indexOf(negativeDetection));
        suggestionText.textContent = getSuggestion(emotion);
    } else {
        suggestionText.textContent = '';
    }
}

// Get random suggestion for emotion
function getSuggestion(emotion) {
    const suggestions = {
        angry: [
            "Take deep breaths and count to 10",
            "Try progressive muscle relaxation",
            "Listen to calming music",
            "Take a short walk"
        ],
        disgusted: [
            "Focus on something pleasant",
            "Change your environment",
            "Practice mindful acceptance",
            "Think of something you enjoy"
        ],
        fearful: [
            "Ground yourself: name 5 things you can see",
            "Practice deep breathing",
            "Remember you are safe",
            "Call someone you trust"
        ],
        sad: [
            "It's okay to feel this way",
            "Listen to uplifting music",
            "Talk to someone you trust",
            "Do something kind for yourself"
        ]
    };

    const options = suggestions[emotion] || ["Take a moment to breathe"];
    return options[Math.floor(Math.random() * options.length)];
}

// Process video frame
async function processFrame() {
    if (!isRunning) return;

    try {
        const detections = await faceapi.detectAllFaces(
            video,
            new faceapi.TinyFaceDetectorOptions()
        ).withFaceExpressions();

        if (detections && detections.length > 0) {
            const now = Date.now();
            if (now - lastEmotionUpdate >= EMOTION_UPDATE_INTERVAL) {
                updateEmotionDisplay(detections);
                lastEmotionUpdate = now;

                // Clear screenshot queue at the start of each frame
                screenshotQueue = [];

                // Check each face for negative emotions
                detections.forEach((detection, index) => {
                    const { emotion, confidence } = getStableEmotion(detection.expressions, index);
                    if (negativeEmotions.includes(emotion) && confidence > EMOTION_THRESHOLD) {
                        // Pass all detections to capture screenshot for multiple faces
                        captureScreenshot(emotion, detection.detection.box, detections,confidence);
                        // Update person details for any person with negative emotion
                        updatePersonDetails(peopleDatabase[0]);
                    }
                });
            }

            drawDetections(detections);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            emotionText.textContent = 'No faces detected';
            suggestionText.textContent = '';
        }
    } catch (error) {
        console.error('Error processing frame:', error);
    }

    requestAnimationFrame(processFrame);
}

// Load required face-api.js models
async function loadModels() {
    try {
        loadingElement.innerHTML = '<h2>Loading AI Models...</h2><p>This may take a moment</p>';

        // Load models from official CDN
        const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
        await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
            faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
            faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
            faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL)

        ]);

        console.log('Models loaded successfully');
        return true;
    } catch (error) {
        console.error('Error loading models:', error);
        loadingElement.innerHTML = `
            <h2>Error Loading Models</h2>
            <p>Please make sure you have an internet connection and refresh the page.</p>
            <p>Error details: ${error.message}</p>
        `;
        return false;
    }
}


// Setup camera
async function setupCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: 640,
                height: 480,
                facingMode: 'user'
            }
        });

        video.srcObject = stream;
        return new Promise((resolve) => {
            video.onloadedmetadata = () => {
                video.play();
                resolve(true);
            };
        });
    } catch (error) {
        console.error('Error accessing camera:', error);
        loadingElement.innerHTML = `
            <h2>Camera Error</h2>
            <p>Please make sure you have given permission to access your camera and refresh the page.</p>
            <p>Error details: ${error.message}</p>
        `;
        return false;
    }
}

// Initialize the application
async function init() {
    try {
        const modelsLoaded = await loadModels();
        if (!modelsLoaded) return;

        const cameraReady = await setupCamera();
        if (!cameraReady) return;

        await loadLabeledDescriptors();  // <-- load descriptors first!

        loadingElement.style.display = 'none';
        isRunning = true;
        processFrame();  // <-- start processing after faceMatcher is ready

    } catch (error) {
        console.error('Initialization error:', error);
        loadingElement.innerHTML = `
            <h2>Error</h2>
            <p>${error.message}</p>
            <p>Please refresh the page to try again</p>
        `;
    }
}


// Start when page is loaded
document.addEventListener('DOMContentLoaded', init);