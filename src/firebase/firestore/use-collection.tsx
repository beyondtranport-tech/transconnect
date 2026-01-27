'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Query,
  DocumentData,
  CollectionReference,
} from 'firebase/firestore';
import { getClientSideAuthToken } from '@/firebase/errors';

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
 * It does NOT provide real-time updates.
 *
 * IMPORTANT! YOU MUST MEMOIZE the inputted memoizedTargetRefOrQuery or BAD THINGS WILL HAPPEN
 *
 * @template T Optional type for document data. Defaults to any.
 * @param {CollectionReference<DocumentData> | Query<DocumentData> | null | undefined} memoizedTargetRefOrQuery -
 * The Firestore CollectionReference or Query. Must be memoized to prevent infinite loops.
 * @returns {UseCollectionResult<T>} Object with data, isLoading, error.
 */
export function useCollection<T = any>(
    memoizedTargetRefOrQuery: ((CollectionReference<DocumentData> | Query<DocumentData>) & {__memo?: boolean})  | null | undefined,
): UseCollectionResult<T> {
  type ResultItemType = WithId<T>;
  type StateDataType = ResultItemType[] | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const forceRefresh = useCallback(() => {
    setRefreshKey(oldKey => oldKey + 1);
  }, []);

  const path = useMemo(() => {
    if (!memoizedTargetRefOrQuery || !('path' in memoizedTargetRefOrQuery)) return null;
    return (memoizedTargetRefOrQuery as CollectionReference).path;
  }, [memoizedTargetRefOrQuery]);
  
  const isCollectionGroup = useMemo(() => {
    return memoizedTargetRefOrQuery && !('path' in memoizedTargetRefOrQuery);
  }, [memoizedTargetRefOrQuery]);

  const collectionId = useMemo(() => {
    if(!isCollectionGroup || !memoizedTargetRefOrQuery) return null;
    // Access internal property to get collection group ID.
    return (memoizedTargetRefOrQuery as any)._query.collectionGroup;
  }, [memoizedTargetRefOrQuery, isCollectionGroup]);

  const isPublicPath = useMemo(() => {
    if (!path) return false;
    const publicPrefixes = ['memberships', 'configuration', 'shops'];
    return publicPrefixes.some(prefix => path.startsWith(prefix));
  }, [path]);

  useEffect(() => {
    const apiPath = path || collectionId;
    if (!apiPath) {
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
            
            const apiType = isCollectionGroup ? 'collection-group' : 'collection';

            const response = await fetch('/api/getUserSubcollection', {
                method: 'POST',
                headers: {
                    ...(token && { 'Authorization': `Bearer ${token}` }),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ path: apiPath, type: apiType }),
            });

            if (!isMounted) return;

            if (!response.ok) {
                let errorMsg = `Failed to fetch collection. Status: ${response.status}`;
                 try {
                    const errorResult = await response.json();
                    errorMsg = errorResult.error || errorMsg;
                } catch (e) {
                    errorMsg = `${errorMsg}. ${response.statusText}`;
                }
                throw new Error(errorMsg);
            }
            
            const result = await response.json();
            setData(result.data as StateDataType);

        } catch (e: any) {
             console.error("useCollection fetch error:", e);
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

  }, [path, collectionId, isCollectionGroup, isPublicPath, refreshKey]);

  return { data, isLoading, error, forceRefresh };
}