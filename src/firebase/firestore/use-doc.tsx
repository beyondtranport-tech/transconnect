
'use client';
    
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  DocumentReference,
  DocumentData,
} from 'firebase/firestore';
import { getClientSideAuthToken } from '@/firebase';
import { useUser } from '@/firebase';

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
  
  const { user, isUserLoading } = useUser();
  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const forceRefresh = useCallback(() => {
    setRefreshKey(oldKey => oldKey + 1);
  }, []);

  const path = useMemo(() => memoizedDocRef?.path, [memoizedDocRef]);

  const isPublicPath = useMemo(() => {
    if (!path) return false;
    const publicPrefixes = ['memberships', 'configuration', 'shops'];
    return publicPrefixes.some(prefix => path.startsWith(prefix));
  }, [path]);

  useEffect(() => {
    if (!path) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    // Wait for user auth state to be resolved before fetching private data
    if (!isPublicPath && isUserLoading) {
        setIsLoading(true);
        return;
    }

    const fetchData = async () => {
        setIsLoading(true);
        setError(null);

        try {
            let token: string | null = null;
            if (!isPublicPath) {
                token = await getClientSideAuthToken();
                // After loading is done, if it's a private path and we still have no token, it's an error.
                if (!token && !isUserLoading) {
                    throw new Error("Authentication is required to access this resource.");
                }
                 if (!token) return; // Don't fetch if token isn't available yet
            }
            
            const response = await fetch('/api/getUserSubcollection', {
                method: 'POST',
                headers: {
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

  }, [path, isPublicPath, refreshKey, user, isUserLoading]);

  return { data, isLoading, error, forceRefresh };
}
