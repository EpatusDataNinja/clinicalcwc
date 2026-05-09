/**
 * Clinical Data Service
 * Handles case/task CRUD with encryption, persistence, and sync queueing
 */

import { encryptData, decryptData } from './encryptionService';
import { casesDB, tasksDB, type EncryptedCaseRecord, type EncryptedTaskRecord } from './localDB';
import { enqueueChange } from './syncService';
import { useCaseStore } from './store';
import type { ClinicalCase, ClinicalTask } from './mockData';

const ENCRYPTION_SALT_KEY = 'cwc_encryption_salt';
const DEVICE_KEY_STORAGE = 'cwc_device_passcode';

/**
 * Get encryption passcode from user (in-memory or from settings)
 * For now, returns a default or prompts user
 */
export async function getEncryptionPasscode(): Promise<string> {
  const store = useCaseStore.getState();
  let passcode = store.encryptionPasscode;

  if (!passcode && typeof window !== 'undefined') {
    passcode = window.localStorage.getItem(DEVICE_KEY_STORAGE);
  }

  if (!passcode && typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    passcode = `device-${crypto.randomUUID()}`;
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(DEVICE_KEY_STORAGE, passcode);
    }
  }

  if (!passcode) {
    passcode = 'device-key';
  }

  if (store.encryptionPasscode !== passcode) {
    store.setEncryptionPasscode(passcode);
  }

  return passcode;
}

async function refreshCaseTaskCounts(caseId: string): Promise<void> {
  const store = useCaseStore.getState();
  const tasks = store.getTasksByCase(caseId);
  const now = Date.now();
  await store.updateCase(caseId, {
    taskCount: tasks.length,
    overdueTaskCount: tasks.filter((task) => !task.completed && new Date(task.dueAt).getTime() < now).length,
  });
}

/**
 * Create a new clinical case with encryption and queueing
 */
