import * as tf from '@tensorflow/tfjs';

// Model Configuration
export const MODEL_CONFIG = {
    faceDetection: {
        inputSize: 160,  // Reduced size for better performance
        confidenceThreshold: 0.3,  // Lower threshold for better detection
        iouThreshold: 0.5,
        maxDetections: 10
    },
    emotionRecognition: {
        inputSize: 48,
        emotions: ['angry', 'disgusted', 'fearful', 'happy', 'neutral', 'sad', 'surprised']
    }
};

// Create Face Detection Model
export async function createFaceDetectionModel() {
    const model = tf.sequential();

    // Input Layer with smaller input size
    model.add(tf.layers.conv2d({
        inputShape: [MODEL_CONFIG.faceDetection.inputSize, MODEL_CONFIG.faceDetection.inputSize, 3],
        filters: 32,
        kernelSize: 3,
        strides: 1,
        padding: 'same',
        activation: 'relu'
    }));
    model.add(tf.layers.batchNormalization());
    model.add(tf.layers.maxPooling2d({ poolSize: 2 }));

    // Deeper feature extraction
    model.add(tf.layers.conv2d({
        filters: 64,
        kernelSize: 3,
        padding: 'same',
        activation: 'relu'
    }));
    model.add(tf.layers.batchNormalization());
    model.add(tf.layers.maxPooling2d({ poolSize: 2 }));

    model.add(tf.layers.conv2d({
        filters: 128,
        kernelSize: 3,
        padding: 'same',
        activation: 'relu'
    }));
    model.add(tf.layers.batchNormalization());
    model.add(tf.layers.maxPooling2d({ poolSize: 2 }));

    // Additional layers for better feature extraction
    model.add(tf.layers.conv2d({
        filters: 256,
        kernelSize: 3,
        padding: 'same',
        activation: 'relu'
    }));
    model.add(tf.layers.batchNormalization());
    model.add(tf.layers.maxPooling2d({ poolSize: 2 }));

    // Dense layers for face detection
    model.add(tf.layers.flatten());
    model.add(tf.layers.dense({ units: 512, activation: 'relu' }));
    model.add(tf.layers.dropout({ rate: 0.5 }));
    model.add(tf.layers.dense({ units: 256, activation: 'relu' }));
    model.add(tf.layers.dropout({ rate: 0.5 }));
    
    // Output: [x, y, width, height, confidence]
    model.add(tf.layers.dense({
        units: 5,
        activation: 'sigmoid',
        kernelInitializer: 'glorotNormal'
    }));

    // Compile with modified learning rate
    model.compile({
        optimizer: tf.train.adam(0.0001),
        loss: 'meanSquaredError',
        metrics: ['accuracy']
    });

    return model;
}

// Create Emotion Recognition Model
export async function createEmotionRecognitionModel() {
    const model = tf.sequential();

    // Input Layer
    model.add(tf.layers.conv2d({
        inputShape: [MODEL_CONFIG.emotionRecognition.inputSize, MODEL_CONFIG.emotionRecognition.inputSize, 3],
        filters: 32,
        kernelSize: 3,
        activation: 'relu'
    }));
    model.add(tf.layers.batchNormalization());
    model.add(tf.layers.maxPooling2d({ poolSize: 2 }));

    // Feature Extraction
    model.add(tf.layers.conv2d({
        filters: 64,
        kernelSize: 3,
        activation: 'relu'
    }));
    model.add(tf.layers.batchNormalization());
    model.add(tf.layers.maxPooling2d({ poolSize: 2 }));

    model.add(tf.layers.conv2d({
        filters: 128,
        kernelSize: 3,
        activation: 'relu'
    }));
    model.add(tf.layers.batchNormalization());
    model.add(tf.layers.maxPooling2d({ poolSize: 2 }));

    // Classification Head
    model.add(tf.layers.flatten());
    model.add(tf.layers.dropout({ rate: 0.5 }));
    model.add(tf.layers.dense({
        units: 128,
        activation: 'relu',
        kernelRegularizer: tf.regularizers.l2({ l2: 0.01 })
    }));
    model.add(tf.layers.dropout({ rate: 0.5 }));
    model.add(tf.layers.dense({
        units: MODEL_CONFIG.emotionRecognition.emotions.length,
        activation: 'softmax'
    }));

    // Compile model
    model.compile({
        optimizer: tf.train.adam(0.0001),
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
    });

    return model;
}

