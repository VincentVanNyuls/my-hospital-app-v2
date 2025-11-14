// my-hospital-app/src/utils/firebase.ts

import { initializeApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";

// ** TU OBJETO DE CONFIGURACIÓN DE FIREBASE OBTENIDO DEL STEP 3 **
const firebaseConfig = {
  apiKey: "AIzaSyBpBUFCT_8Zj9mFWuR5uF1NL4XqKbpBpWc",

  authDomain: "hospital-ll.firebaseapp.com",

  projectId: "hospital-ll",

  storageBucket: "hospital-ll.firebasestorage.app",

  messagingSenderId: "1069611418519",

  appId: "1:1069611418519:web:1af928e34cb27ae3943ad2",

  measurementId: "G-6C19N3Y5W3"

};

// Inicializa Firebase en tu aplicación
const app: FirebaseApp = initializeApp(firebaseConfig);

// Inicializa los servicios que vas a usar (Firestore y Authentication)
export const db: Firestore = getFirestore(app);   // <--- ¡Esta línea debe estar!
export const auth: Auth = getAuth(app);           // <--- ¡Y esta también!

export default app;
           // <-- Esta línea inicializa Authentication
