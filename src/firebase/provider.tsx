
'use client';

import React, { createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc } from 'firebase/firestore';
import { Auth, User, onIdTokenChanged, getIdToken } from 'firebase/auth';
import { FirebaseStorage } from 'firebase/storage';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { useDoc } from './firestore/use-doc';
import { useMemoFirebase } from '@/hooks/use-config';

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  storage: FirebaseStorage;
}

interface EnrichedUser extends User {
    companyId?: string;
}

interface UserAuthState {
  user: EnrichedUser | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export interface FirebaseContextState {
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  storage: FirebaseStorage | null;
  user: EnrichedUser | null;
  isUserLoading: boolean;
  userError: Error | null;
}

const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

// A non-async function to handle setting the session cookie.
const setSessionCookie = (idToken: string | null) => {
    fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
    }).catch(error => {
        console.error("FirebaseProvider: Failed to set session cookie:", error);
    });
};

function useEnrichedUser(baseUser: User | null, firestore: Firestore | null) {
    const userDocRef = useMemoFirebase(() => {
        if (!firestore || !baseUser) return null;
        return doc(firestore, 'users', baseUser.uid);
    }, [firestore, baseUser]);

    const { data: userData, isLoading: isUserDataLoading } = useDoc<{ companyId: string }>(userDocRef);
    
    return useMemo(() => {
        if (!baseUser) return { enrichedUser: null, isEnriching: false };
        if (isUserDataLoading) return { enrichedUser: baseUser, isEnriching: true };
        
        return {
            enrichedUser: {
                ...baseUser,
                companyId: userData?.companyId
            },
            isEnriching: false
        };
    }, [baseUser, userData, isUserDataLoading]);
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

  const { enrichedUser, isEnriching } = useEnrichedUser(baseUser, firestore);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(
      auth,
      async (firebaseUser) => {
        setBaseUser(firebaseUser);
        setIsAuthLoading(false);
        setAuthError(null);
        
        if (typeof window !== 'undefined') {
            const idToken = firebaseUser ? await firebaseUser.getIdToken() : null;
            setSessionCookie(idToken);
        }
      },
      (error) => {
        console.error("FirebaseProvider: onIdTokenChanged error:", error);
        setBaseUser(null);
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
  }), [firebaseApp, firestore, auth, storage, enrichedUser, isAuthLoading, isEnriching, authError]);

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
    const { user, isUserLoading, userError } = useFirebase();
    return { user, isUserLoading, userError };
};

// This function is safe to be called from client-side effects and callbacks
// as it does not use any React hooks internally.
export async function getClientSideAuthToken(): Promise<string | null> {
    const auth = getAuth();
    if (!auth) return null;
    const user = auth.currentUser;
    if (user) {
        try {
            return await getIdToken(user);
        } catch (error) {
            console.error("Error getting auth token:", error);
            return null;
        }
    }
    return null;
}
