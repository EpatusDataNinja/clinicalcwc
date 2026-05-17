/**
 * React hook wrappers for Zustand store
 */

import { useEffect, useState, useRef } from 'react';
import { useCaseStore, type CaseStore } from '@/lib/store';
import {
  restoreDataFromDB,
  seedClinicalData,
  initializeDrugDatabase,
  loadDrugsIntoStore,
} from '@/lib/clinicalDataService';
import { mockDrugs, mockCases, mockTasks } from '@/lib/mockData';
import { db, runMigrations } from '@/lib/localDB';
import { telemetry } from '@/lib/telemetryService';
import { config } from '@/lib/config';

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
      const store = useCaseStore.getState();

      // Start global init timeout (10s)
      const timeoutId = setTimeout(() => {
        const current = useCaseStore.getState();
        if (current.dataStatus !== 'ready' && !current.isLocked) {
          console.warn('[Init] Initialization timed out after 10s');
          current.setDataStatus('error');
          current.setInitError(
            'Initialization timed out. Please check your connection or refresh.'
          );
        }
      }, 10000);

      try {
        await telemetry.trace('app_initialization', 'init', async () => {
          // 1. Database migrations & opening
          await telemetry.trace('db_open_migrations', 'db', async () => {
            await db.open();
            await runMigrations();
          });

          // 2. Drug Seeding (Version-aware) — via service layer
          await telemetry.trace('drug_initialization', 'db', async () => {
            await initializeDrugDatabase(mockDrugs);
            await loadDrugsIntoStore();
          });

          // 3. Clinical Seeding (Version-aware)
          if (config.enableSeedData) {
            await telemetry.trace('clinical_seeding', 'db', async () => {
              await seedClinicalData(mockCases, mockTasks);
            });
          }

          // 4. Data Restoration
          await restoreDataFromDB();
        });

        clearTimeout(timeoutId);
      } catch (err: unknown) {
        clearTimeout(timeoutId);
        const errorMsg = err instanceof Error ? err.message : 'Initialization failed';
        store.setDataStatus('error');
        store.setInitError(errorMsg);
        setError(err instanceof Error ? err : new Error(errorMsg));
      } finally {
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
  return useCaseStore((state: CaseStore) => state.cases);
}

/**
 * Hook to get tasks from store
 */
export function useTasks() {
  return useCaseStore((state: CaseStore) => state.tasks);
}

/**
 * Hook to get drugs from store
 */
export function useDrugs() {
  return useCaseStore((state: CaseStore) => state.drugs);
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
