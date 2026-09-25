import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Firebase web config is public by design (security is enforced by Firebase Auth
// and the backend). VITE_FIREBASE_* env vars override these defaults per environment.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCdDGLxrKfgdBF3ym3xiCN4xgxKfdHEq5Y",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "lexium-30dbf.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "lexium-30dbf",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "lexium-30dbf.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "39916560051",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:39916560051:web:4ce16c8c9bcef0277a1ac6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);

export default app;
