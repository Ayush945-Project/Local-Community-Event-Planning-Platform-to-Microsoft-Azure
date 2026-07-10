import { query } from '@/lib/db';
import { verifyPassword, setSessionUser } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/init-db';

export async function POST(request) {
  try {
    // Ensure DB is initialized
    await initializeDatabase();
    
    const body = await request.json();
    const { email, password } = body;
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }
    
    const normalizedEmail = email.toLowerCase().trim();
    
    // Fetch user
    const users = await query('SELECT * FROM Users WHERE email = ?', [normalizedEmail]);
    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }
    
    const user = users[0];
    const isPasswordValid = verifyPassword(password, user.password);
    
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }
    
    // Do not return password to the client
    const { password: _, ...safeUser } = user;
    
    await setSessionUser(safeUser);
    return NextResponse.json({ user: safeUser });
  } catch (err) {
    console.error('Login API error:', err);
    return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 });
  }
}
