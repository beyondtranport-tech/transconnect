
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, onIdTokenChanged, getIdToken } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions'; // Import getFunctions

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
  const storage = getStorage(firebaseApp); 
  const functions = getFunctions(firebaseApp); // Initialize functions

  // Set up a listener to store the ID token in a cookie
  onIdTokenChanged(auth, async (user) => {
    const cookieName = 'firebaseIdToken';
    if (user) {
      const token = await user.getIdToken();
      const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
      document.cookie = `${cookieName}=${token}; path=/; max-age=${60 * 55}${secure}`;
    } else {
      document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    }
  });

  return { firebaseApp, auth, firestore, storage, functions }; // Return functions
}


export async function getClientSideAuthToken(): Promise<string | null> {
    const auth = getAuth();
    if (auth.currentUser) {
        return await getIdToken(auth.currentUser);
    }
    return null;
}


export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './errors';
export * from './error-emitter';

