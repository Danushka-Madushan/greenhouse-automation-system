// src/firebase.js
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
// For security, use environment variables (.env) for these values
const firebaseConfig = {
  apiKey: "AIzaSyCf4CMVLvep6G44Y0YZH-lmqdibgNsiowg",
  authDomain: "nibm-greenos.firebaseapp.com",
  projectId: "nibm-greenos",
  storageBucket: "nibm-greenos.firebasestorage.app",
  messagingSenderId: "174468721169",
  appId: "1:174468721169:web:20c6cea595512022e29fb0",
  databaseURL: "https://nibm-greenos-default-rtdb.asia-southeast1.firebasedatabase.app"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database and export it
export const db = getDatabase(app);
