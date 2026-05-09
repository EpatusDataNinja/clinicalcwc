/**
 * Zustand global state store
 * Manages cases, tasks, drugs, sync state, and auth
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ClinicalCase, ClinicalTask, DrugReference } from './mockData';
import type { SyncStatus } from './syncService';

export interface CaseStore {
  // Cases
  cases: ClinicalCase[];
  addCase: (caseData: Omit<ClinicalCase, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateCase: (id: string, data: Partial<ClinicalCase>) => Promise<void>;
  deleteCase: (id: string) => Promise<void>;
  loadCases: (cases: ClinicalCase[]) => void; // New action
  getCase: (id: string) => ClinicalCase | undefined;

  // Tasks
  tasks: ClinicalTask[];
  addTask: (taskData: Omit<ClinicalTask, 'id'>) => Promise<string>;
  updateTask: (id: string, data: Partial<ClinicalTask>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  loadTasks: (tasks: ClinicalTask[]) => void; // New action
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
  isInitialized: boolean;
  setIsInitialized: (val: boolean) => void;
}

const DEFAULT_SYNC_STATUS: SyncStatus = 'idle';

export const useCaseStore = create<CaseStore>()(
  persist(
    (set, get) => ({
      // Cases
      cases: [],
      addCase: async (caseData) => {
        const id = `case-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        const now = new Date().toISOString();
        const newCase: ClinicalCase = {
          ...caseData,
          id,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ cases: [newCase, ...state.cases] }));
        return id;
      },
      updateCase: async (id, data) => {
        set((state) => ({
          cases: state.cases.map((c) =>
            c.id === id ? { ...c, ...data, updatedAt: new Date().toISOString() } : c
          ),
        }));
      },
      deleteCase: async (id) => {
        set((state) => ({
          cases: state.cases.filter((c) => c.id !== id),
          tasks: state.tasks.filter((t) => t.caseId !== id),
        }));
      },
      loadCases: (cases) => set({ cases }), // Implementation for new action

      getCase: (id) => get().cases.find((c) => c.id === id),

      // Tasks
      tasks: [],
      addTask: async (taskData) => {
        const id = `task-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        const newTask: ClinicalTask = {
          ...taskData,
          id,
        };
        set((state) => ({ tasks: [newTask, ...state.tasks] }));
        return id;
      },
      updateTask: async (id, data) => {
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...data } : t)),
        }));
      },
      deleteTask: async (id) => {
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        }));
      },
      loadTasks: (tasks) => set({ tasks }), // Implementation for new action

      getTasksByCase: (caseId) => get().tasks.filter((t) => t.caseId === caseId),

      // Drugs
      drugs: [],
      loadDrugs: (drugs) => set({ drugs }),

      // Sync
      syncStatus: DEFAULT_SYNC_STATUS,
      setSyncStatus: (status) => set({ syncStatus: status }),
      pendingSyncCount: 0,
      setPendingSyncCount: (count) => set({ pendingSyncCount: count }),
      lastSyncAt: null,
      setLastSyncAt: (time) => set({ lastSyncAt: time }),

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
      isInitialized: false,
      setIsInitialized: (val) => set({ isInitialized: val }),
    }),
    {
      name: 'cwc-store',
      partialize: (state) => ({
        cases: state.cases,
        tasks: state.tasks,
        drugs: state.drugs,
        authToken: state.authToken,
        userId: state.userId,
        userName: state.userName,
        userEmail: state.userEmail,
        lastSyncAt: state.lastSyncAt,
      }),
    }
  )
);
