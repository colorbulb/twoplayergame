import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCeNWoXGlC_cjXXATuauAmjBom-sVYjMEQ",
  authDomain: "intjchat.firebaseapp.com",
  databaseURL: "https://intjchat-default-rtdb.firebaseio.com",
  projectId: "intjchat",
  storageBucket: "intjchat.firebasestorage.app",
  messagingSenderId: "993280462756",
  appId: "1:993280462756:web:1348268d9e3cd5b843fb31",
  measurementId: "G-T90XD8M1G9"
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
