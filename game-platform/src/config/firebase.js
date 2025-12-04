import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

// Firebase configuration
// For production, set these values as environment variables
// REACT_APP_FIREBASE_API_KEY, REACT_APP_FIREBASE_AUTH_DOMAIN, etc.
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyCeNWoXGlC_cjXXATuauAmjBom-sVYjMEQ",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "intjchat.firebaseapp.com",
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL || "https://intjchat-default-rtdb.firebaseio.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "intjchat",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "intjchat.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "993280462756",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:993280462756:web:1348268d9e3cd5b843fb31",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-T90XD8M1G9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database
export const database = getDatabase(app);

// Initialize Authentication
export const auth = getAuth(app);

// Initialize Analytics (only in browser environment)
let analytics = null;
if (typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app);
  } catch (e) {
    // Analytics not available in some environments
  }
}
export { analytics };

export default app;
