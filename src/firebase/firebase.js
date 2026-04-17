// src/firebase/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCBRuGJcs_dJPseACxDAr3zN8o2VNX3f8A",
  authDomain: "drrm-h-web-app.firebaseapp.com",
  projectId: "drrm-h-web-app",
  storageBucket: "drrm-h-web-app.appspot.com",
  messagingSenderId: "88158608812",
  appId: "1:88158608812:web:df668dd1cff2d72fb22e09",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);