/**
 * Data Management Service
 * Handles backup export, import, and references the service layer for clear operations.
 *
 * Architecture: Uses wrapper APIs (casesDB, tasksDB, drugsDB, syncQueueDB) for reads.
 * All writes route through clinicalDataService.ts to maintain SSOT.
 */

import { decryptData } from './encryptionService';
import {
  casesDB,
  tasksDB,
  drugsDB,
  syncQueueDB,
  db,
  type EncryptedCaseRecord,
  type EncryptedTaskRecord,
  type SyncQueueItem,
} from './localDB';
import {
  getEncryptionPasscode,
  restoreDataFromDB,
  clearAllLocalData,
  resetWorkspace,
} from './clinicalDataService';
import type { DrugReference } from './mockData';

export interface CWCBackup {
  version: 1;
  exportedAt: string;
  cases: EncryptedCaseRecord[];
  tasks: EncryptedTaskRecord[];
  drugs: DrugReference[];
  syncQueue: SyncQueueItem[];
}

export async function buildBackup(): Promise<CWCBackup> {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    cases: await casesDB.getAll(),
    tasks: await tasksDB.getAll(),
    drugs: await drugsDB.getAll(),
    syncQueue: await syncQueueDB.getAll(),
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

async function readBackupFile(file: File): Promise<string> {
  if (typeof file.text === 'function') {
    return file.text();
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error('Failed to read backup file'));
    reader.readAsText(file);
  });
}

export async function importBackup(file: File): Promise<void> {
  const text = await readBackupFile(file);
  const backup = JSON.parse(text) as CWCBackup;

  if (backup.version !== 1 || !Array.isArray(backup.cases) || !Array.isArray(backup.tasks)) {
    throw new Error('Unsupported or invalid backup file');
  }

  const passcode = await getEncryptionPasscode();
  await Promise.all([
    ...backup.cases.map((record) => decryptData(record.encryptedData, passcode)),
    ...backup.tasks.map((record) => decryptData(record.encryptedData, passcode)),
  ]).catch(() => {
    throw new Error('Backup cannot be decrypted with the current passcode');
  });

  await db.transaction('rw', db.cases, db.tasks, db.drugs, db.syncQueue, async () => {
    await db.cases.bulkPut(backup.cases);
    await db.tasks.bulkPut(backup.tasks);
    await db.drugs.bulkPut(backup.drugs || []);
    await db.syncQueue.bulkPut(backup.syncQueue || []);
  });

  // Self-hydrate: restore data from DB into store after successful import
  await restoreDataFromDB({ passcode, allowLocked: true });
}

/**
 * Clear all local data. Delegates to clinicalDataService.clearAllLocalData()
 * to maintain SSOT — the service layer is the only authority for state mutations.
 */
export async function clearLocalData(): Promise<void> {
  await clearAllLocalData();
}

/**
 * Reset workspace (demo data or full wipe). Delegates to clinicalDataService.resetWorkspace()
 */
export async function resetClinicalWorkspace(
  mode: 'demo_only' | 'full',
  wipeCredentials = false
): Promise<void> {
  await resetWorkspace(mode, wipeCredentials);
}
