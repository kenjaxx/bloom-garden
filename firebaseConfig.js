import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCCw7QdPHfV-BXESfOTAsKjJZ43b-Bc8MU",
  authDomain: "bloom-garden-dcdb4.firebaseapp.com",
  projectId: "bloom-garden-dcdb4",
  storageBucket: "bloom-garden-dcdb4.firebasestorage.app",
  messagingSenderId: "70750351934",
  appId: "1:70750351934:web:ba6420e308a180f288976f"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);