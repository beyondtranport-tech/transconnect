'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Query,
  DocumentData,
  CollectionReference,
  onSnapshot,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

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
 * React hook to fetch a Firestore collection in real-time.
 * It provides live updates when the data changes in Firestore.
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

  useEffect(() => {
    // If the query is null or undefined, do nothing.
    if (!memoizedTargetRefOrQuery) {
      setData(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const unsubscribe = onSnapshot(
      memoizedTargetRefOrQuery,
      (querySnapshot) => {
        const documents = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data() as T,
        }));
        setData(documents);
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        // Instead of directly throwing, we set the error state
        // and emit a global event for debugging, which is more robust.
        console.error("useCollection onSnapshot error:", err);
        setError(err); 
        setIsLoading(false);
        setData(null);
        
        // This check is important. We only create a rich error if it's a permissions issue.
        if (err.code === 'permission-denied') {
             errorEmitter.emit(
                'permission-error',
                new FirestorePermissionError({
                    path: 'path' in memoizedTargetRefOrQuery ? memoizedTargetRefOrQuery.path : 'unknown collection group',
                    operation: 'list',
                })
            );
        }
      }
    );

    // Unsubscribe from the listener when the component unmounts or the query changes.
    return () => unsubscribe();
  }, [memoizedTargetRefOrQuery, refreshKey]); // Now correctly depends on refreshKey

  return { data, isLoading, error, forceRefresh };
}
