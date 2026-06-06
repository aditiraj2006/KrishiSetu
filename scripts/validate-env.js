import "dotenv/config"

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const firebaseConfigKeys = [
    "apiKey",
    "authDomain",
    "projectId",
    "storageBucket",
    "messagingSenderId",
    "appId",
    "measurementId",
];

firebaseConfigKeys.forEach((key) => {
    const value = firebaseConfig[key];
    if (value == "" || value == undefined) {
        console.log(`Environment variable ${key} is not set.`);
        process.exit(1);
    }
});

const googleGeminiApiKey = process.env.GOOGLE_GEMINI_API_KEY;
if (googleGeminiApiKey == "" || googleGeminiApiKey == undefined) {
    console.log(`Environment variable GOOGLE_GEMINI_API_KEY is not set.`);
    process.exit(1);
}

const mongodbUri = process.env.MONGODB_URI;
if (mongodbUri == "" || mongodbUri == undefined) {
    console.log(`Environment variable MONGODB_URI is not set.`);
    process.exit(1);
}
