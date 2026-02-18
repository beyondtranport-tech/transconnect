
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
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
            return;
        }
        console.error("FirebaseProvider: Error calling session API:", error);
    }
};

function useEnrichedUser(baseUser: User | null, firestore: Firestore | null) {
    const isAdmin = baseUser?.email === 'beyondtransport@gmail.com' || baseUser?.email === 'mkoton100@gmail.com';

    const userDocRef = useMemoFirebase(() => {
        if (!firestore || !baseUser || isAdmin) return null;
        return doc(firestore, 'users', baseUser.uid);
    }, [firestore, baseUser, isAdmin]);

    const { data: userData, isLoading: isUserDataLoading, forceRefresh } = useDoc<{ companyId: string; passwordChangeRequired?: boolean }>(userDocRef);
    
    return useMemo(() => {
        if (!baseUser) return { enrichedUser: null, isEnriching: false, forceRefresh };
        
        if (isAdmin) {
             return {
                enrichedUser: baseUser as EnrichedUser,
                isEnriching: false,
                forceRefresh: () => {}
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
        const idToken = firebaseUser ? await getIdToken(firebaseUser, true) : null; // Force refresh
        await setSessionCookie(idToken);
        
        if (firebaseUser && idToken) {
          // This ensures a user's profile and company docs are created if they are missing.
          try {
             // CRITICAL FIX: Await the backend call to ensure database is consistent before client proceeds.
            const referrerId = new URLSearchParams(window.location.search).get('ref');
            const response = await fetch('/api/checkAndCreateUser', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${idToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ referrerId }), 
            });

             if (!response.ok) {
              const result = await response.json();
              console.error("FirebaseProvider: checkAndCreateUser API call failed:", result.error);
            }

          } catch (error) {
            console.error("FirebaseProvider: Failed to call checkAndCreateUser:", error);
          }
        }
        
        setBaseUser(firebaseUser);
        setIsAuthLoading(false);
        setAuthError(null);
        
        // This will now be called AFTER the user doc is (potentially) updated on the backend.
        if (firebaseUser) {
           forceRefresh();
        }

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
