import crypto from 'crypto';
import { cookies } from 'next/headers';

/**
 * Hash a password using native PBKDF2.
 */
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verify a password against a stored hash.
 */
export function verifyPassword(password, storedPassword) {
  if (!storedPassword || !storedPassword.includes(':')) return false;
  const [salt, originalHash] = storedPassword.split(':');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === originalHash;
}

/**
 * Retrieve the currently logged in user from the session cookie.
 */
export async function getSessionUser() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    if (!sessionCookie || !sessionCookie.value) return null;
    
    // Parse the session user info
    const user = JSON.parse(decodeURIComponent(sessionCookie.value));
    return user;
  } catch (err) {
    console.error('Error parsing session cookie:', err);
    return null;
  }
}

/**
 * Set the session cookie.
 */
export async function setSessionUser(user) {
  const cookieStore = await cookies();
  // Store user info without sensitive fields like password
  const { password, ...safeUser } = user;
  
  cookieStore.set('session', encodeURIComponent(JSON.stringify(safeUser)), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: '/'
  });
}

/**
 * Clear the session cookie.
 */
export async function clearSessionUser() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}
