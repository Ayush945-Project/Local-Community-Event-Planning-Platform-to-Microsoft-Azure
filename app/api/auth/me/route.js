import { getSessionUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const user = await getSessionUser();
    return NextResponse.json({ user });
  } catch (err) {
    console.error('Session retrieval error:', err);
    return NextResponse.json({ user: null });
  }
}
