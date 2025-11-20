import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyC4Ur1MsWGyBMQzS4QQp2ZEWhoUUGhBRI",
    authDomain: "seedly-app.firebaseapp.com",
    projectId: "seedly-app",
    storageBucket: "seedly-app.appspot.com",
    messagingSenderId: "948687707686",
    appId: "1:948687707686:web:ed51b53c65763184b1d0e7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
console.log("🔥 FIREBASE CONFIG LOADED SUCCESSFULLY");

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;