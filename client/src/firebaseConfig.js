import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set, push } from "firebase/database";

// const firebaseConfig = {
//     apiKey: "AIzaSyCovZmCwhjXIDDMFkcEaOQOO1ebTWxNero",
//     authDomain: "simulasi-data-sawit.firebaseapp.com",
//     databaseURL: "https://simulasi-data-sawit-default-rtdb.asia-southeast1.firebasedatabase.app",
//     projectId: "simulasi-data-sawit",
//     storageBucket: "simulasi-data-sawit.firebasestorage.app",
//     messagingSenderId: "270306455263",
//     appId: "1:270306455263:web:1d3c9756f1c5b673e6c36a"
//   };



const firebaseConfig = {
  apiKey: "AIzaSyDQ4g9KakxXzP5g6kHEO0OnrLcHI0W7j5g",
  authDomain: "loadcell-9d127.firebaseapp.com",
  projectId: "loadcell-9d127",
  databaseURL: "https://loadcell-9d127-default-rtdb.firebaseio.com",
  storageBucket: "loadcell-9d127.firebasestorage.app",
  messagingSenderId: "910220429726",
  appId: "1:910220429726:web:35ec3f23a72c56660eee8f",
  measurementId: "G-8F9RTYT198"
};


const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database }; 




// import { initializeApp } from "firebase/app";
// import { getDatabase, ref, onValue, set, push } from "firebase/database";



// const firebaseConfig = {
//   apiKey: "AIzaSyDQ4g9KakxXzP5g6kHEO0OnrLcHI0W7j5g",
//   authDomain: "loadcell-9d127.firebaseapp.com",
//   projectId: "loadcell-9d127",
//   databaseURL: "https://loadcell-9d127-default-rtdb.firebaseio.com",
//   storageBucket: "loadcell-9d127.firebasestorage.app",
//   messagingSenderId: "910220429726",
//   appId: "1:910220429726:web:35ec3f23a72c56660eee8f",
//   measurementId: "G-8F9RTYT198"
// };
// const app = initializeApp(firebaseConfig);
// const database = getDatabase(app);

// export { database }; 