// Image Processing Functions
export function preprocessImage(img, targetSize) {
    return tf.tidy(() => {
        // Convert to tensor
        let tensor = tf.browser.fromPixels(img);
        
        // Resize
        tensor = tf.image.resizeBilinear(tensor, [targetSize, targetSize]);
        
        // Normalize to [-1, 1] range for better model performance
        tensor = tf.sub(tf.div(tensor, 127.5), 1);
        
        // Add batch dimension
        return tf.expandDims(tensor, 0);
    });
}

// Face Detection Functions
export async function detectFaces(model, img) {
    return tf.tidy(() => {
        const tensor = preprocessImage(img, MODEL_CONFIG.faceDetection.inputSize);
        const predictions = model.predict(tensor);
        return predictions.arraySync()[0];
    });
}

// Emotion Recognition Functions
export async function recognizeEmotion(model, faceImg) {
    return tf.tidy(() => {
        const tensor = preprocessImage(faceImg, MODEL_CONFIG.emotionRecognition.inputSize);
        const predictions = model.predict(tensor);
        return predictions.arraySync()[0];
    });
}

// Emotion Suggestions
export const EMOTION_SUGGESTIONS = {
    angry: [
        "Take deep breaths and count to 10",
        "Try progressive muscle relaxation",
        "Listen to calming music",
        "Take a short walk to cool down"
    ],
    disgusted: [
        "Change your environment or focus",
        "Practice mindful acceptance",
        "Take a moment to reframe the situation",
        "Focus on something pleasant"
    ],
    fearful: [
        "Ground yourself using the 5-4-3-2-1 technique",
        "Practice box breathing",
        "Call a friend or family member",
        "Remember this feeling will pass"
    ],
    happy: [
        "Share your joy with others",
        "Write down what made you happy",
        "Take a photo to capture this moment",
        "Express gratitude for this feeling"
    ],
    neutral: [
        "Check in with your body and mind",
        "Set an intention for the day",
        "Practice mindfulness",
        "Consider your next goal"
    ],
    sad: [
        "Reach out to a friend",
        "Listen to uplifting music",
        "Write in a journal",
        "Do something kind for yourself"
    ],
    surprised: [
        "Take a moment to process",
        "Write down what surprised you",
        "Share the experience if positive",
        "Use this energy constructively"
    ]
};

// Get Random Suggestion
export function getRandomSuggestion(emotion) {
    const suggestions = EMOTION_SUGGESTIONS[emotion];
    return suggestions[Math.floor(Math.random() * suggestions.length)];
}

// Model Loading Functions
export async function loadSavedModel(type) {
    try {
        const model = await tf.loadLayersModel(`models/${type}/model.json`);
        console.log(`Loaded saved ${type} model`);
        return model;
    } catch (error) {
        console.warn(`Could not load saved ${type} model:`, error);
        return null;
    }
}

// Initialize Models with pre-trained weights
export async function initializeModels() {
    try {
        // Enable WebGL backend
        await tf.setBackend('webgl');
        console.log('Using WebGL backend');

        // Create models
        const faceModel = await createFaceDetectionModel();
        const emotionModel = await createEmotionRecognitionModel();

        // Load pre-trained weights
        try {
            // Load the pre-trained weights
            await faceModel.loadWeights('https://storage.googleapis.com/tfjs-models/weights/face_detection_model/model.json');
            await emotionModel.loadWeights('https://storage.googleapis.com/tfjs-models/weights/emotion_recognition_model/model.json');
            console.log('Loaded pre-trained weights successfully');
        } catch (error) {
            console.warn('Using initialized models without pre-trained weights:', error);
        }

        return { faceModel, emotionModel };
    } catch (error) {
        console.error('Error initializing models:', error);
        throw error;
    }
} 