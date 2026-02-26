
'use client';

import React, { createContext, useContext, ReactNode, useMemo, useState, useEffect, useCallback } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc } from 'firebase/firestore';
import { Auth, User, onIdTokenChanged, getIdTokenResult } from 'firebase/auth';
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
    claims?: { [key: string]: any };
    companyData?: any; // Added to hold the entire company document
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
  const [claims, setClaims] = useState<any | null>(null);
  const [isClaimsLoading, setIsClaimsLoading] = useState(true);

  // Effect for Auth state
  useEffect(() => {
    const unsubscribe = onIdTokenChanged(
      auth,
      async (firebaseUser) => {
        const idToken = firebaseUser ? await firebaseUser.getIdToken() : null;
        await setSessionCookie(idToken);
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
  }, [auth]);

  // Effect for Custom Claims
  useEffect(() => {
    if (baseUser) {
        setIsClaimsLoading(true);
        // Force refresh to get latest claims after registration
        baseUser.getIdTokenResult(true).then((idTokenResult) => {
            setClaims(idTokenResult.claims);
        }).catch(error => {
            console.error("Error fetching user claims:", error);
            setClaims(null);
        }).finally(() => {
            setIsClaimsLoading(false);
        });
    } else {
        setClaims(null);
        setIsClaimsLoading(false);
    }
  }, [baseUser]);

  // Data fetching for user document from Firestore
  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !baseUser?.uid) return null;
    return doc(firestore, 'users', baseUser.uid);
  }, [firestore, baseUser]);

  const { data: userData, isLoading: isUserDataLoading, forceRefresh } = useDoc<{ companyId?: string; passwordChangeRequired?: boolean }>(userDocRef);
  const companyId = userData?.companyId;

  // NEW: Fetch company document right here
  const companyDocRef = useMemoFirebase(() => {
    if (!firestore || !companyId) return null;
    return doc(firestore, 'companies', companyId);
  }, [firestore, companyId]);

  const { data: companyData, isLoading: isCompanyLoading, forceRefresh: forceRefreshCompany } = useDoc(companyDocRef);

  // Combine all data into the final user object
  const enrichedUser = useMemo(() => {
    if (!baseUser) return null;
    return {
        ...baseUser,
        companyId: userData?.companyId,
        passwordChangeRequired: userData?.passwordChangeRequired,
        claims: claims || {},
        companyData: companyData, // Attach the fetched company data
    } as EnrichedUser;
  }, [baseUser, userData, claims, companyData]); // Add companyData to dependency array

  const isUserLoading = isAuthLoading || isUserDataLoading || isClaimsLoading || (userData?.companyId ? isCompanyLoading : false);
  
  const forceRefreshAll = useCallback(() => {
    forceRefresh(); // Refreshes userDoc
    if (companyId) {
      forceRefreshCompany(); // Refreshes companyDoc
    }
  }, [forceRefresh, forceRefreshCompany, companyId]);

  const contextValue = useMemo((): FirebaseContextState => ({
    firebaseApp,
    firestore,
    auth,
    storage,
    user: enrichedUser,
    isUserLoading,
    userError: authError,
    forceRefreshUser: forceRefreshAll,
  }), [firebaseApp, firestore, auth, storage, enrichedUser, isUserLoading, authError, forceRefreshAll]);

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
