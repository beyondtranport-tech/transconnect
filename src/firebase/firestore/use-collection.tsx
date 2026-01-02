'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Query,
  DocumentData,
  FirestoreError,
  CollectionReference,
} from 'firebase/firestore';
import { getClientSideAuthToken, useUser } from '@/firebase';

/** Utility type to add an 'id' field to a given type T. */
export type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useCollection hook.
 * @template T Type of the document data.
 */
export interface UseCollectionResult<T> {
  data: WithId<T>[] | null; // Document data with ID, or null.
  isLoading: boolean;       // True if loading.
  error: Error | null; // Error object, or null.
  forceRefresh: () => void; // Function to manually trigger a re-fetch
}

/**
 * React hook to fetch a Firestore collection via a secure API route.
 * This hook is designed to bypass client-side security rule issues by fetching
 * data through a backend endpoint that uses the Firebase Admin SDK.
 * It intelligently handles both public and private collections.
 * It does NOT provide real-time updates.
 *
 * IMPORTANT! YOU MUST MEMOIZE the inputted memoizedTargetRefOrQuery or BAD THINGS WILL HAPPEN
 *
 * @template T Optional type for document data. Defaults to any.
 * @param {CollectionReference<DocumentData> | Query<DocumentData> | null | undefined} memoizedTargetRefOrQuery -
 * The Firestore CollectionReference or Query. The path of this object is used for the API call.
 * @returns {UseCollectionResult<T>} Object with data, isLoading, error.
 */
export function useCollection<T = any>(
    memoizedTargetRefOrQuery: ((CollectionReference<DocumentData> | Query<DocumentData>) & {__memo?: boolean})  | null | undefined,
): UseCollectionResult<T> {
  type ResultItemType = WithId<T>;
  type StateDataType = ResultItemType[] | null;

  const { user, isUserLoading } = useUser();
  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const forceRefresh = useCallback(() => {
    setRefreshKey(oldKey => oldKey + 1);
  }, []);

  const path = useMemo(() => {
      if (!memoizedTargetRefOrQuery) return null;
      return memoizedTargetRefOrQuery.type === 'collection'
          ? (memoizedTargetRefOrQuery as CollectionReference).path
          : (memoizedTargetRefOrQuery as Query)._query.path.segments.join('/');
  }, [memoizedTargetRefOrQuery]);

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
                if (!token) {
                    throw new Error("Authentication is required to access this resource.");
                }
            }
            
            const response = await fetch('/api/getUserSubcollection', {
                method: 'POST',
                headers: {
                    ...(token && { 'Authorization': `Bearer ${token}` }),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ path, type: 'collection' }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to fetch collection data.');
            }

            setData(result.data as ResultItemType[]);
        } catch (e: any) {
            console.error("useCollection fetch error:", e);
            setError(e);
            setData(null);
        } finally {
            setIsLoading(false);
        }
    };

    fetchData();
  }, [path, isPublicPath, isUserLoading, refreshKey]); 

  return { data, isLoading, error, forceRefresh };
}
