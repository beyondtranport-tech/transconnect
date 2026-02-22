'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const CLIENT_APP_NAME = 'firebase-client-app-transconnect';

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  let firebaseApp: FirebaseApp;
  
  const existingApp = getApps().find(app => app.name === CLIENT_APP_NAME);

  if (existingApp) {
    firebaseApp = existingApp;
  } else {
    firebaseApp = initializeApp(firebaseConfig, CLIENT_APP_NAME);
  }

  const auth = getAuth(firebaseApp);
  const firestore = getFirestore(firebaseApp);
  const storage = getStorage(firebaseApp); 

  return { firebaseApp, auth, firestore, storage };
}
