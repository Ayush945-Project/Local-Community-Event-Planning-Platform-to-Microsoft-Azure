import { clearSessionUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    await clearSessionUser();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Logout API error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
