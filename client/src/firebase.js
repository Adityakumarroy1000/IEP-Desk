import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

const fallbackFirebaseConfig = {
  apiKey: "AIzaSyCPRa81JI0NSSnaBoikG45DH7-G_9tyqYE",
  authDomain: "iep-desk-2026.firebaseapp.com",
  projectId: "iep-desk-2026",
  storageBucket: "iep-desk-2026.firebasestorage.app",
  messagingSenderId: "843235638290",
  appId: "1:843235638290:web:d8e123c0b7f566ccd4eccb",
  measurementId: "G-7F8M9HCDHV"
};

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || fallbackFirebaseConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || fallbackFirebaseConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || fallbackFirebaseConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || fallbackFirebaseConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || fallbackFirebaseConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || fallbackFirebaseConfig.appId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || fallbackFirebaseConfig.measurementId
};

const requiredFirebaseEnv = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID"
];

const fallbackEnvMap = {
  VITE_FIREBASE_API_KEY: fallbackFirebaseConfig.apiKey,
  VITE_FIREBASE_AUTH_DOMAIN: fallbackFirebaseConfig.authDomain,
  VITE_FIREBASE_PROJECT_ID: fallbackFirebaseConfig.projectId,
  VITE_FIREBASE_STORAGE_BUCKET: fallbackFirebaseConfig.storageBucket,
  VITE_FIREBASE_MESSAGING_SENDER_ID: fallbackFirebaseConfig.messagingSenderId,
  VITE_FIREBASE_APP_ID: fallbackFirebaseConfig.appId
};

const missingFirebaseEnv = requiredFirebaseEnv.filter((key) => !import.meta.env[key] && !fallbackEnvMap[key]);

if (missingFirebaseEnv.length) {
  throw new Error(`Missing Firebase environment variables: ${missingFirebaseEnv.join(", ")}`);
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Analytics only works in supported browser environments (https / localhost).
isSupported()
  .then((ok) => ok && firebaseConfig.measurementId && getAnalytics(app))
  .catch(() => null);
