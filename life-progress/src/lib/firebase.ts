import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getMessaging, type Messaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

let messaging: Messaging | null = null;

if (typeof window !== 'undefined') {
  messaging = getMessaging(app);
  
  // Enable Firestore offline persistence
  enableIndexedDbPersistence(db).catch((error: { code: string }) => {
    if (error.code === 'failed-precondition') {
      console.warn('Multiple tabs open, persistence can only be enabled in one tab at a a time.');
    } else if (error.code === 'unimplemented') {
      console.warn('The current browser does not support persistence.');
    }
  });
}

export { app, auth, db, messaging }; 