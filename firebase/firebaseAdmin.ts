import {initializeApp} from "firebase/app";
import {getAuth, GoogleAuthProvider} from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBBQ-YjeCS2DBb4DkXqiDyG34JydxCSY_g",
  authDomain: "flowershop-8c90b.firebaseapp.com",
  projectId: "flowershop-8c90b",
  storageBucket: "flowershop-8c90b.firebasestorage.app",
  messagingSenderId: "184442876708",
  appId: "1:184442876708:web:e22aa5ee1cc6feae4b79b1"
};


//intialise firebase
const app = initializeApp(firebaseConfig);
//initialize firebase authentication
const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();


export {auth, googleProvider};