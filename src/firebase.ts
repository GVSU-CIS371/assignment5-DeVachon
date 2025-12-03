import { getFirestore } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";


const firebaseConfig = {
  apiKey: "AIzaSyBjvJj5BT-f5yBFI1Qcx0izaONPeX95loI",
  authDomain: "assignment4-devonvachon.firebaseapp.com",
  projectId: "assignment4-devonvachon",
  storageBucket: "assignment4-devonvachon.firebasestorage.app",
  messagingSenderId: "399392790060",
  appId: "1:399392790060:web:b26a4077e3a74c5f212389",
  measurementId: "G-RHWNVHN1VQ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { db, auth, googleProvider };
export default db;
