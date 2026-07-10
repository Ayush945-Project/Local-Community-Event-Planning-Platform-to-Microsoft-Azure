import { getSessionUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import NotificationFeed from '@/app/components/NotificationFeed';
import { CalendarIcon, MapPinIcon, UsersIcon, InfoIcon } from '@/app/components/Icons';

export const dynamic = 'force-dynamic';

export default async function OrganizerDashboard() {
  const user = await getSessionUser();
  
  if (!user || user.role !== 'organizer') {
    redirect('/auth');
  }

  // 1. Fetch Stats
  const totalEventsResult = await query(
    'SELECT COUNT(*) as count FROM Events WHERE organizer_id = ?',
    [user.id]
  );
  const totalEvents = totalEventsResult[0]?.count || 0;

  const totalRegistrationsResult = await query(
    `SELECT COUNT(*) as count 
     FROM Registrations r 
     JOIN Events e ON r.event_id = e.id 
     WHERE e.organizer_id = ? AND r.status = 'Registered'`,
    [user.id]
  );
  const totalRegistrations = totalRegistrationsResult[0]?.count || 0;

  const volunteerStats = await query(
    `SELECT 
       COALESCE(SUM(vr.capacity), 0) as capacity,
       (SELECT COUNT(*) FROM VolunteerAssignments va JOIN VolunteerRoles vr2 ON va.role_id = vr2.id JOIN Events e2 ON vr2.event_id = e2.id WHERE e2.organizer_id = ? AND va.status = 'Assigned') as filled
     FROM VolunteerRoles vr
     JOIN Events e ON vr.event_id = e.id
     WHERE e.organizer_id = ?`,
    [user.id, user.id]
  );
  const volunteerCapacity = volunteerStats[0]?.capacity || 0;
  const volunteerFilled = volunteerStats[0]?.filled || 0;
  const volunteerFillRate = volunteerCapacity > 0 
    ? Math.round((volunteerFilled / volunteerCapacity) * 100) 
    : 0;

  const waitlistedResult = await query(
    `SELECT COUNT(*) as count 
     FROM Registrations r 
     JOIN Events e ON r.event_id = e.id 
     WHERE e.organizer_id = ? AND r.status = 'Waitlisted'`,
    [user.id]
  );
  const totalWaitlisted = waitlistedResult[0]?.count || 0;

  // 2. Fetch Events
  const events = await query(
    `SELECT e.*, 
       (SELECT COUNT(*) FROM Registrations r WHERE r.event_id = e.id AND r.status = 'Registered') as registered_count,
       (SELECT COUNT(*) FROM Registrations r WHERE r.event_id = e.id AND r.status = 'Waitlisted') as waitlisted_count
     FROM Events e 
     WHERE e.organizer_id = ?
     ORDER BY e.date_time ASC`,
    [user.id]
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.25rem' }}>Management Console</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Welcome back, {user.name}. Oversee your scheduled activities and verify registered rosters.</p>
        </div>
        <Link href="/organizer/new-event" className="btn btn-primary">
          + Create Event Page
        </Link>
      </div>

      {/* Analytics Widgets Grid */}
      <div className="dashboard-grid">
        <div className="stat-card">
          <span className="stat-label">Hosted Events</span>
          <span className="stat-value">{totalEvents}</span>
          <span className="stat-trend" style={{ color: 'var(--primary-color)' }}>Active listings</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">RSVP Registrants</span>
          <span className="stat-value">{totalRegistrations}</span>
          <span className="stat-trend" style={{ color: 'var(--success-color)' }}>Confirmed spots</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Volunteer Fill-Rate</span>
          <span className="stat-value">{volunteerFillRate}%</span>
          <span className="stat-trend" style={{ color: 'var(--success-color)' }}>
            {volunteerFilled} / {volunteerCapacity} Shifts filled
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Waitlist Queue</span>
          <span className="stat-value">{totalWaitlisted}</span>
          <span className="stat-trend" style={{ color: 'var(--warning-color)' }}>Waiting on capacity</span>
        </div>
      </div>

      {/* Registration Velocity Inline Chart */}
      <div className="event-section" style={{ marginBottom: '2.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#fff', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <InfoIcon size={16} style={{ color: 'var(--primary-color)' }} /> Registration Velocity (Simulated Trend)
        </h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>RSVP metrics over the past 30 days of campaign lifecycle.</p>
        
        <div className="svg-chart-container">
          <svg viewBox="0 0 500 120" width="100%" height="120" style={{ overflow: 'visible' }}>
            <defs>
              <linearGradient id="chartGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#4f46e5" />
                <stop offset="100%" stopColor="#7c3aed" />
              </linearGradient>
              <linearGradient id="chartAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(99, 102, 241, 0.2)" />
                <stop offset="100%" stopColor="rgba(99, 102, 241, 0)" />
              </linearGradient>
            </defs>
            {/* Grid Lines */}
            <line x1="0" y1="100" x2="500" y2="100" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
            <line x1="0" y1="60" x2="500" y2="60" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
            <line x1="0" y1="20" x2="500" y2="20" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
            
            {/* Smooth SVG spline path */}
            <path
              d="M 0 100 Q 50 80 100 90 T 200 50 T 300 65 T 400 15 T 500 25"
              fill="none"
              stroke="url(#chartGrad)"
              strokeWidth="3"
              strokeLinecap="round"
            />
            {/* Fill under spline path */}
            <path
              d="M 0 100 Q 50 80 100 90 T 200 50 T 300 65 T 400 15 T 500 25 L 500 100 L 0 100 Z"
              fill="url(#chartAreaGrad)"
            />
            {/* Circle pointer glow */}
            <circle cx="400" cy="15" r="4.5" fill="#818cf8" stroke="#fff" strokeWidth="1.5" />
          </svg>
        </div>
      </div>

      <div className="event-detail-grid">
        {/* Left Side: Events List */}
        <div>
          <h2 style={{ marginBottom: '1.25rem', fontSize: '1.4rem', fontWeight: '800' }}>Your Managed Events</h2>
          {events.length === 0 ? (
            <div className="card" style={{ padding: '3.5rem', textAlign: 'center', alignItems: 'center' }}>
              <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>You haven't scheduled any community events yet.</p>
              <Link href="/organizer/new-event" className="btn btn-primary" style={{ display: 'inline-flex' }}>
                Create First Event
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {events.map((evt) => {
                const date = new Date(evt.date_time).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });
                
                return (
                  <div key={evt.id} className="card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.6rem' }}>
                          <span className={`badge badge-${evt.status.toLowerCase()}`}>
                            {evt.status}
                          </span>
                          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: '800', color: 'var(--primary-color)' }}>
                            {evt.category}
                          </span>
                        </div>
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '0.6rem', color: '#fff' }}>{evt.title}</h3>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <CalendarIcon size={14} style={{ color: 'var(--primary-color)' }} /> {date}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <MapPinIcon size={14} style={{ color: 'var(--primary-color)' }} /> {evt.location}
                          </span>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Link href={`/organizer/events/${evt.id}`} className="btn btn-primary" style={{ padding: '0.55rem 1.1rem', fontSize: '0.8rem', borderRadius: '8px' }}>
                          Manage Event
                        </Link>
                        <Link href={`/events/${evt.id}`} className="btn btn-secondary" style={{ padding: '0.55rem 1.1rem', fontSize: '0.8rem', borderRadius: '8px' }}>
                          Live Page
                        </Link>
                      </div>
                    </div>
                    
                    <div style={{ 
                      marginTop: '1.25rem', 
                      paddingTop: '1rem', 
                      borderTop: '1px solid var(--border-color)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.85rem',
                      color: 'var(--text-secondary)'
                    }}>
                      <span>Registrants: <strong style={{ color: '#fff' }}>{evt.registered_count} / {evt.capacity}</strong></span>
                      {evt.waitlisted_count > 0 && (
                        <span style={{ color: 'var(--warning-color)' }}>Waitlist: <strong style={{ color: 'var(--warning-color)' }}>{evt.waitlisted_count}</strong></span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Notification Live Monitor */}
        <div>
          <h2 style={{ marginBottom: '1.25rem', fontSize: '1.4rem', fontWeight: '800' }}>Azure Notifications Monitor</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            Live logging console displaying dispatched notifications from Azure Functions to Communication Services / Notification Hubs.
          </p>
          <NotificationFeed />
        </div>
      </div>
    </div>
  );
}
