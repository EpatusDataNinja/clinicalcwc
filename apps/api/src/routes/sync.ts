/**
 * Sync Routes
 * Handles encrypted data sync (last-write-wins strategy)
 * POST /api/sync/case - Create/update case
 * PUT /api/sync/case - Update case
 * DELETE /api/sync/case - Delete case
 * POST /api/sync/task - Create/update task
 * PUT /api/sync/task - Update task
 * DELETE /api/sync/task - Delete task
 */

import { Router, type Request, type Response } from 'express';
import { prisma } from '../index.js';
import type { AuthRequest } from '../middleware/auth.js';

const router = Router();

type SyncedCaseSnapshot = {
  entityId: string;
  encryptedData: string;
  createdAt: Date;
  updatedAt: Date;
};

type SyncedTaskSnapshot = SyncedCaseSnapshot & {
  caseId: string | null;
};

interface SyncRequest extends AuthRequest {
  body: {
    entityId: string;
    payload: {
      id: string;
      encryptedData: string;
      createdAt: string;
      updatedAt?: string;
      caseId?: string;
    };
  };
}

router.get('/snapshot', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const [cases, tasks] = await Promise.all([
      prisma.syncedCaseBlob.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.syncedTaskBlob.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
      }),
    ]);

    res.status(200).json({
      cases: cases.map((item: SyncedCaseSnapshot) => ({
        id: item.entityId,
        encryptedData: item.encryptedData,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      })),
      tasks: tasks.map((item: SyncedTaskSnapshot) => ({
        id: item.entityId,
        caseId: item.caseId || '',
        encryptedData: item.encryptedData,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Snapshot sync error:', error);
    res.status(500).json({ error: 'Failed to load sync snapshot' });
  }
});

/**
 * POST /api/sync/case - Create new case
 */
router.post('/case', async (req: SyncRequest, res: Response): Promise<void> => {
  try {
    const { entityId, payload } = req.body;
    const userId = req.userId!;

    if (!entityId || !payload.encryptedData) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    // Use upsert to handle duplicates (last-write-wins)
    const syncedCase = await prisma.syncedCaseBlob.upsert({
      where: {
        userId_entityId: {
          userId,
          entityId,
        },
      },
      create: {
        userId,
        entityId,
        encryptedData: payload.encryptedData,
      },
      update: {
        encryptedData: payload.encryptedData,
        updatedAt: new Date(),
      },
    });

    res.status(201).json({
      id: syncedCase.id,
      entityId: syncedCase.entityId,
      synced: true,
    });
  } catch (error) {
    console.error('Sync case error:', error);
    res.status(500).json({ error: 'Failed to sync case' });
  }
});

/**
 * PUT /api/sync/case - Update case
 */
router.put('/case', async (req: SyncRequest, res: Response): Promise<void> => {
  try {
    const { entityId, payload } = req.body;
    const userId = req.userId!;

    if (!entityId || !payload.encryptedData) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    // Last-write-wins: upsert handles client/server drift.
    const syncedCase = await prisma.syncedCaseBlob.upsert({
      where: {
        userId_entityId: {
          userId,
          entityId,
        },
      },
      create: {
        userId,
        entityId,
        encryptedData: payload.encryptedData,
      },
      update: {
        encryptedData: payload.encryptedData,
        updatedAt: new Date(),
      },
    });

    res.status(200).json({
      id: syncedCase.id,
      entityId: syncedCase.entityId,
      synced: true,
    });
  } catch (error) {
    console.error('Update case error:', error);
    res.status(500).json({ error: 'Failed to update case' });
  }
});

/**
 * DELETE /api/sync/case - Delete case
 */
router.delete('/case', async (req: SyncRequest, res: Response): Promise<void> => {
  try {
    const { entityId } = req.body;
    const userId = req.userId!;

    if (!entityId) {
      res.status(400).json({ error: 'Missing entityId' });
      return;
    }

    // Delete case and associated tasks
    await prisma.syncedCaseBlob.deleteMany({
      where: {
        userId,
        entityId,
      },
    });

    res.status(200).json({ deleted: true });
  } catch (error) {
    console.error('Delete case error:', error);
    res.status(500).json({ error: 'Failed to delete case' });
  }
});

/**
 * POST /api/sync/task - Create new task
 */
router.post('/task', async (req: SyncRequest, res: Response): Promise<void> => {
  try {
    const { entityId, payload } = req.body;
    const userId = req.userId!;

    if (!entityId || !payload.encryptedData) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    // Upsert task
    const syncedTask = await prisma.syncedTaskBlob.upsert({
      where: {
        userId_entityId: {
          userId,
          entityId,
        },
      },
      create: {
        userId,
        entityId,
        caseId: payload.caseId,
        encryptedData: payload.encryptedData,
      },
      update: {
        caseId: payload.caseId,
        encryptedData: payload.encryptedData,
        updatedAt: new Date(),
      },
    });

    res.status(201).json({
      id: syncedTask.id,
      entityId: syncedTask.entityId,
      synced: true,
    });
  } catch (error) {
    console.error('Sync task error:', error);
    res.status(500).json({ error: 'Failed to sync task' });
  }
});

/**
 * PUT /api/sync/task - Update task
 */
router.put('/task', async (req: SyncRequest, res: Response): Promise<void> => {
  try {
    const { entityId, payload } = req.body;
    const userId = req.userId!;

    if (!entityId || !payload.encryptedData) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const syncedTask = await prisma.syncedTaskBlob.upsert({
      where: {
        userId_entityId: {
          userId,
          entityId,
        },
      },
      create: {
        userId,
        entityId,
        caseId: payload.caseId,
        encryptedData: payload.encryptedData,
      },
      update: {
        caseId: payload.caseId,
        encryptedData: payload.encryptedData,
        updatedAt: new Date(),
      },
    });

    res.status(200).json({
      id: syncedTask.id,
      entityId: syncedTask.entityId,
      synced: true,
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

/**
 * DELETE /api/sync/task - Delete task
 */
router.delete('/task', async (req: SyncRequest, res: Response): Promise<void> => {
  try {
    const { entityId } = req.body;
    const userId = req.userId!;

    if (!entityId) {
      res.status(400).json({ error: 'Missing entityId' });
      return;
    }

    await prisma.syncedTaskBlob.deleteMany({
      where: {
        userId,
        entityId,
      },
    });

    res.status(200).json({ deleted: true });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

export default router;
