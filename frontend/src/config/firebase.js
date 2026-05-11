import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Replace this entire object with the config you copied from the Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyCdDGLxrKfgdBF3ym3xiCN4xgxKfdHEq5Y",
  authDomain: "lexium-30dbf.firebaseapp.com",
  projectId: "lexium-30dbf",
  storageBucket: "lexium-30dbf.firebasestorage.app",
  messagingSenderId: "39916560051",
  appId: "1:39916560051:web:4ce16c8c9bcef0277a1ac6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
