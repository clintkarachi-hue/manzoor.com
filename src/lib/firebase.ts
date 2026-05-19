import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDhZC1MlVP4JJDn3BvGcxvnBB9fJ4tnZB8",
  authDomain: "manzoor-8c6e2.firebaseapp.com",
  projectId: "manzoor-8c6e2",
  storageBucket: "manzoor-8c6e2.firebasestorage.app",
  messagingSenderId: "887558077785",
  appId: "1:887558077785:web:059286286dc77de4a8a048"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
