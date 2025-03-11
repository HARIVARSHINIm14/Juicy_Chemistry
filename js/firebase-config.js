// Import Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js"
import { 
    collection, 
    getDocs, getDoc,
    addDoc, 
    deleteDoc,  
    doc,
    query,
    where,
    orderBy,
    setDoc,
    updateDoc,
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCU1a-gabseWrLx6XIVh0oOL8bytd7b-ig",
  authDomain: "juicychemistry.firebaseapp.com",
  projectId: "juicychemistry",
  storageBucket: "juicychemistry.firebasestorage.app",
  messagingSenderId: "1088380616604",
  appId: "1:1088380616604:web:203a8e47e0a611c246d259",
  measurementId: "G-FM2Q1PEL95"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Export Firebase Modules

export { auth, db, storage, collection, getDocs, addDoc, orderBy,setDoc, deleteDoc,updateDoc, doc,query,where, serverTimestamp,getDoc };



