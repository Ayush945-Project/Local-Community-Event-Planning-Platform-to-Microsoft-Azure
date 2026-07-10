import { execute, query } from '@/lib/db';
import { hashPassword, setSessionUser } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/init-db';

export async function POST(request) {
  try {
    // Ensure DB is initialized
    await initializeDatabase();
    
    const body = await request.json();
    const { name, email, phone, role, password } = body;
    
    if (!name || !email || !role || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const normalizedEmail = email.toLowerCase().trim();
    
    // Check if user exists
    const existingUsers = await query('SELECT * FROM Users WHERE email = ?', [normalizedEmail]);
    if (existingUsers && existingUsers.length > 0) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }
    
    const hashedPassword = hashPassword(password);
    const result = await execute(
      'INSERT INTO Users (name, email, phone, role, password) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), normalizedEmail, phone ? phone.trim() : null, role, hashedPassword]
    );
    
    // In SQL Server, result might return insertId from output or scope_identity, 
    // in SQLite, result.insertId is set.
    let userId = result.insertId;
    if (!userId) {
      // Fetch user to get ID if insertId was not returned
      const newUsers = await query('SELECT id FROM Users WHERE email = ?', [normalizedEmail]);
      if (newUsers && newUsers.length > 0) {
        userId = newUsers[0].id;
      }
    }
    
    const user = {
      id: userId,
      name: name.trim(),
      email: normalizedEmail,
      phone: phone ? phone.trim() : null,
      role
    };
    
    await setSessionUser(user);
    return NextResponse.json({ user });
  } catch (err) {
    console.error('Registration API error:', err);
    return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 });
  }
}
