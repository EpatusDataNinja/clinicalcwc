import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromRequest, unauthorized } from '@/lib/serverAuth';

export async function POST(req: NextRequest) {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) return unauthorized();

    const { entityId, payload } = await req.json();
    if (!entityId || !payload.encryptedData) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const syncedCase = await prisma.syncedCaseBlob.upsert({
      where: { userId_entityId: { userId, entityId } },
      create: { userId, entityId, encryptedData: payload.encryptedData },
      update: { encryptedData: payload.encryptedData, updatedAt: new Date() },
    });

    return NextResponse.json({ id: syncedCase.id, entityId: syncedCase.entityId, synced: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to sync case' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  return POST(req); // Re-use logic for last-write-wins
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) return unauthorized();

    const { entityId } = await req.json();
    if (!entityId) return NextResponse.json({ error: 'Missing entityId' }, { status: 400 });

    await prisma.syncedCaseBlob.deleteMany({ where: { userId, entityId } });
    return NextResponse.json({ deleted: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete case' }, { status: 500 });
  }
}
