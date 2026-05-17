/**
 * Clinical Data Service
 * Single authority for all case/task/drug CRUD operations.
 *
 * Architecture: UI → this service → IndexedDB (Dexie) → Zustand Store (cache only)
 *
 * Rules:
 * - Only this file may create IDs, generate timestamps, encrypt/decrypt,
 *   write to IndexedDB, or enqueue sync events.
 * - Helpers (refreshCaseTaskCounts, internalUpdateCaseDB) must NEVER call restoreDataFromDB.
 * - One mutation = one restoreDataFromDB call (at the outer handler level only).
 */

import { decryptData, encryptData, isPortableEncryptedData } from './encryptionService';
import {
  casesDB,
  tasksDB,
  drugsDB,
  syncQueueDB,
  db,
  type EncryptedCaseRecord,
  type EncryptedTaskRecord,
  enqueueChange,
} from './localDB';
import { useCaseStore, type LockReason } from './store';
import { telemetry } from './telemetryService';
import {
  type ClinicalCase,
  type ClinicalTask,
  type DrugReference,
  mockCases,
  mockTasks,
} from './mockData';
import { config, setEnableSeedData } from './config';

const MAX_FAILURE_THRESHOLD = 3;
const BACKOFF_BASE_MS = 500;

type SecurityEventName =
  | 'passcode_mismatch'
  | 'lockout'
  | 'key_rotation_success'
  | 'snapshot_rejected';

const LOCK_MESSAGES: Record<LockReason, string> = {
  missing_passcode:
    'Enter your account password (encryption passcode) to unlock this clinical workspace.', // Already updated in context
  passcode_mismatch: 'Incorrect passcode. Please try again.',
  lockout: 'Security lockout: Too many failed decryption attempts. Please re-authenticate.',
  inactivity: 'Clinical data was locked after 15 minutes of inactivity.',
  tab_close: 'Clinical data was locked when the app session ended.',
  explicit: 'Clinical data is locked.',
  logout: 'You have signed out. Clinical data remains encrypted on this device.',
  snapshot_rejected:
    'Remote backup was rejected because it could not be decrypted with this passcode.',
};

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, ms);
  });
}

function logSecurityEvent(
  event: SecurityEventName,
  metadata?: Record<string, unknown>,
  status: 'success' | 'error' = 'error'
): Promise<void> {
  return telemetry.log({
    event,
    stage: 'security',
    status,
    metadata,
  });
}

export function lockClinicalData(
  reason: LockReason = 'explicit',
  message = LOCK_MESSAGES[reason]
): void {
  const store = useCaseStore.getState();
  store.setInitError(message);
  store.lockApp(reason);

  if (reason === 'lockout') {
    void logSecurityEvent('lockout', {
      reason,
      attemptCount: store.decryptionFailureCount,
    });
  }
}

export async function getEncryptionPasscode(): Promise<string> {
  const passcode = useCaseStore.getState().encryptionPasscode;

  if (!passcode) {
    lockClinicalData('missing_passcode');
    throw new Error('Encryption passcode required');
  }

  return passcode;
}

async function recordSecurityFailure(
  event: Extract<SecurityEventName, 'passcode_mismatch' | 'snapshot_rejected'>,
  reason: Extract<LockReason, 'passcode_mismatch' | 'snapshot_rejected'>,
  metadata: Record<string, unknown>
): Promise<void> {
  const store = useCaseStore.getState();
  store.incrementFailureCount();
  const attemptCount = useCaseStore.getState().decryptionFailureCount;

  await wait(attemptCount * BACKOFF_BASE_MS);
  await logSecurityEvent(event, {
    ...metadata,
    attemptCount,
    threshold: MAX_FAILURE_THRESHOLD,
    timestamp: new Date().toISOString(),
  });

  if (attemptCount >= MAX_FAILURE_THRESHOLD) {
    lockClinicalData('lockout');
    return;
  }

  lockClinicalData(reason);
}

async function validateCaseRecord(record: EncryptedCaseRecord, passcode: string): Promise<boolean> {
  try {
    await decryptData<ClinicalCase>(record.encryptedData, passcode);
    return true;
  } catch {
    return false;
  }
}

async function validateTaskRecord(record: EncryptedTaskRecord, passcode: string): Promise<boolean> {
  try {
    await decryptData<ClinicalTask>(record.encryptedData, passcode);
    return true;
  } catch {
    return false;
  }
}

