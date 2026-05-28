import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAyxWVLFbdQKgFNVYKKUbr2-_Zp8ee6lJg",
  authDomain: "nubes-s.firebaseapp.com",
  projectId: "nubes-s",
  storageBucket: "nubes-s.firebasestorage.app",
  messagingSenderId: "18833531620",
  appId: "1:18833531620:web:5abc24d9efde789f5e02f1"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

export const loginAnonimo = () => signInAnonymously(auth);
