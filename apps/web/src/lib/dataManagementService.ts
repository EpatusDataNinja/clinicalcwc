import { db } from './localDB';
import { useCaseStore } from './store';

export interface CWCBackup {
  version: 1;
  exportedAt: string;
  cases: unknown[];
  tasks: unknown[];
  drugs: unknown[];
  syncQueue: unknown[];
}

export async function buildBackup(): Promise<CWCBackup> {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    cases: await db.cases.toArray(),
    tasks: await db.tasks.toArray(),
    drugs: await db.drugs.toArray(),
    syncQueue: await db.syncQueue.toArray(),
  };
}

export async function downloadBackup(): Promise<void> {
  const backup = await buildBackup();
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `clinicalcwc-backup-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export async function importBackup(file: File): Promise<void> {
  const text = await file.text();
  const backup = JSON.parse(text) as CWCBackup;

  if (backup.version !== 1 || !Array.isArray(backup.cases) || !Array.isArray(backup.tasks)) {
    throw new Error('Unsupported or invalid backup file');
  }

  await db.transaction('rw', db.cases, db.tasks, db.drugs, db.syncQueue, async () => {
    await db.cases.clear();
    await db.tasks.clear();
    await db.drugs.clear();
    await db.syncQueue.clear();
    await db.cases.bulkPut(backup.cases as any[]);
    await db.tasks.bulkPut(backup.tasks as any[]);
    await db.drugs.bulkPut(backup.drugs as any[]);
    await db.syncQueue.bulkPut(backup.syncQueue as any[]);
  });

  useCaseStore.getState().setIsInitialized(false);
}

export async function clearLocalData(): Promise<void> {
  await db.transaction('rw', db.cases, db.tasks, db.syncQueue, async () => {
    await db.cases.clear();
    await db.tasks.clear();
    await db.syncQueue.clear();
  });

  const store = useCaseStore.getState();
  store.loadCases([]);
  store.loadTasks([]);
  store.setPendingSyncCount(0);
  store.setLastSyncAt(new Date().toISOString());
}
