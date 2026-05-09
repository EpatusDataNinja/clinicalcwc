/**
 * Sync Service — queues local changes and syncs when online.
 * Implements last-write-wins conflict strategy.
 * Backend stores encrypted blobs only.
 */

import { syncQueueDB, type SyncQueueItem } from './localDB';
import { useCaseStore } from './store';

const API_BASE = '';
const MAX_RETRIES = 3;

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error' | 'offline';

export interface SyncResult {
  status: SyncStatus;
  synced: number;
  failed: number;
  lastSyncAt: string | null;
}

async function syncItem(item: SyncQueueItem, token?: string): Promise<boolean> {
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
    return res.ok;
  } catch {
    return false;
  }
}

export async function runSync(token?: string): Promise<SyncResult> {
  if (typeof window === 'undefined' || !navigator.onLine) {
    const lastSync = useCaseStore.getState().lastSyncAt;
    return { status: 'offline', synced: 0, failed: 0, lastSyncAt: lastSync };
  }

  const pending = await syncQueueDB.getPending();
  const toSync = pending.filter((s) => s.retryCount < MAX_RETRIES);

  if (toSync.length === 0) {
    const lastSync = useCaseStore.getState().lastSyncAt;
    return { status: 'idle', synced: 0, failed: 0, lastSyncAt: lastSync };
  }

  let synced = 0;
  let failed = 0;

  for (const item of toSync) {
    if (token) {
      const ok = await syncItem(item, token);
      if (ok && item.id) {
        await syncQueueDB.markSynced(item.id);
        synced++;
      } else if (item.id) {
        await syncQueueDB.incrementRetry(item.id);
        failed++;
      }
    } else {
      // No token — mark as pending, will retry when user logs in
      failed++;
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
  };
}

export async function pullRemoteSnapshot(token: string): Promise<SyncResult> {
  if (typeof window === 'undefined' || !navigator.onLine) {
    const lastSync = useCaseStore.getState().lastSyncAt;
    return { status: 'offline', synced: 0, failed: 0, lastSyncAt: lastSync };
  }

  try {
    const res = await fetch(`${API_BASE}/api/sync/snapshot`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || 'Failed to pull remote snapshot');
    }

    const { restoreEncryptedRecords } = await import('./clinicalDataService');
    await restoreEncryptedRecords({
      cases: data.cases || [],
      tasks: data.tasks || [],
    });

    const now = new Date().toISOString();
    useCaseStore.getState().setLastSyncAt(now);
    return {
      status: 'success',
      synced: (data.cases?.length || 0) + (data.tasks?.length || 0),
      failed: 0,
      lastSyncAt: now,
    };
  } catch (error) {
    console.error('Pull sync failed:', error);
    return {
      status: 'error',
      synced: 0,
      failed: 1,
      lastSyncAt: useCaseStore.getState().lastSyncAt,
    };
  }
}

export function enqueueChange(
  entityId: string,
  type: SyncQueueItem['type'],
  entity: SyncQueueItem['entity'],
  payload: unknown
): void {
  syncQueueDB.enqueue({ entityId, type, entity, payload, synced: false, retryCount: 0 });
}

export async function getPendingCount(): Promise<number> {
  if (typeof window === 'undefined') return 0;
  const pending = await syncQueueDB.getPending();
  return pending.length;
}
