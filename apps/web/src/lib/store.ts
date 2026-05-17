/**
 * Zustand global state store
 * Manages cases, tasks, drugs, sync state, and auth
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ClinicalCase, ClinicalTask, DrugReference } from './mockData';
import type { SyncStatus } from './syncService';

export type LockReason =
  | 'missing_passcode'
  | 'passcode_mismatch'
  | 'lockout'
  | 'inactivity'
  | 'tab_close'
  | 'explicit'
  | 'logout'
  | 'snapshot_rejected';

export interface CaseStore {
  // Cases
  cases: ClinicalCase[];
  loadCases: (cases: ClinicalCase[]) => void;
  getCase: (id: string) => ClinicalCase | undefined;

  // Tasks
  tasks: ClinicalTask[];
  loadTasks: (tasks: ClinicalTask[]) => void;
  getTasksByCase: (caseId: string) => ClinicalTask[];

  // Drugs
  drugs: DrugReference[];
  loadDrugs: (drugs: DrugReference[]) => void;

  // Sync
  syncStatus: SyncStatus;
  setSyncStatus: (status: SyncStatus) => void;
  pendingSyncCount: number;
  setPendingSyncCount: (count: number) => void;
  lastSyncAt: string | null;
  setLastSyncAt: (time: string) => void;

  // Auth (for backend sync)
  authToken: string | null;
  setAuthToken: (token: string | null) => void;
  userId: string | null;
  setUserId: (id: string | null) => void;
  userName: string | null;
  setUserName: (name: string | null) => void;
  userEmail: string | null;
  setUserEmail: (email: string | null) => void;

  // Encryption passcode (optional, stored in memory only, not persisted)
  encryptionPasscode: string | null;
  setEncryptionPasscode: (passcode: string | null) => void;

  // UI state
  authStatus: 'idle' | 'hydrating' | 'ready' | 'error';
  dataStatus: 'idle' | 'restoring' | 'ready' | 'error';
  setAuthStatus: (status: 'idle' | 'hydrating' | 'ready' | 'error') => void;
  setDataStatus: (status: 'idle' | 'restoring' | 'ready' | 'error') => void;
  initError: string | null;
  setInitError: (error: string | null) => void;

  // Security Lockout
  isLocked: boolean;
  lockReason: LockReason | null;
  lockApp: (reason?: LockReason) => void;
  unlockApp: () => void;
  decryptionFailureCount: number;
  incrementFailureCount: () => void;
  resetFailureCount: () => void;
}

const DEFAULT_SYNC_STATUS: SyncStatus = 'idle';

export const useCaseStore = create<CaseStore>()(
  persist(
    (set, get) => ({
      // Cases
      cases: [] as ClinicalCase[],
      loadCases: (cases: ClinicalCase[]) => set({ cases }),
      getCase: (id: string) => get().cases.find((c) => c.id === id),

      // Tasks
      tasks: [] as ClinicalTask[],
      loadTasks: (tasks: ClinicalTask[]) => set({ tasks }),
      getTasksByCase: (caseId: string) => get().tasks.filter((t) => t.caseId === caseId),

      // Drugs
      drugs: [] as DrugReference[],
      loadDrugs: (drugs: DrugReference[]) => set({ drugs }),

      // Sync
      syncStatus: DEFAULT_SYNC_STATUS,
      setSyncStatus: (status: SyncStatus) => set({ syncStatus: status }),
      pendingSyncCount: 0,
      setPendingSyncCount: (count: number) => set({ pendingSyncCount: count }),
      lastSyncAt: null,
      setLastSyncAt: (time: string) => set({ lastSyncAt: time }),

      // Auth
      authToken: null,
      setAuthToken: (token) => set({ authToken: token }),
      userId: null,
      setUserId: (id) => set({ userId: id }),
      userName: null,
      setUserName: (name) => set({ userName: name }),
      userEmail: null,
      setUserEmail: (email) => set({ userEmail: email }),

      // Encryption
      encryptionPasscode: null,
      setEncryptionPasscode: (passcode) => set({ encryptionPasscode: passcode }),

      // UI
      authStatus: 'idle',
      dataStatus: 'idle',
      setAuthStatus: (status) => set({ authStatus: status }),
      setDataStatus: (status) => set({ dataStatus: status }),
      initError: null,
      setInitError: (error) => set({ initError: error }),

      // Security
      isLocked: false,
      lockReason: null,
      lockApp: (reason = 'explicit') =>
        set({
          cases: [],
          tasks: [],
          encryptionPasscode: null,
          isLocked: true,
          lockReason: reason,
          dataStatus: 'idle',
        }),
      unlockApp: () =>
        set({
          isLocked: false,
          lockReason: null,
          initError: null,
          decryptionFailureCount: 0,
        }),
      decryptionFailureCount: 0,
      incrementFailureCount: () =>
        set((state) => ({ decryptionFailureCount: state.decryptionFailureCount + 1 })),
      resetFailureCount: () => set({ decryptionFailureCount: 0 }),
    }),
    {
      name: 'cwc-store',
      partialize: (state) => ({
        authToken: state.authToken,
        userId: state.userId,
        userName: state.userName,
        userEmail: state.userEmail,
        lastSyncAt: state.lastSyncAt,
        isLocked: state.isLocked,
        lockReason: state.lockReason,
        decryptionFailureCount: state.decryptionFailureCount,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setAuthStatus('ready');
      },
    }
  )
);