async function validateEncryptedRecords(
  caseRecords: EncryptedCaseRecord[],
  taskRecords: EncryptedTaskRecord[],
  passcode: string
): Promise<boolean> {
  const caseResults = await Promise.all(
    caseRecords.map((record) => validateCaseRecord(record, passcode))
  );
  const taskResults = await Promise.all(
    taskRecords.map((record) => validateTaskRecord(record, passcode))
  );

  return [...caseResults, ...taskResults].every(Boolean);
}

/**
 * Internal DB-only update.
 * Bypasses store hydration to prevent recursive feedback loops.
 * MUST NOT call restoreDataFromDB — only outer mutation handlers may restore.
 */
async function internalUpdateCaseDB(caseId: string, data: Partial<ClinicalCase>): Promise<void> {
  const passcode = await getEncryptionPasscode();
  const record = await casesDB.getById(caseId);
  if (!record) return;

  const currentCase = await decryptData<ClinicalCase>(record.encryptedData, passcode);
  const updatedCase = { ...currentCase, ...data, updatedAt: new Date().toISOString() };

  const updatedRecord: EncryptedCaseRecord = {
    id: caseId,
    encryptedData: await encryptData(updatedCase, passcode),
    createdAt: updatedCase.createdAt,
    updatedAt: updatedCase.updatedAt,
  };

  await casesDB.upsert(updatedRecord);
  enqueueChange(caseId, 'update', 'case', updatedRecord);
}

/**
 * Recalculate task counts for a case from DB.
 * DB-only helper — performs one query, one calculation, one DB write.
 * MUST NOT call restoreDataFromDB — only outer mutation handlers may restore.
 */
async function refreshCaseTaskCounts(caseId: string): Promise<void> {
  const tasks = await tasksDB.getByCaseId(caseId);
  const now = Date.now();

  const passcode = await getEncryptionPasscode();
  const decryptedTasks = await Promise.all(
    tasks.map((t) => decryptData<ClinicalTask>(t.encryptedData, passcode))
  );

  await internalUpdateCaseDB(caseId, {
    taskCount: tasks.length,
    overdueTaskCount: decryptedTasks.filter(
      (task) => !task.completed && new Date(task.dueAt).getTime() < now
    ).length,
  });
}

export async function createCase(
  data: Omit<ClinicalCase, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const passcode = await getEncryptionPasscode();
  const id = `case-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const now = new Date().toISOString();
  const newCase: ClinicalCase = { ...data, id, createdAt: now, updatedAt: now };

  try {
    const record: EncryptedCaseRecord = {
      id,
      encryptedData: await encryptData(newCase, passcode),
      createdAt: now,
      updatedAt: now,
    };

    await casesDB.upsert(record);
    enqueueChange(id, 'create', 'case', record);
    await restoreDataFromDB({ passcode, allowLocked: true });
  } catch (error) {
    console.error('CRITICAL: Failed to persist encrypted case:', error);
    throw error;
  }

  return id;
}

export async function updateCase(caseId: string, data: Partial<ClinicalCase>): Promise<void> {
  await internalUpdateCaseDB(caseId, data);
  await restoreDataFromDB({ allowLocked: true });
}

export async function deleteCase(caseId: string): Promise<void> {
  const passcode = await getEncryptionPasscode();

  // Read tasks from DB (not store) to avoid stale cache
  const taskRecords = await tasksDB.getByCaseId(caseId);

  // Batch-delete all tasks directly — no recursive deleteTask() calls
  for (const taskRecord of taskRecords) {
    await tasksDB.delete(taskRecord.id);
    enqueueChange(taskRecord.id, 'delete', 'task', { id: taskRecord.id });
  }

  await casesDB.delete(caseId);
  enqueueChange(caseId, 'delete', 'case', { id: caseId });

  // Single restore at the end
  await restoreDataFromDB({ passcode, allowLocked: true });
}

export async function createTask(data: Omit<ClinicalTask, 'id'>): Promise<string> {
  const passcode = await getEncryptionPasscode();
  const id = `task-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const now = new Date().toISOString();

  // Service sets default dueAt if not provided
  const dueAt = data.dueAt || new Date(Date.now() + 3600000).toISOString();
  const newTask: ClinicalTask = { ...data, dueAt, id };

  try {
    const record: EncryptedTaskRecord = {
      id,
      caseId: data.caseId,
      encryptedData: await encryptData(newTask, passcode),
      createdAt: now,
      updatedAt: now,
    };

    await tasksDB.upsert(record);
    enqueueChange(id, 'create', 'task', record);
    await refreshCaseTaskCounts(data.caseId);

    // Single restore at the end
    await restoreDataFromDB({ passcode, allowLocked: true });
  } catch (error) {
    console.error('CRITICAL: Failed to persist encrypted task:', error);
    throw error;
  }

  return id;
}

