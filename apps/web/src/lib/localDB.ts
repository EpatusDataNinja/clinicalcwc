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

export class CWCDatabase extends Dexie {
  cases!: Table<EncryptedCaseRecord>;
  tasks!: Table<EncryptedTaskRecord>;
  drugs!: Table<DrugReference>;
  syncQueue!: Table<SyncQueueItem>;

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
  }
}

export const db = new CWCDatabase();

/**
 * Initialize database with sample data (if empty)
 */
export async function initializeDatabase(initialDrugs: DrugReference[]): Promise<void> {
  try {
    const drugCount = await db.drugs.count();
    if (drugCount === 0) {
      await db.drugs.bulkAdd(initialDrugs);
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
      await db.tasks.bulkPut(records);
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
