
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, onIdTokenChanged } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage'; // Import getStorage
import { useRouter } from 'next/navigation';

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  let firebaseApp;
  if (!getApps().length) {
    try {
      firebaseApp = initializeApp(firebaseConfig);
    } catch (e) {
      if (process.env.NODE_ENV === "production") {
        console.warn('Automatic initialization failed. Falling back to firebase config object.', e);
      }
      firebaseApp = initializeApp(firebaseConfig);
    }
  } else {
    firebaseApp = getApp();
  }

  const auth = getAuth(firebaseApp);
  const firestore = getFirestore(firebaseApp);
  const storage = getStorage(firebaseApp); // Initialize storage

  // Set up a listener to store the ID token in a cookie
  onIdTokenChanged(auth, async (user) => {
    const cookieName = 'firebaseIdToken';
    if (user) {
      const token = await user.getIdToken();
      // Set cookie for server-side verification in middleware
      // The secure flag should be set in production
      const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
      document.cookie = `${cookieName}=${token}; path=/; max-age=${60 * 55}${secure}`; // 55 min expiry
    } else {
      // Clear cookie on sign out
      document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    }
  });


  // The emulator connection logic is now removed.
  // The app will connect to live cloud services.

  return { firebaseApp, auth, firestore, storage }; // Return storage
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp),
    storage: getStorage(firebaseApp) // Return storage
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './errors';
export * from './error-emitter';
