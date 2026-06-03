import { getAnalytics } from "firebase/analytics";
import { initializeApp } from "firebase/app";
import { GoogleAuthProvider, getAuth, signInWithPopup } from "firebase/auth";

// Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const requiredFirebaseValues = [
  firebaseConfig.apiKey,
  firebaseConfig.authDomain,
  firebaseConfig.projectId,
  firebaseConfig.appId,
].every(
  (value) => typeof value === "string" && value.trim().length > 0 && !value.startsWith("your_"),
);

export const isFirebaseConfigured = requiredFirebaseValues;

// Initialize Firebase
const app = isFirebaseConfigured ? initializeApp(firebaseConfig) : null;
const analytics = app ? getAnalytics(app) : null;
const auth = app ? getAuth(app) : null;
const googleProvider = new GoogleAuthProvider();

// Export the required Firebase objects
export { analytics, app, auth, googleProvider, signInWithPopup };
