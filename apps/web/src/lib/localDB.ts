/**
 * IndexedDB Schema via Dexie.js
 * Full offline-first local database for CWC app.
 * Auto-syncs with Zustand store on initialization.
 */

import Dexie, { type Table } from 'dexie';
import type { ClinicalCase, ClinicalTask, DrugReference } from './mockData';

export interface SyncQueueItem {
  id?: number;
  entityId: string;
  type: 'create' | 'update' | 'delete';
  entity: 'case' | 'task';
  payload: unknown;
  synced: boolean;
  createdAt?: string;
  retryCount: number;
}

export interface EncryptedCaseRecord {
  id: string;
  encryptedData: string;
  createdAt: string;
  updatedAt: string;
}

export interface EncryptedTaskRecord {
  id: string;
  caseId: string;
  encryptedData: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AppConfig {
  key: string;
  value: any;
}

export interface TelemetryLog {
  id?: number;
  event: string;
  stage: 'init' | 'auth' | 'db' | 'hydration' | 'sync' | 'error';
  status: 'start' | 'success' | 'error';
  duration?: number;
  metadata?: any;
  timestamp: number;
}

export interface MigrationLog {
  version: number;
  appliedAt: number;
  status: 'success' | 'error';
  error?: string;
}

export class CWCDatabase extends Dexie {
  cases!: Table<EncryptedCaseRecord>;
  tasks!: Table<EncryptedTaskRecord>;
  drugs!: Table<DrugReference>;
  syncQueue!: Table<SyncQueueItem>;
  appConfig!: Table<AppConfig>;
  telemetry!: Table<TelemetryLog>;
  migrations!: Table<MigrationLog>;

