import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromRequest, unauthorized } from '@/lib/serverAuth';

export async function GET(req: NextRequest) {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) return unauthorized();

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

    return NextResponse.json({
      cases: cases.map((item) => ({
        id: item.entityId,
        encryptedData: item.encryptedData,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      })),
      tasks: tasks.map((item) => ({
        id: item.entityId,
        caseId: item.caseId || '',
        encryptedData: item.encryptedData,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      })),
    });
  } catch (error: any) {
    console.error('Snapshot sync error:', error);
    if (error?.code === 'P1001') {
      return NextResponse.json({ error: 'Database server unreachable. Offline mode active.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Failed to load sync snapshot' }, { status: 500 });
  }
}
