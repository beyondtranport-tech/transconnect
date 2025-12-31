
'use client';
    
import { useState, useEffect, useCallback } from 'react';
import {
  DocumentReference,
  DocumentData,
  FirestoreError,
} from 'firebase/firestore';
import { getClientSideAuthToken, useUser } from '@/firebase';

/** Utility type to add an 'id' field to a given type T. */
type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useDoc hook.
 * @template T Type of the document data.
 */
export interface UseDocResult<T> {
  data: WithId<T> | null; // Document data with ID, or null.
  isLoading: boolean;       // True if loading.
  error: Error | null; // Error object, or null.
  forceRefresh: () => void; // Function to manually trigger a re-fetch.
}

/**
 * React hook to fetch a single Firestore document via a secure API route.
 * This hook is designed to bypass client-side security rule issues by fetching
 * data through a backend endpoint that uses the Firebase Admin SDK.
 * It does NOT provide real-time updates.
 *
 * IMPORTANT! YOU MUST MEMOIZE the inputted docRef or BAD THINGS WILL HAPPEN
 *
 * @template T Optional type for document data. Defaults to any.
 * @param {DocumentReference<DocumentData> | null | undefined} memoizedDocRef -
 * The Firestore DocumentReference. The path of this object is used for the API call.
 * @returns {UseDocResult<T>} Object with data, isLoading, error.
 */
export function useDoc<T = any>(
  memoizedDocRef: DocumentReference<DocumentData> | null | undefined,
): UseDocResult<T> {
  type StateDataType = WithId<T> | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start as true
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const { user, isUserLoading } = useUser();

  const forceRefresh = useCallback(() => {
    setRefreshKey(oldKey => oldKey + 1);
  }, []);

  useEffect(() => {
    // If the doc ref isn't ready, reset state and do nothing.
    if (!memoizedDocRef) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    // If the user state is still loading, wait.
    if (isUserLoading) {
      setIsLoading(true);
      return;
    }

    const fetchData = async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Always try to get the auth token.
            // The API route will decide if it's needed based on the path.
            const token = await getClientSideAuthToken();

            const path = memoizedDocRef.path;
            
            const response = await fetch('/api/getUserSubcollection', {
                method: 'POST',
                headers: {
                    // Conditionally add the Authorization header ONLY if a token was successfully retrieved.
                    ...(token && { 'Authorization': `Bearer ${token}` }),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ path, type: 'document' }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to fetch document data.');
            }

            setData(result.data as WithId<T> | null);
        } catch (e: any) {
            console.error("useDoc fetch error:", e);
            setError(e);
            setData(null);
        } finally {
            setIsLoading(false);
        }
    };

    fetchData();

  }, [memoizedDocRef, isUserLoading, user, refreshKey]);

  return { data, isLoading, error, forceRefresh };
}
