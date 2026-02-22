
'use client';

import React, { createContext, useContext, ReactNode, useMemo, useState, useEffect, useCallback } from 'react';
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
    const isAdmin = baseUser?.email === 'beyondtransport@gmail.com' || baseUser?.email === 'mkoton100@gmail.com';

    const userDocRef = useMemoFirebase(() => {
        // Only create a doc ref if the user is not an admin and exists
        if (!firestore || !baseUser || isAdmin) {
            return null;
        }
        return doc(firestore, 'users', baseUser.uid);
    }, [firestore, baseUser, isAdmin]);

    // Always call useDoc, it handles the null case gracefully and returns a stable forceRefresh
    const { data: userData, isLoading: isUserDataLoading, forceRefresh } = useDoc<{ companyId: string; passwordChangeRequired?: boolean }>(userDocRef);

    const enrichedUser = useMemo(() => {
        if (!baseUser) {
            return null;
        }
        // Admin user doesn't need data from the 'users' collection
        if (isAdmin) {
            return baseUser as EnrichedUser;
        }
        // For regular users, combine the auth user with the Firestore data
        return {
            ...baseUser,
            companyId: userData?.companyId,
            passwordChangeRequired: userData?.passwordChangeRequired,
        } as EnrichedUser;
    }, [baseUser, userData, isAdmin]);

    // The user is "enriching" if they are not an admin and the user document is loading
    const isEnriching = !isAdmin && !!baseUser && isUserDataLoading;
    
    // Memoize the final returned object from the hook to ensure its stability
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

  const { enrichedUser, isEnriching, forceRefresh } = useEnrichedUser(baseUser, firestore);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(
      auth,
      async (firebaseUser) => {
        const idToken = firebaseUser ? await getIdToken(firebaseUser, true) : null; // Force refresh
        await setSessionCookie(idToken);
        
        if (firebaseUser && idToken) {
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
            // Force a refresh of the user data after the backend check is complete
            forceRefresh();
          } catch (error) {
            console.error("FirebaseProvider: Failed to call checkAndCreateUser:", error);
          }
        }
        
        setBaseUser(firebaseUser);
        setIsAuthLoading(false);
        setAuthError(null);
      },
      (error) => {
        console.error("FirebaseProvider: onIdTokenChanged error:", error);
        setSessionCookie(null);
        setBaseUser(null);
        setIsAuthLoading(false);
        setAuthError(error);
      }
    );
    return () => unsubscribe();
  }, [auth, forceRefresh]);

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
