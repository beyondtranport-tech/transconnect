
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
    firebaseApp = initializeApp(firebaseConfig);
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
            return await getIdToken(auth.currentUser, false);
        } catch (error) {
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
