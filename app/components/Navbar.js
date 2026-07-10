'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Navbar({ user }) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link href="/" className="nav-logo">
          <span>⚡</span> CommunityHub
        </Link>
        <div className="nav-links">
          <Link href="/" className="nav-link">
            Explore Events
          </Link>
          
          {user ? (
            <>
              {user.role === 'organizer' && (
                <>
                  <Link href="/organizer/dashboard" className="nav-link">
                    Dashboard
                  </Link>
                  <Link href="/organizer/new-event" className="nav-link">
                    + New Event
                  </Link>
                </>
              )}
              <span style={{ 
                fontSize: '0.85rem', 
                color: 'var(--text-muted)', 
                background: 'rgba(255,255,255,0.05)',
                padding: '0.25rem 0.6rem',
                borderRadius: '6px',
                border: '1px solid var(--border-color)'
              }}>
                {user.name} ({user.role})
              </span>
              <button 
                onClick={handleLogout} 
                className="btn btn-secondary"
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link href="/auth" className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