export async function createCase(data: Omit<ClinicalCase, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const store = useCaseStore.getState();
  const caseId = await store.addCase(data);

  // In a real scenario, encrypt before storing
  // For now, store encrypted record in IndexedDB
  const passcode = await getEncryptionPasscode();

  try {
    const caseData: ClinicalCase = {
      ...data,
      id: caseId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const encryptedData = await encryptData(caseData, passcode);

    const record: EncryptedCaseRecord = {
      id: caseId,
      encryptedData,
      createdAt: caseData.createdAt,
      updatedAt: caseData.updatedAt,
    };

    await casesDB.upsert(record);

    // Queue for sync
    enqueueChange(caseId, 'create', 'case', record);
  } catch (error) {
    console.error('Failed to create case:', error);
    // Still return ID even if encryption fails - data is in store
  }

  return caseId;
}

/**
 * Update an existing case
 */
export async function updateCase(
  caseId: string,
  data: Partial<ClinicalCase>
): Promise<void> {
  const store = useCaseStore.getState();
  await store.updateCase(caseId, data);

  const passcode = await getEncryptionPasscode();

  try {
    const caseData = store.getCase(caseId);
    if (!caseData) return;

    const encryptedData = await encryptData(caseData, passcode);

    const record: EncryptedCaseRecord = {
      id: caseId,
      encryptedData,
      createdAt: caseData.createdAt,
      updatedAt: new Date().toISOString(),
    };

    await casesDB.upsert(record);

    // Queue for sync
    enqueueChange(caseId, 'update', 'case', record);
  } catch (error) {
    console.error('Failed to update case:', error);
  }
}

/**
 * Delete a case and all its tasks
 */
export async function deleteCase(caseId: string): Promise<void> {
  const store = useCaseStore.getState();
  const tasks = store.getTasksByCase(caseId);

  // Delete all tasks first
  for (const task of tasks) {
    await deleteTask(task.id);
  }

  await store.deleteCase(caseId);
  await casesDB.delete(caseId);

  // Queue deletion for sync
  enqueueChange(caseId, 'delete', 'case', { id: caseId });
}

/**
 * Create a new task linked to a case
 */
export async function createTask(
  data: Omit<ClinicalTask, 'id'>
): Promise<string> {
  const store = useCaseStore.getState();
  const taskId = await store.addTask(data);

  const passcode = await getEncryptionPasscode();

  try {
    const taskData: ClinicalTask = {
      ...data,
      id: taskId,
    };

    const encryptedData = await encryptData(taskData, passcode);

    const record: EncryptedTaskRecord = {
      id: taskId,
      caseId: data.caseId,
      encryptedData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await tasksDB.upsert(record);
    await refreshCaseTaskCounts(data.caseId);

    // Queue for sync
    enqueueChange(taskId, 'create', 'task', record);
  } catch (error) {
    console.error('Failed to create task:', error);
  }

  return taskId;
}

/**
 * Update an existing task
 */
export async function updateTask(
  taskId: string,
  data: Partial<ClinicalTask>
): Promise<void> {
  const store = useCaseStore.getState();
  await store.updateTask(taskId, data);

  const passcode = await getEncryptionPasscode();

  try {
    // Find the task to get full data
    const task = store.tasks.find((t) => t.id === taskId);
    if (!task) return;

    const encryptedData = await encryptData(task, passcode);

    const record: EncryptedTaskRecord = {
      id: taskId,
      caseId: task.caseId,
      encryptedData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await tasksDB.upsert(record);
    await refreshCaseTaskCounts(task.caseId);

    // Queue for sync
    enqueueChange(taskId, 'update', 'task', record);
  } catch (error) {
    console.error('Failed to update task:', error);
  }
}

/**
 * Delete a task
 */
export async function deleteTask(taskId: string): Promise<void> {
  const store = useCaseStore.getState();
  const task = store.tasks.find((t) => t.id === taskId);
  await store.deleteTask(taskId);
  await tasksDB.delete(taskId);
  if (task) {
    await refreshCaseTaskCounts(task.caseId);
  }

  // Queue for sync
  enqueueChange(taskId, 'delete', 'task', { id: taskId });
}

/**
 * Decrypt a case record (for restoration from IndexedDB)
 */
export async function decryptCase(
  record: EncryptedCaseRecord,
  passcode: string
): Promise<ClinicalCase | null> {
  try {
    return await decryptData<ClinicalCase>(record.encryptedData, passcode);
  } catch (error) {
    console.error('Failed to decrypt case:', error);
    return null;
  }
}

export async function restoreEncryptedRecords(input: {
  cases: EncryptedCaseRecord[];
  tasks: EncryptedTaskRecord[];
}): Promise<void> {
  await casesDB.clear();
  await tasksDB.clear();
  for (const record of input.cases) {
    await casesDB.upsert(record);
  }
  await tasksDB.upsertMany(input.tasks);
  useCaseStore.getState().setIsInitialized(false);
  await restoreDataFromDB();
}

/**
 * Decrypt a task record
 */
export async function decryptTask(
  record: EncryptedTaskRecord,
  passcode: string
): Promise<ClinicalTask | null> {
  try {
    return await decryptData<ClinicalTask>(record.encryptedData, passcode);
  } catch (error) {
    console.error('Failed to decrypt task:', error);
    return null;
  }
}

/**
 * Restore all data from IndexedDB to store (on app init)
 */
export async function restoreDataFromDB(): Promise<void> {
  const store = useCaseStore.getState();
  const passcode = await getEncryptionPasscode();

  try {
    const decryptedCases: ClinicalCase[] = [];
    const decryptedTasks: ClinicalTask[] = [];

    // Restore cases
    const caseRecords = await casesDB.getAll();
    for (const record of caseRecords) {
      const caseData = await decryptCase(record, passcode);
      if (caseData) {
        decryptedCases.push(caseData);
      }
    }
    store.loadCases(decryptedCases);

    // Restore tasks
    const taskRecords = await tasksDB.getAll();
    for (const record of taskRecords) {
      const taskData = await decryptTask(record, passcode);
      if (taskData) {
        decryptedTasks.push(taskData);
      }
    }
    store.loadTasks(decryptedTasks);

    store.setIsInitialized(true);
  } catch (error) {
    console.error('Failed to restore data from DB:', error);
  }
}
