'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect, useCallback } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, onSnapshot } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener'

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

export interface FirebaseContextState {
  areServicesAvailable: boolean;
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  user: (User & { [key: string]: any }) | null;
  isUserLoading: boolean;
  userError: Error | null;
  forceRefresh: () => void;
}

export interface UserHookResult { 
  user: (User & { [key: string]: any }) | null;
  isUserLoading: boolean;
  userError: Error | null;
  forceRefresh: () => void;
}

export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
}) => {
  const [authState, setAuthState] = useState<User | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [companyData, setCompanyData] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [userError, setUserError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const forceRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  useEffect(() => {
    if (!auth) {
      setIsAuthLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthState(user);
      setIsAuthLoading(false);
      if (!user) {
        setUserData(null);
        setCompanyData(null);
      }
    }, (error) => {
      setUserError(error);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    if (!firestore || !authState?.uid) {
      setUserData(null);
      setCompanyData(null);
      setIsDataLoading(false);
      return;
    }

    setIsDataLoading(true);
    
    const userRef = doc(firestore, 'users', authState.uid);
    const unsubUser = onSnapshot(userRef, (snap) => {
      const uData = snap.data();
      setUserData(uData || null);
      
      if (uData?.companyId) {
        const companyRef = doc(firestore, 'companies', uData.companyId);
        const unsubCompany = onSnapshot(companyRef, (cSnap) => {
            setCompanyData(cSnap.data() || null);
            setIsDataLoading(false);
        }, (err) => {
            console.error("Error fetching company data:", err);
            setIsDataLoading(false);
        });
        return () => unsubCompany();
      } else {
        setCompanyData(null);
        setIsDataLoading(false);
      }
    }, (err) => {
      console.error("Error fetching user data:", err);
      setIsDataLoading(false);
    });

    return () => unsubUser();
  }, [firestore, authState?.uid, refreshKey]);

  const enrichedUser = useMemo(() => {
    if (!authState) return null;
    return {
      ...authState,
      ...userData,
      companyData,
    };
  }, [authState, userData, companyData]);

  const contextValue = useMemo((): FirebaseContextState => {
    const servicesAvailable = !!(firebaseApp && firestore && auth);
    return {
      areServicesAvailable: servicesAvailable,
      firebaseApp: servicesAvailable ? firebaseApp : null,
      firestore: servicesAvailable ? firestore : null,
      auth: servicesAvailable ? auth : null,
      user: enrichedUser,
      isUserLoading: isAuthLoading || isDataLoading,
      userError,
      forceRefresh,
    };
  }, [firebaseApp, firestore, auth, enrichedUser, isAuthLoading, isDataLoading, userError, forceRefresh]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }
  return context;
};

export const useAuth = (): Auth => {
    const fb = useFirebase();
    if (!fb.auth) throw new Error('Firebase Auth not available');
    return fb.auth!;
};
export const useFirestore = (): Firestore => {
    const fb = useFirebase();
    if (!fb.firestore) throw new Error('Firebase Firestore not available');
    return fb.firestore!;
};
export const useFirebaseApp = (): FirebaseApp => {
    const fb = useFirebase();
    if (!fb.firebaseApp) throw new Error('Firebase App not available');
    return fb.firebaseApp!;
};

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T {
  const memoized = useMemo(factory, deps);
  if (memoized && typeof memoized === 'object') {
    (memoized as any).__memo = true;
  }
  return memoized;
}

export const useUser = (): UserHookResult => { 
  const { user, isUserLoading, userError, forceRefresh } = useFirebase(); 
  return { user, isUserLoading, userError, forceRefresh };
};
