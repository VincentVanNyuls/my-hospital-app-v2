// src/app/utils/firebase.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBpBUFCT_8Zj9mFWuR5uF1NL4XqKbpBpWc",
  authDomain: "hospital-ll.firebaseapp.com",
  projectId: "hospital-ll",
  storageBucket: "hospital-ll.firebasestorage.app",
  messagingSenderId: "1069611418519",
  appId: "1:1069611418519:web:1af928e34cb27ae3943ad2",
  measurementId: "G-6C19N3Y5W3"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar servicios
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;