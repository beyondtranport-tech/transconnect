'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Query,
  DocumentData,
  collection,
  query,
  getDocs,
} from 'firebase/firestore';
import { useFirestore } from '@/firebase/provider';
import type { WithId, UseCollectionResult, InternalQuery } from './use-collection';

/**
 * React hook to fetch a Firestore collection for public pages.
 * This hook fetches data directly on the client.
 * It does NOT provide real-time updates.
 *
 * IMPORTANT! YOU MUST MEMOIZE the inputted memoizedTargetRefOrQuery or BAD THINGS WILL HAPPEN
 *
 * @template T Optional type for document data. Defaults to any.
 * @param {CollectionReference<DocumentData> | Query<DocumentData> | null | undefined} memoizedTargetRefOrQuery -
 * The Firestore CollectionReference or Query to fetch.
 * @returns {UseCollectionResult<T>} Object with data, isLoading, error, and a forceRefresh function.
 */
export function usePublicCollection<T = any>(
    memoizedTargetRefOrQuery: ((DocumentData) & {__memo?: boolean})  | null | undefined,
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

  useEffect(() => {
    if (!memoizedTargetRefOrQuery) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const q = memoizedTargetRefOrQuery as Query;
            const querySnapshot = await getDocs(q);
            const data = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as ResultItemType[];
            setData(data);
        } catch (e) {
            console.error("usePublicCollection error:", e);
            setError(e as Error);
            setData(null);
        } finally {
            setIsLoading(false);
        }
    };

    fetchData();
    
  }, [memoizedTargetRefOrQuery, refreshKey]);

  return { data, isLoading, error, forceRefresh };
}
