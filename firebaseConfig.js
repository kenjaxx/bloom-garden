import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const firebaseConfig = {
  apiKey: "AIzaSyCCw7QdPHfV-BXESfOTAsKjJZ43b-Bc8MU",
  authDomain: "bloom-garden-dcdb4.firebaseapp.com",
  projectId: "bloom-garden-dcdb4",
  storageBucket: "bloom-garden-dcdb4.firebasestorage.app",
  messagingSenderId: "70750351934",
  appId: "1:70750351934:web:ba6420e308a180f288976f"
};

const app = initializeApp(firebaseConfig);

export const auth =
  Platform.OS === "web"
    ? require("firebase/auth").getAuth(app)
    : initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });

export const db = getFirestore(app);