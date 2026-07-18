import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// TODO: Replace the following with your app's Firebase project configuration
// Go to Firebase Console -> Project Settings -> General -> Web App to get these values
const firebaseConfig = {
  apiKey: "AIzaSyCgI8y4qNzan6tI4c3NTQsLf1Vc_PoTrCg",
  authDomain: "gnc-news-627c6.firebaseapp.com",
  projectId: "gnc-news-627c6",
  storageBucket: "gnc-news-627c6.firebasestorage.app",
  messagingSenderId: "678573901273",
  appId: "1:678573901273:web:02bc4767eac738d0a885c8",
  measurementId: "G-6M4X7RCWDK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and Auth
const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Export for other modules to use
export { db, auth, googleProvider };
