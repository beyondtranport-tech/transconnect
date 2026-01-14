'use client';
    
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  DocumentReference,
  DocumentData,
} from 'firebase/firestore';
import { getClientSideAuthToken } from '@/firebase/index';

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

    const controller = new AbortController();
    const signal = controller.signal;

    const fetchData = async () => {
        setIsLoading(true);
        setError(null);

        try {
            let token: string | null = null;
            // Only fetch a token if the path is not public.
            if (!isPublicPath) {
                token = await getClientSideAuthToken();
                // If it's a private path and we still have no token, it's an error.
                if (!token) {
                    // This could happen if the user logs out while a fetch is pending.
                    // We don't throw an error, but we stop the fetch.
                    if (!signal.aborted) {
                      setIsLoading(false);
                    }
                    return;
                }
            }
            
            const response = await fetch('/api/getUserSubcollection', {
                signal,
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

            if (!signal.aborted) {
              setData(result.data as WithId<T> | null);
            }
        } catch (e: any) {
            if (e.name !== 'AbortError') {
              console.error("useDoc fetch error:", e);
              if (!signal.aborted) {
                setError(e);
                setData(null);
              }
            }
        } finally {
            if (!signal.aborted) {
              setIsLoading(false);
            }
        }
    };

    fetchData();
    
    // Cleanup function to abort fetch if component unmounts
    return () => {
      controller.abort();
    };

  }, [path, isPublicPath, refreshKey]);

  return { data, isLoading, error, forceRefresh };
}
