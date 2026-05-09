/**
 * React hook wrappers for Zustand store
 */

import { useEffect, useState } from 'react';
import { useCaseStore } from '@/lib/store';
import { restoreDataFromDB } from '@/lib/clinicalDataService';
import { mockCases, mockDrugs, mockTasks } from '@/lib/mockData';
import { drugsDB } from '@/lib/localDB';
import { db, initializeDatabase } from '@/lib/localDB';

/**
 * Initialize the app: load cases/tasks/drugs from store/DB
 */
export function useAppInitialization() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const store = useCaseStore();

  useEffect(() => {
    async function init() {
      try {
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
  }, [store]);

  return { isLoading, error };
}

/**
 * Hook to get cases from store
 */
export function useCases() {
  const cases = useCaseStore((state) => state.cases);
  return cases;
}

/**
 * Hook to get tasks from store
 */
export function useTasks() {
  const tasks = useCaseStore((state) => state.tasks);
  return tasks;
}

/**
 * Hook to get drugs from store
 */
export function useDrugs() {
  const drugs = useCaseStore((state) => state.drugs);
  return drugs;
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
