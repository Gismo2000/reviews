import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth"; // Импортируем Firebase Authentication

const firebaseConfig = {
  apiKey: "AIzaSyCoRO1RuSCNLv4eDOLpD2D4_qYyomiv0aw",
  authDomain: "reviews-app-d9394.firebaseapp.com",
  databaseURL: "https://reviews-app-d9394-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "reviews-app-d9394",
  storageBucket: "reviews-app-d9394.appspot.com",
  messagingSenderId: "548536309960",
  appId: "1:548536309960:web:62b265c87946ea2c59adfd",
  measurementId: "G-8D825WPZKG"
};

// Инициализация Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app); // Инициализация аутентификации

export { database, auth };
