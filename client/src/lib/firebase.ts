import { getAnalytics, isSupported } from "firebase/analytics";
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { GoogleAuthProvider, getAuth, signInWithPopup, type Auth } from "firebase/auth";

// Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "placeholder-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "placeholder.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "placeholder-project",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "placeholder.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "000000000000",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:000000000000:web:0000000000000000",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase — guard against duplicate app init during HMR
let app: FirebaseApp;
try {
  app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
} catch (err) {
  console.warn("[Firebase] initializeApp failed:", err);
  app = getApps()[0]; // fallback to any already-initialized app
}

// Analytics — only in production with valid config, safe to skip
let analytics: ReturnType<typeof getAnalytics> | null = null;
isSupported()
  .then((supported) => {
    if (supported && import.meta.env.VITE_FIREBASE_APP_ID) {
      analytics = getAnalytics(app);
    }
  })
  .catch(() => {
    // Analytics not supported — safe to ignore
  });

// Auth — always initialize, even with placeholders (login will simply fail gracefully)
let auth: Auth;
try {
  auth = getAuth(app);
} catch (err) {
  console.warn("[Firebase] getAuth failed:", err);
  auth = {} as Auth; // type-safe stub so imports don't crash
}

const googleProvider = new GoogleAuthProvider();

export { analytics, app, auth, googleProvider, signInWithPopup };
