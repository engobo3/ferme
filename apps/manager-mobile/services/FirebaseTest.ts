import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

/**
 * Validates the Native Firebase connection.
 * Since we use Native SDKs via Prebuild, we don't need JS config keys.
 */
export async function validateFirebaseConnection() {
    try {
        console.log("Checking Firebase Auth...");
        const user = auth().currentUser;
        console.log("Current User:", user ? user.uid : "No user logged in");

        console.log("Checking Firestore...");
        // Just try to read metadata or a dummy doc to see if it throws
        await firestore().collection('test').doc('ping').get();
        console.log("Firestore connection active.");

        return true;
    } catch (e) {
        console.error("Firebase Verification Failed:", e);
        return false;
    }
}
