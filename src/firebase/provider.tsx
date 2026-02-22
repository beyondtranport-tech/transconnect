'use client';

import React, { createContext, useContext, ReactNode, useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc } from 'firebase/firestore';
import { Auth, User, onIdTokenChanged, getIdToken } from 'firebase/auth';
import { FirebaseStorage } from 'firebase/storage';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { useDoc } from './firestore/use-doc';
import { useMemoFirebase } from '@/hooks/use-memo-firebase';

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  storage: FirebaseStorage;
}

interface EnrichedUser extends User {
    companyId?: string;
    passwordChangeRequired?: boolean;
}

interface UserAuthState {
  user: EnrichedUser | null;
  isUserLoading: boolean;
  userError: Error | null;
  forceRefresh: () => void;
}

export interface FirebaseContextState {
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  storage: FirebaseStorage | null;
  user: EnrichedUser | null;
  isUserLoading: boolean;
  userError: Error | null;
  forceRefreshUser: () => void;
}

const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

// A robust async function to handle setting the session cookie.
const setSessionCookie = async (idToken: string | null) => {
    try {
        await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
        });
    } catch (error) {
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
            return;
        }
        console.error("FirebaseProvider: Error calling session API:", error);
    }
};

function useEnrichedUser(baseUser: User | null, firestore: Firestore | null) {
    const isAdmin = baseUser?.email === 'mkoton100@gmail.com' || baseUser?.email === 'beyondtransport@gmail.com';
    const uid = baseUser?.uid;

    const userDocRef = useMemoFirebase(() => {
        if (!firestore || !uid || isAdmin) {
            return null;
        }
        return doc(firestore, 'users', uid);
    }, [firestore, uid, isAdmin]);

    const { data: userData, isLoading: isUserDataLoading, forceRefresh } = useDoc<{ companyId?: string; passwordChangeRequired?: boolean }>(userDocRef);
    
    const companyId = userData?.companyId;
    const passwordChangeRequired = userData?.passwordChangeRequired;

    const enrichedUser = useMemo(() => {
        if (!baseUser) return null;
        // Do not enrich admin users with Firestore data
        if (isAdmin) return baseUser as EnrichedUser;

        return {
            ...baseUser,
            companyId: companyId,
            passwordChangeRequired: passwordChangeRequired,
        } as EnrichedUser;

    }, [baseUser, companyId, passwordChangeRequired, isAdmin]);

    const isEnriching = !isAdmin && !!baseUser && isUserDataLoading;
    
    return useMemo(() => ({
        enrichedUser,
        isEnriching,
        forceRefresh,
    }), [enrichedUser, isEnriching, forceRefresh]);
}


export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
  storage,
}) => {
  const [baseUser, setBaseUser] = useState<User | null>(auth.currentUser);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<Error | null>(null);
  const userCheckPerformed = useRef(false);

  const { enrichedUser, isEnriching, forceRefresh } = useEnrichedUser(baseUser, firestore);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(
      auth,
      async (firebaseUser) => {
        const idToken = firebaseUser ? await firebaseUser.getIdToken() : null;
        await setSessionCookie(idToken);
        
        if (firebaseUser && idToken && !userCheckPerformed.current) {
          userCheckPerformed.current = true;
          try {
            const referrerId = new URLSearchParams(window.location.search).get('ref');
            await fetch('/api/checkAndCreateUser', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${idToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ referrerId }), 
            });
          } catch (error) {
            console.error("FirebaseProvider: Failed to call checkAndCreateUser:", error);
          }
        }
        
        if (!firebaseUser) {
          userCheckPerformed.current = false;
        }
        
        setBaseUser(firebaseUser);
        setIsAuthLoading(false);
        setAuthError(null);
      },
      (error) => {
        console.error("FirebaseProvider: onIdTokenChanged error:", error);
        setSessionCookie(null);
        setBaseUser(null);
        userCheckPerformed.current = false;
        setIsAuthLoading(false);
        setAuthError(error);
      }
    );
    return () => unsubscribe();
  }, [auth]);

  const contextValue = useMemo((): FirebaseContextState => ({
    firebaseApp,
    firestore,
    auth,
    storage,
    user: enrichedUser,
    isUserLoading: isAuthLoading || isEnriching,
    userError: authError,
    forceRefreshUser: forceRefresh,
  }), [firebaseApp, firestore, auth, storage, enrichedUser, isAuthLoading, isEnriching, authError, forceRefresh]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

// --- HOOKS ---
const useFirebase = (): FirebaseContextState => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }
  return context;
};

export const useAuth = () => useFirebase().auth;
export const useFirestore = () => useFirebase().firestore;
export const useFirebaseApp = () => useFirebase().firebaseApp;
export const useStorage = () => useFirebase().storage;
export const useUser = (): UserAuthState => {
    const { user, isUserLoading, userError, forceRefreshUser } = useFirebase();
    return { user, isUserLoading, userError, forceRefresh: forceRefreshUser };
};
