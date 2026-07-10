'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'attendee',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const payload = isLogin 
      ? { email: formData.email, password: formData.password }
      : formData;

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      const userRole = data.user.role;
      if (userRole === 'organizer') {
        router.push('/organizer/dashboard');
      } else {
        router.push('/');
      }
      
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem 0' }}>
      <div className="auth-split-container">
        
        {/* Left: Brand Showcase Side */}
        <div className="auth-brand-side">
          <span style={{ fontSize: '2.5rem', marginBottom: '1.5rem', display: 'block' }}>⚡</span>
          <h2 style={{ fontSize: '2.2rem', fontWeight: '800', lineHeight: '1.2', marginBottom: '1rem', background: 'linear-gradient(135deg, #fff 40%, #a5b4fc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Empower Local Gatherings
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem', fontSize: '1.05rem', lineHeight: '1.6' }}>
            Bring your neighborhood together. Create event pages, recruit volunteers, and broadcast announcements instantly.
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <span style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8', padding: '0.25rem 0.5rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold' }}>✓</span>
              <div>
                <strong style={{ color: '#fff', fontSize: '0.95rem' }}>Organizer Control Hub</strong>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Track RSVP registration capacity limits and queues.</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <span style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8', padding: '0.25rem 0.5rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold' }}>✓</span>
              <div>
                <strong style={{ color: '#fff', fontSize: '0.95rem' }}>Volunteer Roster Scheduling</strong>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Recruit volunteers easily by setting shifts and capacities.</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <span style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8', padding: '0.25rem 0.5rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold' }}>✓</span>
              <div>
                <strong style={{ color: '#fff', fontSize: '0.95rem' }}>Azure Broadcast Notifications</strong>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Trigger Azure Function alerts and emails for instant participant updates.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Interactive Form Side */}
        <div className="auth-form-side">
          <h2 style={{ marginBottom: '0.5rem', fontSize: '1.75rem', fontWeight: '800' }}>
            {isLogin ? 'Sign In' : 'Create Account'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.9rem' }}>
            {isLogin ? 'Enter your details to access your dashboard' : 'Join as organizer, volunteer, or attendee'}
          </p>
          
          <div style={{ 
            display: 'flex', 
            background: 'rgba(255,255,255,0.03)', 
            padding: '0.3rem', 
            borderRadius: '10px',
            marginBottom: '1.75rem',
            border: '1px solid var(--border-color)'
          }}>
            <button 
              type="button"
              className="btn" 
              style={{ 
                flex: 1, 
                background: isLogin ? 'var(--primary-gradient)' : 'transparent',
                color: '#fff',
                borderRadius: '8px',
                padding: '0.5rem',
                fontSize: '0.85rem'
              }}
              onClick={() => { setIsLogin(true); setError(''); }}
            >
              Sign In
            </button>
            <button 
              type="button"
              className="btn" 
              style={{ 
                flex: 1, 
                background: !isLogin ? 'var(--primary-gradient)' : 'transparent',
                color: '#fff',
                borderRadius: '8px',
                padding: '0.5rem',
                fontSize: '0.85rem'
              }}
              onClick={() => { setIsLogin(false); setError(''); }}
            >
              Register
            </button>
          </div>

          {error && (
            <div style={{ 
              background: 'rgba(239, 68, 68, 0.1)', 
              border: '1px solid rgba(239, 68, 68, 0.3)', 
              color: '#fca5a5', 
              padding: '0.75rem 1rem', 
              borderRadius: '10px',
              fontSize: '0.85rem',
              marginBottom: '1.25rem'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input 
                  type="text" 
                  name="name" 
                  className="form-control" 
                  placeholder="John Doe" 
                  required 
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input 
                type="email" 
                name="email" 
                className="form-control" 
                placeholder="name@example.com" 
                required 
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            {!isLogin && (
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input 
                  type="tel" 
                  name="phone" 
                  className="form-control" 
                  placeholder="+1 (555) 000-0000" 
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            )}

            {!isLogin && (
              <div className="form-group">
                <label className="form-label">Select Profile Role</label>
                <select 
                  name="role" 
                  className="form-control" 
                  value={formData.role}
                  onChange={handleChange}
                  style={{ appearance: 'none', backgroundPosition: 'right 1rem center', cursor: 'pointer' }}
                >
                  <option value="attendee">Attendee (Explore & attend events)</option>
                  <option value="volunteer">Volunteer (Help run event shifts)</option>
                  <option value="organizer">Organizer (Manage & publish events)</option>
                </select>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Password</label>
              <input 
                type="password" 
                name="password" 
                className="form-control" 
                placeholder="••••••••" 
                required 
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading}
              style={{ width: '100%', marginTop: '1.5rem', padding: '0.8rem', borderRadius: '10px' }}
            >
              {loading ? 'Processing...' : isLogin ? 'Sign In to Hub' : 'Create Account'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
