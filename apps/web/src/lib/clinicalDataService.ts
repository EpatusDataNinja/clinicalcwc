/**
 * Clinical Data Service
 * Handles case/task CRUD with encryption, persistence, and sync queueing
 */

import { encryptData, decryptData } from './encryptionService';
import { casesDB, tasksDB, db, type EncryptedCaseRecord, type EncryptedTaskRecord, enqueueChange } from './localDB';
import { useCaseStore } from './store';
import { telemetry } from './telemetryService';
import { mockCases, mockTasks, type ClinicalCase, type ClinicalTask } from './mockData';

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
  // After login, the server is the source of truth.
  // Always clear local data and replace with the server's snapshot, even if empty.
  await casesDB.clear();
  await tasksDB.clear();
  await casesDB.upsertMany(input.cases);
  await tasksDB.upsertMany(input.tasks);

  // If the pulled snapshot is empty (new account), force a re-seed of mock data
  if (input.cases.length === 0) {
    await seedClinicalData(mockCases, mockTasks);
  }

  useCaseStore.getState().setDataStatus('idle');
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

  await telemetry.trace('db_restoration', 'db', async () => {
    store.setDataStatus('restoring');

    // Restore cases
    const caseRecords = await casesDB.getAll();
    const decryptedCases = (await Promise.all(
      caseRecords.map(r => decryptCase(r, passcode))
    )).filter((c): c is ClinicalCase => !!c);
    store.loadCases(decryptedCases);

    // Restore tasks
    const taskRecords = await tasksDB.getAll();
    const decryptedTasks = (await Promise.all(
      taskRecords.map(r => decryptTask(r, passcode))
    )).filter((t): t is ClinicalTask => !!t);
    store.loadTasks(decryptedTasks);

    store.setDataStatus('ready');
  }, {
    caseCount: (await casesDB.getAll()).length,
    taskCount: (await tasksDB.getAll()).length
  }).catch(err => {
    store.setDataStatus('error');
    store.setInitError('Failed to restore clinical data from local storage.');
    throw err;
  });
}
/**
 * Seed database with mock cases and tasks (encrypted)
 * Hardened: Checks status guards and enforces relational order.
 */
export async function seedClinicalData(cases: ClinicalCase[], tasks: ClinicalTask[]): Promise<void> {
  const CLINICAL_DATA_VERSION = 2; // Bumped to 2 to ensure analytics data is re-seeded
  const store = useCaseStore.getState();

  const passcode = await getEncryptionPasscode();
  await telemetry.trace('clinical_seeding_internal', 'db', async () => {
    const config = await db.appConfig.get('clinical_data_version');
    const currentVersion = config ? config.value : 0;

    // Check if existing data is decryptable with current passcode
    const existingRecords = await casesDB.getAll();
    if (existingRecords.length > 0) {
      const isDecryptable = await decryptCase(existingRecords[0], passcode);

      if (!isDecryptable) {
        console.warn('[DB] Existing data encrypted with a different key. Clearing for re-seed...');
        await casesDB.clear();
        await tasksDB.clear();
      } else if (currentVersion >= CLINICAL_DATA_VERSION) {
        // Data is fine and version is current
        return;
      }
    } else {
      // No records, but check version to avoid unnecessary seeding
      if (currentVersion >= CLINICAL_DATA_VERSION && !store.authToken) {
        return;
      }
    }

    console.log(`[DB] Seeding clinical data (v${currentVersion} -> v${CLINICAL_DATA_VERSION})...`);

    // 1. Seed Cases First (Required for Task Relational Integrity)
    const encryptedCases: EncryptedCaseRecord[] = [];
    for (const c of cases) {
      const encryptedData = await encryptData(c, passcode);
      encryptedCases.push({
        id: c.id,
        encryptedData,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      });
    }
    await casesDB.upsertMany(encryptedCases);

    // 2. Seed Tasks (Will be checked against cases by upsertMany)
    const encryptedTasks: EncryptedTaskRecord[] = [];
    for (const t of tasks) {
      const encryptedData = await encryptData(t, passcode);
      encryptedTasks.push({
        id: t.id,
        caseId: t.caseId,
        encryptedData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    await tasksDB.upsertMany(encryptedTasks);

    await db.appConfig.put({ key: 'clinical_data_version', value: CLINICAL_DATA_VERSION });
  });
}
