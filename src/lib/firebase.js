// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC0g9Iy0WcegDFxbA2poP7nIY_ed21lUUI",
  authDomain: "kora-f7ae7.firebaseapp.com",
  projectId: "kora-f7ae7",
  storageBucket: "kora-f7ae7.firebasestorage.app",
  messagingSenderId: "783754619399",
  appId: "1:783754619399:web:7a2816d1f52d983c8b18a2",
  measurementId: "G-G14D90BQEH"
};

// Initialize Firebase only if it hasn't been initialized to prevent SSR errors
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

// Analytics runs only on client
let analytics;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export { app, db, analytics };
