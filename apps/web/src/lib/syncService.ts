/**
 * Sync Service - queues local changes and syncs when online.
 * Local encrypted data remains source of truth; remote snapshots are recovery input.
 */

import { casesDB, syncQueueDB, tasksDB, type SyncQueueItem } from './localDB';
import { useCaseStore } from './store';
import { restoreEncryptedRecords } from './clinicalDataService';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
const MAX_RETRIES = 3;

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error' | 'offline';
export type SyncFailureReason =
  | 'key_mismatch'
  | 'snapshot_rejected'
  | 'network'
  | 'server'
  | 'local_data_present';

export interface SyncResult {
  status: SyncStatus;
  synced: number;
  failed: number;
  lastSyncAt: string | null;
  reason?: SyncFailureReason;
}

async function syncItem(
  item: SyncQueueItem,
  token?: string
): Promise<{ ok: boolean; reason?: SyncFailureReason }> {
  try {
    const endpoint = `${API_BASE}/api/sync/${item.entity}`;
    const res = await fetch(endpoint, {
      method: item.type === 'delete' ? 'DELETE' : item.type === 'create' ? 'POST' : 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ entityId: item.entityId, payload: item.payload }),
    });

    return { ok: res.ok, reason: res.ok ? undefined : 'server' };
  } catch {
    return { ok: false, reason: 'network' };
  }
}

async function getLocalClinicalRecordCount(): Promise<number> {
  const [cases, tasks] = await Promise.all([casesDB.getAll(), tasksDB.getAll()]);
  return cases.length + tasks.length;
}

export async function runSync(token?: string): Promise<SyncResult> {
  if (typeof window === 'undefined' || !navigator.onLine) {
    const lastSync = useCaseStore.getState().lastSyncAt;
    return { status: 'offline', synced: 0, failed: 0, lastSyncAt: lastSync };
  }

  const pending = await syncQueueDB.getPending();
  const toSync = pending.filter((item) => item.retryCount < MAX_RETRIES);

  if (toSync.length === 0) {
    const lastSync = useCaseStore.getState().lastSyncAt;
    return { status: 'idle', synced: 0, failed: 0, lastSyncAt: lastSync };
  }

  let synced = 0;
  let failed = 0;
  let failureReason: SyncFailureReason | undefined;

  for (const item of toSync) {
    if (token) {
      const result = await syncItem(item, token);
      if (result.ok && item.id) {
        await syncQueueDB.markSynced(item.id);
        synced += 1;
      } else if (item.id) {
        await syncQueueDB.incrementRetry(item.id);
        failureReason = result.reason;
        failed += 1;
      }
    } else {
      failed += 1;
    }
  }

  const now = new Date().toISOString();
  if (synced > 0) {
    useCaseStore.getState().setLastSyncAt(now);
  }

  useCaseStore.getState().setPendingSyncCount(toSync.length - synced);

  return {
    status: failed === 0 ? 'success' : synced > 0 ? 'success' : 'error',
    synced,
    failed,
    lastSyncAt: useCaseStore.getState().lastSyncAt,
    reason: failureReason,
  };
}

export async function pullRemoteSnapshot(
  token: string,
  options?: { force?: boolean }
): Promise<SyncResult> {
  if (typeof window === 'undefined' || !navigator.onLine) {
    const lastSync = useCaseStore.getState().lastSyncAt;
    return { status: 'offline', synced: 0, failed: 0, lastSyncAt: lastSync };
  }

  try {
    const localRecordCount = await getLocalClinicalRecordCount();
    if (localRecordCount > 0 && !options?.force) {
      return {
        status: 'idle',
        synced: 0,
        failed: 0,
        lastSyncAt: useCaseStore.getState().lastSyncAt,
        reason: 'local_data_present',
      };
    }

    const lastSyncAt = useCaseStore.getState().lastSyncAt;
    const queryParams = lastSyncAt ? `?lastSyncAt=${encodeURIComponent(lastSyncAt)}` : '';
    const res = await fetch(`${API_BASE}/api/sync/snapshot${queryParams}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        status: 'error',
        synced: 0,
        failed: 1,
        lastSyncAt: useCaseStore.getState().lastSyncAt,
        reason: 'server',
      };
    }

    const restored = await restoreEncryptedRecords({
      cases: data.cases || [],
      tasks: data.tasks || [],
    });

    if (!restored) {
      return {
        status: 'error',
        synced: 0,
        failed: 1,
        lastSyncAt: useCaseStore.getState().lastSyncAt,
        reason: 'snapshot_rejected',
      };
    }

    const now = new Date().toISOString();
    useCaseStore.getState().setLastSyncAt(now);
    return {
      status: 'success',
      synced: (data.cases?.length || 0) + (data.tasks?.length || 0),
      failed: 0,
      lastSyncAt: now,
    };
  } catch (error) {
    console.warn('Pull sync failed:', error);
    return {
      status: 'error',
      synced: 0,
      failed: 1,
      lastSyncAt: useCaseStore.getState().lastSyncAt,
      reason: 'network',
    };
  }
}

export async function getPendingCount(): Promise<number> {
  if (typeof window === 'undefined') return 0;
  const pending = await syncQueueDB.getPending();
  return pending.length;
}
