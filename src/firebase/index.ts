
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, getIdToken } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  const auth = getAuth(app);
  const firestore = getFirestore(app);
  const storage = getStorage(app); 

  return { firebaseApp: app, auth, firestore, storage };
}


export async function getClientSideAuthToken(): Promise<string | null> {
    const auth = getAuth(getApp()); // Use getApp() to ensure the initialized instance is used
    if (auth.currentUser) {
        try {
            // The `false` means it will return the cached token unless it's expired.
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
    
