// web/lib/firebase.ts
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAYvafv27-Laxe_-eJSKdWCjqTeymkJ-vg",
    authDomain: "ferme-9b64f.firebaseapp.com",
    projectId: "ferme-9b64f",
    storageBucket: "ferme-9b64f.firebasestorage.app",
    messagingSenderId: "752628531985",
    appId: "1:752628531985:web:9fd44b7aa5498ee1f7c2b0"
};

import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { connectFirestoreEmulator } from "firebase/firestore";
import { connectAuthEmulator } from "firebase/auth";

// Initialize Firebase (Singleton pattern)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app);

// Connect to emulators when NEXT_PUBLIC_USE_EMULATOR=true
if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_USE_EMULATOR === "true") {
    try {
        connectFirestoreEmulator(db, "localhost", 8080);
        connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
        connectFunctionsEmulator(functions, "localhost", 5001);
    } catch {
        // Already connected (hot reload)
    }
}

export { app, auth, db, functions };
