import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });
}

export function getUserIdFromRequest(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.split(' ')[1];

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { userId: string };
    return decoded.userId;
  } catch (error) {
    return null;
  }
}

export function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
