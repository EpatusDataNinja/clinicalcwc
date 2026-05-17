/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { encryptData } from './encryptionService';
import { buildBackup, importBackup, clearLocalData } from './dataManagementService';
import { db } from './localDB';
import { useCaseStore } from './store';
import { getEncryptionPasscode } from './clinicalDataService';

// We mock the database tables and store to isolate storage side-effects,
// but we DO NOT mock encryptionService. This ensures we use real Web Crypto logic.
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
  casesDB: { getAll: vi.fn() },
  tasksDB: { getAll: vi.fn() },
  drugsDB: { getAll: vi.fn() },
  syncQueueDB: { getAll: vi.fn() },
}));

vi.mock('./store', () => ({
  useCaseStore: {
    getState: vi.fn(),
  },
}));

// Mock clinicalDataService to isolate passcode and prevent recursive loops
vi.mock('./clinicalDataService', () => ({
  getEncryptionPasscode: vi.fn(),
  restoreDataFromDB: vi.fn().mockResolvedValue(true),
  clearAllLocalData: vi.fn().mockResolvedValue(undefined),
}));

describe('Disaster Recovery (Cryptographic Integration)', () => {
  const REAL_PASSCODE = 'physician-strong-passcode-2024';

  // Realistic clinical data structure
  const originalCaseData = {
    patientAlias: 'Integration-Test-Patient',
    chiefComplaint: 'Verification of end-to-end encryption recovery',
    status: 'active',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup store mock for clearLocalData logic
    (useCaseStore.getState as any).mockReturnValue({
      loadCases: vi.fn(),
      loadTasks: vi.fn(),
      setPendingSyncCount: vi.fn(),
      setLastSyncAt: vi.fn(),
    });
  });

  it('should successfully complete a "Real Encryption -> Backup -> Wipe -> Restore -> Decrypt" cycle', async () => {
    // 1. Setup: Create real encrypted records as they would exist in IndexedDB
    const encryptedCaseBlob = await encryptData(originalCaseData, REAL_PASSCODE);
    const mockRecord = {
      id: 'case-integration-1',
      encryptedData: encryptedCaseBlob,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Mock DB behavior to return these "real" encrypted records
    const { casesDB, tasksDB, drugsDB, syncQueueDB } = await import('./localDB');
    (casesDB.getAll as any).mockResolvedValue([mockRecord]);
    (tasksDB.getAll as any).mockResolvedValue([]);
    (drugsDB.getAll as any).mockResolvedValue([]);
    (syncQueueDB.getAll as any).mockResolvedValue([]);
    (db.cases.bulkPut as any).mockResolvedValue(undefined);

    // 2. Build Backup (This packages the real encrypted strings)
    const backup = await buildBackup();
    expect(backup.cases[0].encryptedData).toBe(encryptedCaseBlob);

    // 3. Clear Local Data (Simulate "Fresh Device" state)
    const { clearAllLocalData } = await import('./clinicalDataService');
    await clearLocalData();
    expect(clearAllLocalData).toHaveBeenCalled();

    // 4. Restore (This is the critical step: it uses REAL decryptData to validate the backup)
    const backupFile = new File([JSON.stringify(backup)], 'clinical-backup.json', {
      type: 'application/json',
    });
    (getEncryptionPasscode as any).mockResolvedValue(REAL_PASSCODE);

    // This call will fail internally if the encryption/decryption logic is mismatched
    await expect(importBackup(backupFile)).resolves.not.toThrow();

    // 5. Final Verification: Ensure the DB write occurred with the original valid encrypted blobs
    expect(db.cases.bulkPut).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ id: 'case-integration-1', encryptedData: encryptedCaseBlob }),
      ])
    );
  });
});
