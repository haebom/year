'use client';

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, initializeFirestore, CACHE_SIZE_UNLIMITED, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);

// Auth 초기화
export const auth = getAuth(app);

// Firestore 초기화 최적화
export const db = initializeFirestore(app, {
  cacheSizeBytes: CACHE_SIZE_UNLIMITED,
  experimentalForceLongPolling: true, // WebSocket 연결 문제 해결
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

export async function fetchUserData(userId: string) {
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: userId,
        email: data.email,
        name: data.name,
        birthDate: data.birthDate?.toDate(),
        photoURL: data.photoURL,
        friends: data.friends || [],
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        blocks: data.blocks || {},
        gameStats: data.gameStats || {
          level: 1,
          experience: 0,
          points: 0,
          achievements: [],
        },
        lastActive: data.lastActive?.toDate(),
        streak: data.streak || 0,
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
} 