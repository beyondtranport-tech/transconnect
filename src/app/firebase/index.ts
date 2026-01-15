
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, getIdToken } from 'firebase/auth';
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
            // The `false` means it will return the cached token unless it's expired.
            // This is safer for avoiding quota issues.
            return await getIdToken(auth.currentUser, false);
        } catch (error) {
            // If getting the token fails, try to force a refresh as a fallback.
            try {
                return await getIdToken(auth.currentUser, true);
            } catch (refreshError) {
                console.error("Error getting auth token after forced refresh:", refreshError);
                return null;
            }
        }
    }
    return null;
}


export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './errors';
export * from './error-emitter';
    
