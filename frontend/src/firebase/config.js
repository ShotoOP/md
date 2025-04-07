import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAiWKys4d0O3L8wm5GJMfYof8q12zqR3T8",
  authDomain: "mindstocks-25e97.firebaseapp.com",
  projectId: "mindstocks-25e97",
  storageBucket: "mindstocks-25e97.firebasestorage.app",
  messagingSenderId: "614355361782",
  appId: "1:614355361782:web:444d04f245832ed4d671d7",
  measurementId: "G-S1MGZ40LS3",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const analytics = getAnalytics(app);

export { auth };
export default app;
