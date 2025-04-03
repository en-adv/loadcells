import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set, push } from "firebase/database";


const firebaseConfig = {
  apiKey: "AIzaSyDCRyAd4Xevvlaq1ybUI7Dof8tjHbp-hDQ",
  authDomain: "sawit-makmur-iot.firebaseapp.com",
  databaseURL: "https://sawit-makmur-iot-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "sawit-makmur-iot",
  storageBucket: "sawit-makmur-iot.firebasestorage.app",
  messagingSenderId: "255009117374",
  appId: "1:255009117374:web:6c5442c0f569f90c5a3aef"
};
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database }; 

