/**
 * React hook wrappers for Zustand store
 */

import { useEffect, useState, useRef } from 'react';
import { useCaseStore } from '@/lib/store';
import { restoreDataFromDB } from '@/lib/clinicalDataService';
import { mockDrugs } from '@/lib/mockData';
import { drugsDB } from '@/lib/localDB';
import { db, initializeDatabase } from '@/lib/localDB';

/**
 * Initialize the app: load cases/tasks/drugs from store/DB
 * Uses getState() to avoid subscribing to the entire store,
 * preventing infinite re-render loops when store is mutated during init.
 */
export function useAppInitialization() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    async function init() {
      try {
        const store = useCaseStore.getState();

        // Initialize Dexie database
        await db.open();

        // Load drugs from IndexedDB or use mock data
        let drugs = await drugsDB.getAll();
        if (drugs.length === 0) {
          await initializeDatabase(mockDrugs);
          drugs = await drugsDB.getAll();
        }
        store.loadDrugs(drugs);

        // Restore encrypted cases/tasks from IndexedDB
        if (!store.isInitialized) {
          await restoreDataFromDB();
        }

        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Initialization failed'));
        setIsLoading(false);
      }
    }

    init();
  }, []);

  return { isLoading, error };
}

/**
 * Hook to get cases from store
 */
export function useCases() {
  return useCaseStore((state) => state.cases);
}

/**
 * Hook to get tasks from store
 */
export function useTasks() {
  return useCaseStore((state) => state.tasks);
}

/**
 * Hook to get drugs from store
 */
export function useDrugs() {
  return useCaseStore((state) => state.drugs);
}

/**
 * Hook to get drugs count from store
 */
export function useDrugsCount() {
  return useCaseStore((state) => state.drugs.length);
}

/**
 * Hook to get sync status
 */
export function useSyncStatus() {
  const syncStatus = useCaseStore((state) => state.syncStatus);
  const lastSyncAt = useCaseStore((state) => state.lastSyncAt);
  const pendingSyncCount = useCaseStore((state) => state.pendingSyncCount);
  return { syncStatus, lastSyncAt, pendingSyncCount };
}
