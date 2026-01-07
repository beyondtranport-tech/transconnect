
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, getIdToken } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { useMemo, useContext } from 'react';
import { FirebaseContext, type FirebaseServicesAndUser, type UserHookResult } from './provider';
import type { DependencyList } from 'react';

// Centralized Firebase initialization
export function initializeFirebase() {
  if (getApps().length) {
    return getApp();
  }
  return initializeApp(firebaseConfig);
}

export async function getClientSideAuthToken(): Promise<string | null> {
    const auth = getAuth(initializeFirebase());
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

// --- HOOKS ---

export const useFirebase = (): FirebaseServicesAndUser => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }
  if (!context.areServicesAvailable || !context.firebaseApp || !context.firestore || !context.auth || !context.storage) {
    throw new Error('Firebase core services not available. Check FirebaseProvider props.');
  }
  return {
    firebaseApp: context.firebaseApp,
    firestore: context.firestore,
    auth: context.auth,
    storage: context.storage,
    user: context.user,
    isUserLoading: context.isUserLoading,
    userError: context.userError,
  };
};

export const useAuth = () => useFirebase().auth;
export const useFirestore = () => useFirebase().firestore;
export const useFirebaseApp = () => useFirebase().firebaseApp;
export const useStorage = () => useFirebase().storage;
export const useUser = (): UserHookResult => {
    const { user, isUserLoading, userError } = useFirebase();
    return { user, isUserLoading, userError };
};

type MemoFirebase<T> = T & { __memo?: boolean };

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T | MemoFirebase<T> {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoized = useMemo(factory, deps);
  if (typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;
  return memoized;
}

// --- Re-export necessary components ---
export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './errors';
export * from './error-emitter';
    