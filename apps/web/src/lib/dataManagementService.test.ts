/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildBackup, importBackup, clearLocalData } from './dataManagementService';
import { db, casesDB, tasksDB, drugsDB, syncQueueDB } from './localDB';
import { useCaseStore } from './store';
import { getEncryptionPasscode, restoreDataFromDB, clearAllLocalData } from './clinicalDataService';
import { decryptData } from './encryptionService';

// Mock localDB to control Dexie tables and transaction behavior
vi.mock('./localDB', () => ({
  db: {
    cases: { toArray: vi.fn(), bulkPut: vi.fn(), clear: vi.fn() },
    tasks: { toArray: vi.fn(), bulkPut: vi.fn(), clear: vi.fn() },
    drugs: { toArray: vi.fn(), bulkPut: vi.fn() },
    syncQueue: { toArray: vi.fn(), bulkPut: vi.fn(), clear: vi.fn() },
    transaction: vi.fn((...args: [string, ...unknown[]]) => {
      const callback = args[args.length - 1];
      return typeof callback === 'function' ? callback() : Promise.resolve();
    }),
  },
  casesDB: {
    getAll: vi.fn().mockResolvedValue([]),
  },
  tasksDB: {
    getAll: vi.fn().mockResolvedValue([]),
  },
  drugsDB: {
    getAll: vi.fn().mockResolvedValue([]),
  },
  syncQueueDB: {
    getAll: vi.fn().mockResolvedValue([]),
  },
}));

// Mock Zustand store
vi.mock('./store', () => ({
  useCaseStore: {
    getState: vi.fn(),
  },
}));

// Mock clinicalDataService to isolate passcode requirement
vi.mock('./clinicalDataService', () => ({
  getEncryptionPasscode: vi.fn(),
  restoreDataFromDB: vi.fn().mockResolvedValue(true),
  clearAllLocalData: vi.fn().mockResolvedValue(undefined),
}));

// Mock encryptionService to simulate decryption validation
vi.mock('./encryptionService', () => ({
  decryptData: vi.fn(),
}));

describe('DataManagementService (Disaster Recovery Simulation)', () => {
  const mockPasscode = 'recovery-passcode';
  const mockCases = [{ id: 'c1', encryptedData: 'enc-c1' }];
  const mockTasks = [{ id: 't1', encryptedData: 'enc-t1' }];

  beforeEach(() => {
    vi.clearAllMocks();

    // Default store state mock
    (useCaseStore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
      loadCases: vi.fn(),
      loadTasks: vi.fn(),
      setPendingSyncCount: vi.fn(),
      setLastSyncAt: vi.fn(),
    });
  });

  describe('buildBackup', () => {
    it('should generate a valid versioned backup using wrapper APIs', async () => {
      vi.mocked(casesDB.getAll).mockResolvedValue(mockCases as any);
      vi.mocked(tasksDB.getAll).mockResolvedValue(mockTasks as any);
      vi.mocked(drugsDB.getAll).mockResolvedValue([]);
      vi.mocked(syncQueueDB.getAll).mockResolvedValue([]);

      const backup = await buildBackup();

      expect(backup.version).toBe(1);
      expect(backup.cases).toEqual(mockCases);
      expect(backup.tasks).toEqual(mockTasks);
      expect(backup.exportedAt).toBeDefined();
      expect(casesDB.getAll).toHaveBeenCalled();
      expect(tasksDB.getAll).toHaveBeenCalled();
    });
  });

  describe('importBackup', () => {
    it('should restore data and self-hydrate via restoreDataFromDB', async () => {
      const mockBackup = {
        version: 1,
        exportedAt: new Date().toISOString(),
        cases: mockCases,
        tasks: mockTasks,
        drugs: [],
        syncQueue: [],
      };

      const file = new File([JSON.stringify(mockBackup)], 'backup.json', {
        type: 'application/json',
      });
      vi.mocked(getEncryptionPasscode).mockResolvedValue(mockPasscode);
      vi.mocked(decryptData).mockResolvedValue({}); // Simulate successful decryption check

      await importBackup(file);

      expect(decryptData).toHaveBeenCalledTimes(2); // One for each case and task
      expect(db.cases.bulkPut).toHaveBeenCalledWith(mockCases);
      expect(db.tasks.bulkPut).toHaveBeenCalledWith(mockTasks);
      // Self-hydration: restoreDataFromDB called after import
      expect(restoreDataFromDB).toHaveBeenCalledWith({
        passcode: mockPasscode,
        allowLocked: true,
      });
    });

    it('should reject backup if decryption fails with current passcode', async () => {
      const mockBackup = {
        version: 1,
        cases: mockCases,
        tasks: [],
      };

      const file = new File([JSON.stringify(mockBackup)], 'backup.json', {
        type: 'application/json',
      });
      vi.mocked(getEncryptionPasscode).mockResolvedValue(mockPasscode);
      vi.mocked(decryptData).mockRejectedValue(new Error('Decryption failed'));

      await expect(importBackup(file)).rejects.toThrow(
        'Backup cannot be decrypted with the current passcode'
      );
    });

    it('should throw error for unsupported backup versions or corrupted files', async () => {
      const invalidBackup = { version: 2, data: 'invalid' };
      const file = new File([JSON.stringify(invalidBackup)], 'backup.json', {
        type: 'application/json',
      });

      await expect(importBackup(file)).rejects.toThrow('Unsupported or invalid backup file');
    });
  });

  describe('clearLocalData', () => {
    it('should delegate to clearAllLocalData from clinicalDataService', async () => {
      await clearLocalData();
      expect(clearAllLocalData).toHaveBeenCalled();
    });
  });
});