  constructor() {
    super('ClinicalCWC');
    this.version(1).stores({
      cases: 'id',
      tasks: 'id, caseId',
      drugs: 'id, category',
      syncQueue: '++id, entityId, createdAt',
    });
    this.version(2).stores({
      cases: 'id, updatedAt',
      tasks: 'id, caseId, updatedAt',
      drugs: 'id, category, name',
      syncQueue: '++id, entityId, entity, synced, createdAt',
    });
    this.version(3).stores({
      appConfig: 'key',
    });
    this.version(4).stores({
      telemetry: '++id, event, stage, timestamp',
      migrations: 'version',
    });
  }
}

export const db = new CWCDatabase();

/**
 * Initialize database with sample data (if version mismatch)
 */
export async function initializeDatabase(initialDrugs: DrugReference[]): Promise<void> {
  const DRUG_DATA_VERSION = 2; // Incremented for the 1000+ professional set

  try {
    const config = await db.appConfig.get('drug_data_version');

    // Only seed if version is missing or outdated
    if (!config || config.value < DRUG_DATA_VERSION) {
      console.log(`[DB] Seeding drug database (v${DRUG_DATA_VERSION})...`);

      // use bulkPut to update existing items while keeping user additions
      // bulkAdd would fail on existing IDs
      await db.drugs.bulkPut(initialDrugs);

      await db.appConfig.put({ key: 'drug_data_version', value: DRUG_DATA_VERSION });
      console.log('[DB] Drug seeding complete.');
    }
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
}

/**
 * Cases API — encrypted storage
 */
export const casesDB = {
  getAll: async (): Promise<EncryptedCaseRecord[]> => {
    try {
      return await db.cases.toArray();
    } catch (error) {
      console.error('Failed to get cases:', error);
      return [];
    }
  },
  getById: async (id: string): Promise<EncryptedCaseRecord | undefined> => {
    try {
      return await db.cases.get(id);
    } catch (error) {
      console.error('Failed to get case:', error);
      return undefined;
    }
  },
  upsert: async (record: EncryptedCaseRecord): Promise<void> => {
    try {
      await db.cases.put(record);
    } catch (error) {
      console.error('Failed to upsert case:', error);
    }
  },
  upsertMany: async (records: EncryptedCaseRecord[]): Promise<void> => {
    try {
      await db.cases.bulkPut(records);
    } catch (error) {
      console.error('Failed to bulk upsert cases:', error);
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      await db.cases.delete(id);
    } catch (error) {
      console.error('Failed to delete case:', error);
    }
  },
  clear: async (): Promise<void> => {
    try {
      await db.cases.clear();
    } catch (error) {
      console.error('Failed to clear cases:', error);
    }
  },
};

/**
 * Tasks API — encrypted storage
 */
export const tasksDB = {
  getAll: async (): Promise<EncryptedTaskRecord[]> => {
    try {
      return await db.tasks.toArray();
    } catch (error) {
      console.error('Failed to get tasks:', error);
      return [];
    }
  },
  getByCaseId: async (caseId: string): Promise<EncryptedTaskRecord[]> => {
    try {
      return await db.tasks.where('caseId').equals(caseId).toArray();
    } catch (error) {
      console.error('Failed to get tasks for case:', error);
      return [];
    }
  },
  upsert: async (record: EncryptedTaskRecord): Promise<void> => {
    try {
      await db.tasks.put(record);
    } catch (error) {
      console.error('Failed to upsert task:', error);
    }
  },
  upsertMany: async (records: EncryptedTaskRecord[]): Promise<void> => {
    try {
      // Data Integrity: Verify case existence for all tasks
      const caseIds = Array.from(new Set(records.map(r => r.caseId)));
      const existingCases = await db.cases.bulkGet(caseIds);
      const validCaseIds = new Set(existingCases.filter(c => !!c).map(c => c!.id));

      const validRecords = records.filter(r => validCaseIds.has(r.caseId));
      if (validRecords.length < records.length) {
        console.warn(`[DB] Dropping ${records.length - validRecords.length} orphan tasks during bulk upsert.`);
      }

      await db.tasks.bulkPut(validRecords);
    } catch (error) {
      console.error('Failed to bulk upsert tasks:', error);
    }
  },
  delete: async (id: string): Promise<void> => {
    try {
      await db.tasks.delete(id);
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  },
  clear: async (): Promise<void> => {
    try {
      await db.tasks.clear();
    } catch (error) {
      console.error('Failed to clear tasks:', error);
    }
  },
};

/**
 * Drugs API — plain (no encryption needed for reference data)
 */
export const drugsDB = {
  getAll: async (): Promise<DrugReference[]> => {
    try {
      return await db.drugs.toArray();
    } catch (error) {
      console.error('Failed to get drugs:', error);
      return [];
    }
  },
  search: async (query: string): Promise<DrugReference[]> => {
    try {
      const all = await db.drugs.toArray();
      const lower = query.toLowerCase();
      return all.filter(
        (d) =>
          d.name.toLowerCase().includes(lower) ||
          d.category.toLowerCase().includes(lower) ||
          d.notes.toLowerCase().includes(lower)
      );
    } catch (error) {
      console.error('Failed to search drugs:', error);
      return [];
    }
  },
};

/**
 * Sync Queue API
 */
export const syncQueueDB = {
  getAll: async (): Promise<SyncQueueItem[]> => {
    try {
      return await db.syncQueue.toArray();
    } catch (error) {
      console.error('Failed to get sync queue:', error);
      return [];
    }
  },
  getPending: async (): Promise<SyncQueueItem[]> => {
    try {
      return await db.syncQueue.filter((item) => !item.synced).toArray();
    } catch (error) {
      console.error('Failed to get pending sync items:', error);
      return [];
    }
  },
  enqueue: async (item: Omit<SyncQueueItem, 'id'>): Promise<number> => {
    try {
      return await db.syncQueue.add({
        ...item,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to enqueue sync item:', error);
      throw error;
    }
  },
  markSynced: async (id: number): Promise<void> => {
    try {
      await db.syncQueue.update(id, { synced: true });
    } catch (error) {
      console.error('Failed to mark synced:', error);
    }
  },
  incrementRetry: async (id: number): Promise<void> => {
    try {
      const item = await db.syncQueue.get(id);
      if (item) {
        await db.syncQueue.update(id, { retryCount: item.retryCount + 1 });
      }
    } catch (error) {
      console.error('Failed to increment retry:', error);
    }
  },
  delete: async (id: number): Promise<void> => {
    try {
      await db.syncQueue.delete(id);
    } catch (error) {
      console.error('Failed to delete sync item:', error);
    }
  },
};

/**
 * Low-level utility to enqueue a sync change.
 * Placed here to prevent circular dependencies between clinicalDataService and syncService.
 */
export function enqueueChange(
  entityId: string,
  type: SyncQueueItem['type'],
  entity: SyncQueueItem['entity'],
  payload: unknown
): void {
  syncQueueDB.enqueue({
    entityId,
    type,
    entity,
    payload,
    synced: false,
    retryCount: 0,
  }).catch(err => console.error('[DB] Failed to enqueue sync item:', err));
}

/**
 * Migration System
 */
const MIGRATIONS: Record<number, (db: CWCDatabase) => Promise<void>> = {
  1: async (db) => {
    console.log('[Migration] Version 1: Initial schema check');
    // Placeholder for actual data migrations
  },
};

export async function runMigrations(): Promise<void> {
  const currentVersion = 1;

  try {
    for (let v = 1; v <= currentVersion; v++) {
      const log = await db.migrations.get(v);
      if (!log || log.status !== 'success') {
        console.log(`[DB] Running data migration v${v}...`);
        try {
          await MIGRATIONS[v](db);
          await db.migrations.put({
            version: v,
            appliedAt: Date.now(),
            status: 'success'
          });
        } catch (err: any) {
          await db.migrations.put({
            version: v,
            appliedAt: Date.now(),
            status: 'error',
            error: err.message || String(err)
          });
          throw new Error(`Migration v${v} failed: ${err.message}`);
        }
      }
    }
  } catch (error) {
    console.error('Migration pipeline failed:', error);
    throw error;
  }
}
