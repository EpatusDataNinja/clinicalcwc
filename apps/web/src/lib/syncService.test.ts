/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getPendingCount, runSync, pullRemoteSnapshot } from './syncService';
import {
  syncQueueDB,
  casesDB,
  tasksDB,
  type SyncQueueItem,
  type EncryptedCaseRecord,
} from './localDB';
import { useCaseStore } from './store';
import { restoreEncryptedRecords } from './clinicalDataService';

// Mock localDB to control the sync queue and state
vi.mock('./localDB', () => ({
  syncQueueDB: {
    getPending: vi.fn(),
    markSynced: vi.fn(),
    incrementRetry: vi.fn(),
  },
  casesDB: {
    getAll: vi.fn(),
  },
  tasksDB: {
    getAll: vi.fn(),
  },
  db: {
    appConfig: {
      get: vi.fn(),
    },
  },
}));

// Mock clinicalDataService to isolate sync logic from encryption/DB restoration
vi.mock('./clinicalDataService', () => ({
  restoreEncryptedRecords: vi.fn(),
  getEncryptionPasscode: vi.fn(),
  lockClinicalData: vi.fn(),
}));

describe('SyncService', () => {
  const mockToken = 'test-jwt-token';

  beforeEach(() => {
    vi.resetAllMocks();

    // Mock global fetch
    global.fetch = vi.fn();

    // Mock store state
    useCaseStore.setState({
      authToken: mockToken,
      lastSyncAt: null,
      syncStatus: 'idle',
      pendingSyncCount: 0,
    });

    // Default navigator.onLine to true via global stub
    vi.stubGlobal('navigator', { onLine: true });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('runSync', () => {
    it('should process pending items and mark them as synced on success (200 OK)', async () => {
      const mockItems = [
        { id: 1, entityId: 'c1', type: 'create', entity: 'case', payload: {}, retryCount: 0 },
      ];

      vi.mocked(syncQueueDB.getPending).mockResolvedValue(mockItems as unknown as SyncQueueItem[]);
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true }),
      } as Response);

      const result = await runSync(mockToken);

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(syncQueueDB.markSynced).toHaveBeenCalledWith(1);
      expect(result.synced).toBe(1);
      expect(result.status).toBe('success');
    });

    it('should increment retry count on HTTP 500 errors', async () => {
      const mockItems = [
        { id: 1, entityId: 'c1', type: 'create', entity: 'case', payload: {}, retryCount: 0 },
      ];

      vi.mocked(syncQueueDB.getPending).mockResolvedValue(mockItems as any);
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Internal Server Error' }),
      } as Response);

      const result = await runSync(mockToken);

      expect(syncQueueDB.incrementRetry).toHaveBeenCalledWith(1);
      expect(syncQueueDB.markSynced).not.toHaveBeenCalled();
      expect(result.failed).toBe(1);
      expect(result.status).toBe('error');
    });

    it('should increment retry count on HTTP 429 Rate Limit', async () => {
      const mockItems = [
        { id: 1, entityId: 'c1', type: 'update', entity: 'task', payload: {}, retryCount: 0 },
      ];
      vi.mocked(syncQueueDB.getPending).mockResolvedValue(mockItems as any);

      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 429,
        json: () => Promise.resolve({ error: 'Too many requests' }),
      } as Response);

      const result = await runSync(mockToken);

      expect(syncQueueDB.incrementRetry).toHaveBeenCalledWith(1);
      expect(result.status).toBe('error');
    });

    it('should handle network failures and enter offline mode correctly', async () => {
      vi.stubGlobal('navigator', { onLine: false });

      const result = await runSync(mockToken);

      expect(result.status).toBe('offline');
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should skip items that have reached the MAX_RETRIES (3) threshold', async () => {
      const mockItems = [
        { id: 1, entityId: 'c1', type: 'create', entity: 'case', payload: {}, retryCount: 3 },
      ];

      vi.mocked(syncQueueDB.getPending).mockResolvedValue(mockItems as any);

      const result = await runSync(mockToken);

      expect(global.fetch).not.toHaveBeenCalled();
      expect(result.status).toBe('idle');
    });

    it('should fail pending items without a token and avoid remote writes', async () => {
      const mockItems = [
        { id: 1, entityId: 'c1', type: 'delete', entity: 'case', payload: {}, retryCount: 0 },
      ];

      vi.mocked(syncQueueDB.getPending).mockResolvedValue(mockItems as any);

      const result = await runSync();

      expect(global.fetch).not.toHaveBeenCalled();
      expect(result.status).toBe('error');
      expect(result.failed).toBe(1);
    });

    it('should classify fetch failures as network sync failures', async () => {
      const mockItems = [
        { id: 1, entityId: 'c1', type: 'create', entity: 'case', payload: {}, retryCount: 0 },
      ];

      vi.mocked(syncQueueDB.getPending).mockResolvedValue(mockItems as any);
      vi.mocked(global.fetch).mockRejectedValue(new Error('offline'));

      const result = await runSync(mockToken);

      expect(syncQueueDB.incrementRetry).toHaveBeenCalledWith(1);
      expect(result.reason).toBe('network');
    });
  });

  describe('pullRemoteSnapshot', () => {
    it('should report offline when snapshot recovery is requested without network', async () => {
      vi.stubGlobal('navigator', { onLine: false });

      const result = await pullRemoteSnapshot(mockToken, { force: true });

      expect(result.status).toBe('offline');
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should skip pull if local data is present and force is not set', async () => {
      vi.mocked(casesDB.getAll).mockResolvedValue([
        { id: 'existing' } as unknown as EncryptedCaseRecord,
      ]);
      vi.mocked(tasksDB.getAll).mockResolvedValue([]);

      const result = await pullRemoteSnapshot(mockToken);

      expect(result.reason).toBe('local_data_present');
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should successfully pull and restore snapshot', async () => {
      vi.mocked(casesDB.getAll).mockResolvedValue([]);
      vi.mocked(tasksDB.getAll).mockResolvedValue([]);
      vi.mocked(restoreEncryptedRecords).mockResolvedValue(true);

      const mockSnapshot = { cases: [{ id: 'rc1' }], tasks: [] };
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSnapshot),
      } as Response);

      const result = await pullRemoteSnapshot(mockToken);

      expect(result.status).toBe('success');
      expect(result.synced).toBe(1);
      expect(restoreEncryptedRecords).toHaveBeenCalledWith(mockSnapshot);
    });

    it('should return a server failure when snapshot fetch is rejected by the API', async () => {
      vi.mocked(casesDB.getAll).mockResolvedValue([]);
      vi.mocked(tasksDB.getAll).mockResolvedValue([]);
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'server' }),
      } as Response);

      const result = await pullRemoteSnapshot(mockToken);

      expect(result.status).toBe('error');
      expect(result.reason).toBe('server');
    });

    it('should reject snapshots that cannot be restored with the current passcode', async () => {
      vi.mocked(casesDB.getAll).mockResolvedValue([]);
      vi.mocked(tasksDB.getAll).mockResolvedValue([]);
      vi.mocked(restoreEncryptedRecords).mockResolvedValue(false);
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ cases: [{ id: 'bad' }], tasks: [] }),
      } as Response);

      const result = await pullRemoteSnapshot(mockToken, { force: true });

      expect(result.status).toBe('error');
      expect(result.reason).toBe('snapshot_rejected');
    });

    it('should classify snapshot fetch exceptions as network failures', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      vi.mocked(casesDB.getAll).mockResolvedValue([]);
      vi.mocked(tasksDB.getAll).mockResolvedValue([]);
      vi.mocked(global.fetch).mockRejectedValue(new Error('network down'));

      const result = await pullRemoteSnapshot(mockToken, { force: true });

      expect(result.status).toBe('error');
      expect(result.reason).toBe('network');
      warnSpy.mockRestore();
    });
  });

  describe('getPendingCount', () => {
    it('should return the pending sync queue length in the browser', async () => {
      vi.mocked(syncQueueDB.getPending).mockResolvedValue([
        { id: 1 },
        { id: 2 },
      ] as unknown as SyncQueueItem[]);

      await expect(getPendingCount()).resolves.toBe(2);
    });
  });
});
