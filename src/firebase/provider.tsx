
'use client';

import React, { createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
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

// A robust async function to handle setting the session cookie.
const setSessionCookie = async (idToken: string | null) => {
    try {
        await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
        });
    } catch (error) {
        // This specific TypeError is common when a fetch is aborted by page navigation
        // or during development with Fast Refresh. It's safe to ignore.
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
            return;
        }
        // Log any other, unexpected errors.
        console.error("FirebaseProvider: Error calling session API:", error);
    }
};

function useEnrichedUser(baseUser: User | null, firestore: Firestore | null) {
    const isAdmin = baseUser?.email === 'beyondtransport@gmail.com' || baseUser?.email === 'mkoton100@gmail.com';

    // If the user is an admin, we don't need to fetch their company profile.
    const userDocRef = useMemoFirebase(() => {
        if (!firestore || !baseUser || isAdmin) return null;
        return doc(firestore, 'users', baseUser.uid);
    }, [firestore, baseUser, isAdmin]);

    const { data: userData, isLoading: isUserDataLoading, forceRefresh } = useDoc<{ companyId: string; passwordChangeRequired?: boolean }>(userDocRef);
    
    return useMemo(() => {
        if (!baseUser) return { enrichedUser: null, isEnriching: false, forceRefresh };
        
        // If admin, enrichment is done. Just return the base user.
        if (isAdmin) {
             return {
                enrichedUser: baseUser as EnrichedUser,
                isEnriching: false,
                forceRefresh: () => {} // No-op refresh for admin, as there's nothing to refresh
            };
        }

        if (isUserDataLoading) return { enrichedUser: baseUser as EnrichedUser, isEnriching: true, forceRefresh };
        
        return {
            enrichedUser: {
                ...baseUser,
                companyId: userData?.companyId,
                passwordChangeRequired: userData?.passwordChangeRequired
            } as EnrichedUser,
            isEnriching: false,
            forceRefresh
        };
    }, [baseUser, userData, isUserDataLoading, forceRefresh, isAdmin]);
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

  const { enrichedUser, isEnriching, forceRefresh } = useEnrichedUser(baseUser, firestore);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(
      auth,
      async (firebaseUser) => {
        // First, handle the session cookie logic. Let it run in the background.
        const idToken = firebaseUser ? await getIdToken(firebaseUser) : null;
        setSessionCookie(idToken);
        
        // THEN, update the React state. This prevents race conditions.
        setBaseUser(firebaseUser);
        setIsAuthLoading(false);
        setAuthError(null);
      },
      (error) => {
        console.error("FirebaseProvider: onIdTokenChanged error:", error);
        // Ensure session cookie is cleared on error as well.
        setSessionCookie(null);
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
