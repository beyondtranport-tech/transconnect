
'use client';
    
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  DocumentReference,
  DocumentData,
} from 'firebase/firestore';
import { getClientSideAuthToken } from '@/firebase/errors';

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

    let isMounted = true;

    const fetchData = async () => {
        if (!isMounted) return;
        setIsLoading(true);
        setError(null);

        try {
            let token: string | null = null;
            if (!isPublicPath) {
                token = await getClientSideAuthToken();
                if (!token) {
                    if (isMounted) setIsLoading(false);
                    return;
                }
            }
            
            const response = await fetch('/api/getUserSubcollection', {
                method: 'POST',
                headers: {
                    ...(token && { 'Authorization': `Bearer ${token}` }),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ path, type: 'document' }),
            });

            if (!isMounted) return;

            if (!response.ok) {
                let errorMsg = `Failed to fetch document. Status: ${response.status}`;
                try {
                    const errorResult = await response.json();
                    errorMsg = errorResult.error || errorMsg;
                } catch (e) {
                    // Response was not JSON, likely an HTML error page.
                    errorMsg = `${errorMsg}. ${response.statusText}`;
                }
                throw new Error(errorMsg);
            }

            const result = await response.json();
            setData(result.data as WithId<T> | null);

        } catch (e: any) {
            console.error("useDoc fetch error:", e);
             if (isMounted) {
                setError(e);
                setData(null);
            }
        } finally {
             if (isMounted) {
              setIsLoading(false);
            }
        }
    };

    fetchData();
    
    return () => {
      isMounted = false;
    };

  }, [path, isPublicPath, refreshKey]);

  return { data, isLoading, error, forceRefresh };
}
