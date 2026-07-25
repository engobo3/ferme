/**
 * Dev-only Firebase emulator wiring. Enabled when EXPO_PUBLIC_USE_EMULATOR=true
 * (see .env). Must be imported before any other Firebase usage — it is the
 * first import of app/_layout.tsx.
 *
 * 10.0.2.2 is the host machine's loopback as seen from the Android emulator.
 * A physical device needs the PC's LAN IP instead: set EXPO_PUBLIC_EMULATOR_HOST.
 */
import { Platform } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import functions from '@react-native-firebase/functions';

const USE_EMULATOR = __DEV__ && process.env.EXPO_PUBLIC_USE_EMULATOR === 'true';

if (USE_EMULATOR) {
    const host =
        process.env.EXPO_PUBLIC_EMULATOR_HOST ??
        (Platform.OS === 'android' ? '10.0.2.2' : 'localhost');

    auth().useEmulator(`http://${host}:9099`);
    firestore().useEmulator(host, 8080);
    functions().useEmulator(host, 5001);

    console.log(`[dev] Émulateurs Firebase actifs sur ${host} (auth:9099, firestore:8080, functions:5001)`);
}

export const isEmulatorMode = USE_EMULATOR;