export async function updateTask(taskId: string, data: Partial<ClinicalTask>): Promise<void> {
  const passcode = await getEncryptionPasscode();

  // Read current task from DB (not store) to avoid stale cache
  const existingRecords = await tasksDB.getAll();
  const existingRecord = existingRecords.find((r) => r.id === taskId);
  if (!existingRecord) throw new Error('Task not found');

  const current = await decryptData<ClinicalTask>(existingRecord.encryptedData, passcode);
  const updatedTask = { ...current, ...data };

  try {
    const now = new Date().toISOString();
    const record: EncryptedTaskRecord = {
      id: taskId,
      caseId: updatedTask.caseId,
      encryptedData: await encryptData(updatedTask, passcode),
      createdAt: existingRecord.createdAt,
      updatedAt: now,
    };

    await tasksDB.upsert(record);
    enqueueChange(taskId, 'update', 'task', record);
    await refreshCaseTaskCounts(updatedTask.caseId);

    // Single restore at the end
    await restoreDataFromDB({ passcode, allowLocked: true });
  } catch (error) {
    console.error('CRITICAL: Failed to update encrypted task:', error);
    throw error;
  }
}

export async function deleteTask(taskId: string): Promise<void> {
  const passcode = await getEncryptionPasscode();

  // Read task from DB (not store) to get caseId
  const allTasks = await tasksDB.getAll();
  const taskRecord = allTasks.find((r) => r.id === taskId);

  await tasksDB.delete(taskId);
  enqueueChange(taskId, 'delete', 'task', { id: taskId });

  if (taskRecord) {
    await refreshCaseTaskCounts(taskRecord.caseId);
  }

  // Single restore at the end
  await restoreDataFromDB({ passcode, allowLocked: true });
}

/**
 * Drug Reference CRUD
 *
 * DrugReference is intentionally excluded from sync because it is
 * local reference data, not patient-domain data.
 * Drug CRUD must NOT call enqueueChange().
 */
