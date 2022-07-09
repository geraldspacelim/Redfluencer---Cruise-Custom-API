// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDD1gi4uD4fT3wnGzoAjiypIQ6xSHNTfmU",
  authDomain: "redappdevenv.firebaseapp.com",
  projectId: "redappdevenv",
  storageBucket: "redappdevenv.appspot.com",
  messagingSenderId: "435078060116",
  appId: "1:435078060116:web:ff625bbae11084771f75c1",
  measurementId: "G-TKXPF4HTZN",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export default app;
