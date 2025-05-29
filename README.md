Rooted in Emotion, Branching into Insights
Introducing our project, Bhav-chitran — a transformative solution in the field of mental health support. We aim to address the delays in traditional psychiatric and counseling services by providing early-stage assistance and effective interventions to targeted users.

Bhav-Chitran (भाव चित्रण) is an innovative emotion detection system that harnesses the power of artificial intelligence to interpret and visualize human emotions with depth and sensitivity. Inspired by the rich Indian tradition of understanding "bhav" (emotions), our project combines advanced deep learning techniques with a culturally resonant approach to uncover the intricate layers of human expression. Like a tree with roots deep in emotional intelligence and branches vibrant with diverse feelings, Bhav-Chitran aims to foster a deeper connection between technology and the human experience.

logo
Features
24/7 Availability : Name is always here for you, day or night, ready to provide support whenever you need it.
Mindfulness Exercises :Suggests a variety of mindfulness and relaxation exercises to help the user stay grounded and centered.
Real-Time Emotion Detection : Uses facial expression recognition to identify emotions through camera feeds in educational institutions and workplaces.
Negative Emotion Flagging : Detects prolonged negative emotions (e.g., sadness, stress) for timely intervention.
Integration with Support Systems : Automatically connects individuals with persistent negative emotions to a psychological team.
Privacy-First Design : Ensures data is processed securely and anonymized where necessary.
Scalable Deployment : Can be implemented in various environment like public. Join the Name community today and take a proactive step towards a healthier, happier you. Because everyone deserves to feel understood, supported, and valued.
Problem Statement
Turning CCTV into silent guardians of mental health. Mental health crises don’t wait. Yet, in schools, offices, and public spaces, sadness often slips through unnoticed — even under the constant gaze of surveillance cameras. Today's systems see motion, not emotion. The challenge? Build tech that detects emotional distress in real time, connects people to support systems without breaching their privacy, and turns passive monitoring into proactive care.

Approach
We aim to enhance traditional CCTV systems with the capability to detect emotional distress, particularly sadness, and trigger timely, appropriate responses — all while respecting privacy and context. 1)Emotion Detection Use real-time video feeds from existing CCTV cameras to detect facial expressions using computer vision and deep learning models trained on emotion recognition datasets (e.g., FER2013, AffectNet).

2)Continuous Monitoring Track individuals over time using facial tracking or person re-identification to assess emotional consistency. A threshold duration (e.g., 5–10 minutes of persistent sadness) is used to confirm distress.

3)Contextual Categorization Distinguish between controlled environments (schools, offices) and public spaces to tailor the response method accordingly.

Privacy-First Design Ensure that no sensitive personal data (e.g., phone numbers, ID numbers) is collected or stored. All decisions are made using anonymous or location-based identifiers.

Solution
Our solution enables emotion-aware interventions in two distinct environments:

In Schools and Offices: Each individual is linked to a seat number, ID badge, or access zone within the environment and a database storing the faces of all students or employee for easy contact.

If sadness is detected continuously for 5–10 minutes, a private alert is sent to the school counselor or HR/management.

The response team can reach out to the person and offer mental health support without delay.

No personally identifiable information is required beyond internal system IDs.

All interactions remain anonymous and non-intrusive, prioritizing emotional well-being while preserving dignity and privacy.

Workflow Diagram
logo
Screenshots
2025-05-29 (3)

Conclusion
Bhav-Chitran represents a meaningful fusion of technology and cultural insight, bridging the gap between artificial intelligence and human emotions. By leveraging deep learning to detect and interpret emotions, this project not only advances the field of emotional intelligence but also honors the Indian concept of "bhav" through its innovative approach. As we continue to refine and expand Bhav-Chitran, we envision a future where technology can empathetically understand and respond to human feelings, creating impactful solutions for mental health support.

🚀Run Instructions:
1) Clone the repository
Start by cloning the repository to your local machine and navigate into the project directory:
git clone https://github.com/your-username/Emotion-Detection.git

Navigate into the project directory
cd Emotion Detection

2) Serve the Project Locally
Option A: Using Python (Recommended)
If you have Python installed:

For Python 3.x users
python -m http.server 8000 
Then, open your browser and go to:
http://localhost:8000

Option B: Using VS Code Live Server
-->Open the folder in Visual Studio Code.

-->Install the Live Server extension (if not already installed).

-->Right-click on index.html and click "Open with Live Server".

3. Allow Webcam Access
-->When prompted by the browser, allow access to the webcam.

-->The system will start detecting your emotions in real-time.

4.📁 Model Files
-->This project uses pre-trained models from face-api.js. Ensure the following:

-->The models/ directory exists in the root.

-->It contains files like face_expression_model-weights_manifest.json, model.json, etc.

If you don’t have the models:
-->Download them from the face-api.js model repository.

-->Place them inside the models/ folder.

✅ Requirements
-->A modern web browser (Chrome, Firefox, Edge)

-->Internet connection to load model files (if not hosted locally)

-->Webcam