export async function createDrug(data: Omit<DrugReference, 'id'>): Promise<string> {
  const id = `drug-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
  const newDrug: DrugReference = { ...data, id };

  try {
    await drugsDB.upsert(newDrug);
    const drugs = await drugsDB.getAll();
    useCaseStore.getState().loadDrugs(drugs);
    return id;
  } catch (error) {
    console.error('Failed to persist drug:', error);
    throw error;
  }
}

export async function updateDrug(id: string, data: Partial<DrugReference>): Promise<void> {
  // Read current drug from DB (not store) to avoid stale cache
  const allDrugs = await drugsDB.getAll();
  const current = allDrugs.find((d) => d.id === id);
  if (!current) throw new Error('Drug not found');
  const updated = { ...current, ...data };

  await drugsDB.upsert(updated);
  const drugs = await drugsDB.getAll();
  useCaseStore.getState().loadDrugs(drugs);
}

export async function deleteDrugs(ids: string[]): Promise<void> {
  await drugsDB.bulkDelete(ids);
  const drugs = await drugsDB.getAll();
  useCaseStore.getState().loadDrugs(drugs);
}

export async function decryptCase(
  record: EncryptedCaseRecord,
  passcode: string,
  isIntegrityCheck = false
): Promise<ClinicalCase | null> {
  try {
    return await decryptData<ClinicalCase>(record.encryptedData, passcode);
  } catch {
    if (!isIntegrityCheck) {
      await recordSecurityFailure('passcode_mismatch', 'passcode_mismatch', {
        type: 'case',
        id: record.id,
      });
    }
    return null;
  }
}

export async function decryptTask(
  record: EncryptedTaskRecord,
  passcode: string,
  isIntegrityCheck = false
): Promise<ClinicalTask | null> {
  try {
    return await decryptData<ClinicalTask>(record.encryptedData, passcode);
  } catch {
    if (!isIntegrityCheck) {
      await recordSecurityFailure('passcode_mismatch', 'passcode_mismatch', {
        type: 'task',
        id: record.id,
      });
    }
    return null;
  }
}

async function migrateLegacyRecords(
  passcode: string,
  caseRecords: EncryptedCaseRecord[],
  decryptedCases: ClinicalCase[],
  taskRecords: EncryptedTaskRecord[],
  decryptedTasks: ClinicalTask[]
): Promise<void> {
  const caseUpdates: EncryptedCaseRecord[] = [];
  const taskUpdates: EncryptedTaskRecord[] = [];

  for (let index = 0; index < caseRecords.length; index += 1) {
    const record = caseRecords[index];
    const caseData = decryptedCases[index];
    if (record && caseData && !isPortableEncryptedData(record.encryptedData)) {
      caseUpdates.push({
        ...record,
        encryptedData: await encryptData(caseData, passcode),
        updatedAt: caseData.updatedAt,
      });
    }
  }

  for (let index = 0; index < taskRecords.length; index += 1) {
    const record = taskRecords[index];
    const task = decryptedTasks[index];
    if (record && task && !isPortableEncryptedData(record.encryptedData)) {
      taskUpdates.push({
        ...record,
        caseId: task.caseId,
        encryptedData: await encryptData(task, passcode),
        updatedAt: record.updatedAt || new Date().toISOString(),
      });
    }
  }

  if (caseUpdates.length > 0) {
    await casesDB.upsertMany(caseUpdates);
    caseUpdates.forEach((record) => enqueueChange(record.id, 'update', 'case', record));
  }

  if (taskUpdates.length > 0) {
    await tasksDB.upsertMany(taskUpdates);
    taskUpdates.forEach((record) => enqueueChange(record.id, 'update', 'task', record));
  }
}

export async function restoreEncryptedRecords(input: {
  cases: EncryptedCaseRecord[];
  tasks: EncryptedTaskRecord[];
}): Promise<boolean> {
  const passcode = await getEncryptionPasscode();
  const canDecryptSnapshot = await validateEncryptedRecords(input.cases, input.tasks, passcode);

  if (!canDecryptSnapshot) {
    await recordSecurityFailure('snapshot_rejected', 'snapshot_rejected', {
      caseCount: input.cases.length,
      taskCount: input.tasks.length,
    });
    return false;
  }

  await casesDB.upsertMany(input.cases);
  await tasksDB.upsertMany(input.tasks);
  useCaseStore.getState().setDataStatus('idle');
  return restoreDataFromDB({ passcode, allowLocked: true });
}

export async function rotateEncryptionPasscode(
  oldPasscode: string,
  newPasscode: string
): Promise<void> {
  const store = useCaseStore.getState();

  await telemetry.trace('key_rotation', 'db', async () => {
    const caseRecords = await casesDB.getAll();
    const taskRecords = await tasksDB.getAll();
    const cases = await Promise.all(
      caseRecords.map((record) => decryptCase(record, oldPasscode, true))
    );
    const tasks = await Promise.all(
      taskRecords.map((record) => decryptTask(record, oldPasscode, true))
    );

    if (cases.some((item) => !item) || tasks.some((item) => !item)) {
      throw new Error('Some records could not be decrypted with the old passcode.');
    }

    const now = new Date().toISOString();
    const newCaseRecords = await Promise.all(
      (cases as ClinicalCase[]).map(async (caseData) => ({
        id: caseData.id,
        encryptedData: await encryptData(caseData, newPasscode),
        createdAt: caseData.createdAt,
        updatedAt: caseData.updatedAt,
      }))
    );
    const newTaskRecords = await Promise.all(
      (tasks as ClinicalTask[]).map(async (task) => ({
        id: task.id,
        caseId: task.caseId,
        encryptedData: await encryptData(task, newPasscode),
        createdAt: now,
        updatedAt: now,
      }))
    );
    const verificationRecord = newCaseRecords[0] || newTaskRecords[0];

    if (verificationRecord) {
      await decryptData(verificationRecord.encryptedData, newPasscode);
    }

    await casesDB.upsertMany(newCaseRecords);
    await tasksDB.upsertMany(newTaskRecords);
    newCaseRecords.forEach((record) => enqueueChange(record.id, 'update', 'case', record));
    newTaskRecords.forEach((record) => enqueueChange(record.id, 'update', 'task', record));
    store.setEncryptionPasscode(newPasscode);
    store.resetFailureCount();
    store.unlockApp();
    await logSecurityEvent(
      'key_rotation_success',
      {
        caseCount: newCaseRecords.length,
        taskCount: newTaskRecords.length,
      },
      'success'
    );
  });
}

export async function restoreDataFromDB(options?: {
  passcode?: string;
  allowLocked?: boolean;
}): Promise<boolean> {
  const store = useCaseStore.getState();
  if (store.isLocked && !options?.allowLocked) return false;

  let passcode: string;
  try {
    passcode = options?.passcode || (await getEncryptionPasscode());
  } catch {
    return false;
  }

  return telemetry
    .trace('db_restoration', 'db', async () => {
      store.setDataStatus('restoring');

      const caseRecords = await casesDB.getAll();
      const taskRecords = await tasksDB.getAll();
      const canDecrypt = await validateEncryptedRecords(caseRecords, taskRecords, passcode);

      if (!canDecrypt) {
        store.setDataStatus('idle');
        await recordSecurityFailure('passcode_mismatch', 'passcode_mismatch', {
          caseCount: caseRecords.length,
          taskCount: taskRecords.length,
        });
        return false;
      }

      const decryptedCases = (
        await Promise.all(caseRecords.map((record) => decryptCase(record, passcode, true)))
      ).filter((item): item is ClinicalCase => Boolean(item));
      const decryptedTasks = (
        await Promise.all(taskRecords.map((record) => decryptTask(record, passcode, true)))
      ).filter((item): item is ClinicalTask => Boolean(item));

      await migrateLegacyRecords(
        passcode,
        caseRecords,
        decryptedCases,
        taskRecords,
        decryptedTasks
      );
      store.loadCases(decryptedCases);
      store.loadTasks(decryptedTasks);
      store.setEncryptionPasscode(passcode);
      store.resetFailureCount();
      store.unlockApp();
      store.setDataStatus('ready');
      return true;
    })
    .catch((error) => {
      store.setDataStatus('error');
      store.setInitError('Failed to restore clinical data from local storage.');
      throw error;
    });
}

export async function unlockClinicalData(passcode: string): Promise<boolean> {
  const store = useCaseStore.getState();
  store.setEncryptionPasscode(passcode);
  const restored = await restoreDataFromDB({ passcode, allowLocked: true });

  if (!restored) {
    store.setEncryptionPasscode(null);
  }

  return restored;
}

export async function seedClinicalData(
  cases: ClinicalCase[],
  tasks: ClinicalTask[]
): Promise<void> {
  if (!config.enableSeedData) return;
  const CLINICAL_DATA_VERSION = 2;
  const store = useCaseStore.getState();

  let passcode: string;
  try {
    passcode = await getEncryptionPasscode();
  } catch {
    return;
  }

  await telemetry.trace('clinical_seeding_internal', 'db', async () => {
    const config = await db.appConfig.get('clinical_data_version');
    const currentVersion = config ? Number(config.value) : 0;
    const existingCaseRecords = await casesDB.getAll();
    const existingTaskRecords = await tasksDB.getAll();

    if (existingCaseRecords.length > 0 || existingTaskRecords.length > 0) {
      const canDecrypt = await validateEncryptedRecords(
        existingCaseRecords,
        existingTaskRecords,
        passcode
      );

      if (!canDecrypt) {
        lockClinicalData('passcode_mismatch');
        return;
      }

      if (currentVersion >= CLINICAL_DATA_VERSION) return;
    } else if (currentVersion >= CLINICAL_DATA_VERSION && !store.authToken) {
      return;
    }

    const encryptedCases = await Promise.all(
      cases.map(async (caseData) => ({
        id: caseData.id,
        encryptedData: await encryptData(caseData, passcode),
        createdAt: caseData.createdAt,
        updatedAt: caseData.updatedAt,
      }))
    );
    await casesDB.upsertMany(encryptedCases);

    const now = new Date().toISOString();
    const encryptedTasks = await Promise.all(
      tasks.map(async (task) => ({
        id: task.id,
        caseId: task.caseId,
        encryptedData: await encryptData(task, passcode),
        createdAt: now,
        updatedAt: now,
      }))
    );
    await tasksDB.upsertMany(encryptedTasks);
    await db.appConfig.put({ key: 'clinical_data_version', value: CLINICAL_DATA_VERSION });
  });
}

/**
 * Initialize drug reference database with seed data (version-aware).
 * Centralizes drug seeding that was previously in localDB.ts.
 */
export async function initializeDrugDatabase(initialDrugs: DrugReference[]): Promise<void> {
  const DRUG_DATA_VERSION = 2;

  try {
    const config = await db.appConfig.get('drug_data_version');

    if (!config || Number(config.value) < DRUG_DATA_VERSION) {
      console.log(`[DB] Seeding drug database (v${DRUG_DATA_VERSION})...`);
      await db.drugs.bulkPut(initialDrugs);
      await db.appConfig.put({ key: 'drug_data_version', value: DRUG_DATA_VERSION });
      console.log('[DB] Drug seeding complete.');
    }
  } catch (error) {
    console.error('Failed to initialize drug database:', error);
  }
}

/**
 * Load all drugs from IndexedDB into the Zustand store.
 * Centralizes drug hydration that was previously in hooks.ts.
 */
export async function loadDrugsIntoStore(): Promise<void> {
  const drugs = await drugsDB.getAll();
  useCaseStore.getState().loadDrugs(drugs);
}

/**
 * Clear all local clinical data (cases, tasks, sync queue) from IndexedDB
 * and hydrate the store with empty arrays.
 * Centralizes the clear operation that was previously in dataManagementService.ts.
 */
export async function clearAllLocalData(): Promise<void> {
  await casesDB.clear();
  await tasksDB.clear();

  const pendingItems = await syncQueueDB.getAll();
  for (const item of pendingItems) {
    if (item.id !== undefined) {
      await syncQueueDB.delete(item.id);
    }
  }

  const store = useCaseStore.getState();
  store.loadCases([]);
  store.loadTasks([]);
  store.setPendingSyncCount(0);
  store.setLastSyncAt(new Date().toISOString());
}

/**
 * Start Fresh Workspace / Reset Workspace
 * Allows deleting demo/seeded data only or full workspace wipe,
 * with optional credentials deletion.
 */
export async function resetWorkspace(
  mode: 'demo_only' | 'full',
  wipeCredentials = false
): Promise<void> {
  const store = useCaseStore.getState();

  // Re-run database initialization WITHOUT seed data:
  // Turn off seed data flag so initialization does not automatically seed demo cases/tasks
  setEnableSeedData(false);

  if (mode === 'demo_only') {
    // 1. Delete only seeded/sample cases, tasks, and logs from IndexedDB
    const mockCaseIds = new Set(mockCases.map((c) => c.id));
    const mockTaskIds = new Set(mockTasks.map((t) => t.id));

    const allCases = await casesDB.getAll();
    const casesToDelete = allCases.filter((c) => mockCaseIds.has(c.id));
    await Promise.all(casesToDelete.map((c) => casesDB.delete(c.id)));

    const allTasks = await tasksDB.getAll();
    const tasksToDelete = allTasks.filter((t) => mockTaskIds.has(t.id));
    await Promise.all(tasksToDelete.map((t) => tasksDB.delete(t.id)));

    // Clean up sync queue items that correspond to mock data
    const pendingItems = await syncQueueDB.getAll();
    for (const item of pendingItems) {
      if (mockCaseIds.has(item.entityId) || mockTaskIds.has(item.entityId)) {
        if (item.id !== undefined) {
          await syncQueueDB.delete(item.id);
        }
      }
    }

    // Clean up seeding telemetry logs
    const telemetryLogs = await db.telemetry.toArray();
    const logsToDelete = telemetryLogs.filter(
      (log) => log.event === 'clinical_seeding' || log.event === 'clinical_seeding_internal'
    );
    await Promise.all(logsToDelete.map((log) => log.id && db.telemetry.delete(log.id)));

    // Re-hydrate Zustand store with user data only
    // This is safe since we already set enableSeedData to false above
    if (store.encryptionPasscode) {
      await restoreDataFromDB();
    }
  } else {
    // Deletes ALL local IndexedDB clinical data
    await casesDB.clear();
    await tasksDB.clear();
    await db.drugs.clear();

    const pendingItems = await syncQueueDB.getAll();
    for (const item of pendingItems) {
      if (item.id !== undefined) {
        await syncQueueDB.delete(item.id);
      }
    }

    // Reset initialization flags
    await db.appConfig.delete('clinical_data_version');
    await db.appConfig.delete('drug_data_version');

    // Clear telemetry logs
    await db.telemetry.clear();

    // Clears Zustand cache
    store.loadCases([]);
    store.loadTasks([]);
    store.loadDrugs([]);
    store.setPendingSyncCount(0);
    store.setLastSyncAt(new Date().toISOString());
  }

  if (wipeCredentials) {
    store.setAuthToken(null);
    store.setUserId(null);
    store.setUserName(null);
    store.setUserEmail(null);
    store.setEncryptionPasscode(null);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('cwc-store');
      } catch (e) {
        console.warn('Failed to clear localStorage on reset:', e);
      }
    }
  }
}
