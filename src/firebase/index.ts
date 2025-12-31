'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, onIdTokenChanged, getIdToken } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

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

  return { firebaseApp, auth, firestore, storage };
}


export async function getClientSideAuthToken(): Promise<string | null> {
    const auth = getAuth();
    if (auth.currentUser) {
        try {
            // The `true` forces a token refresh if the current one is expiring soon.
            return await getIdToken(auth.currentUser, true);
        } catch (error) {
            console.error("Error getting auth token:", error);
            return null;
        }
    }
    return null;
}


export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './firestore/use-public-collection';
export * from './errors';
export * from './error-emitter';