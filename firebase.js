// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA2uO7m89hr-takkGCEqwwkLkR_ysOYfJ4",
  authDomain: "pantrytracker-c11f1.firebaseapp.com",
  projectId: "pantrytracker-c11f1",
  storageBucket: "pantrytracker-c11f1.appspot.com",
  messagingSenderId: "286477887005",
  appId: "1:286477887005:web:e81256cdf36fc7a390c8f4",
  measurementId: "G-0D3L4FX0XF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

export { firestore };

