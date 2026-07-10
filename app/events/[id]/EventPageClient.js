'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CalendarIcon, MapPinIcon, UsersIcon, ClockIcon, BellIcon, ShareIcon, CheckIcon } from '@/app/components/Icons';

export default function EventPageClient({ initialData, currentUser }) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [volunteeringId, setVolunteeringId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copied, setCopied] = useState(false);

  const { event, volunteerRoles, announcements, userRegistrationStatus, userVolunteerStatus, registeredCount } = data;

  const handleRSVP = async () => {
    if (!currentUser) {
      router.push('/auth');
      return;
    }
    
    setRsvpLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const res = await fetch(`/api/events/${event.id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to RSVP');
      }
      
      setSuccess(json.message);
      
      const refreshRes = await fetch(`/api/events/${event.id}`);
      if (refreshRes.ok) {
        const refreshJson = await refreshRes.json();
        setData(refreshJson);
      }
      
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setRsvpLoading(false);
    }
  };

  const handleVolunteerSignup = async (roleId) => {
    if (!currentUser) {
      router.push('/auth');
      return;
    }
    
    setVolunteeringId(roleId);
    setError('');
    setSuccess('');
    
    try {
      const res = await fetch(`/api/events/${event.id}/volunteer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleId })
      });
      
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to sign up');
      }
      
      setSuccess(json.message);
      
      const refreshRes = await fetch(`/api/events/${event.id}`);
      if (refreshRes.ok) {
        const refreshJson = await refreshRes.json();
        setData(refreshJson);
      }
      
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setVolunteeringId(null);
    }
  };

  const copyShareLink = () => {
    const link = window.location.href;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedDate = new Date(event.date_time).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const isAtCapacity = registeredCount >= event.capacity;

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/" style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--primary-color)', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          ← Back to Discovery
        </Link>
      </div>

      {/* Hero Banner Banner */}
      <div className="event-hero">
        <img src={event.banner_url} alt={event.title} className="event-hero-img" />
        <div className="event-hero-overlay">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <span className={`badge badge-${event.status.toLowerCase()}`}>{event.status}</span>
            <span style={{ 
              fontSize: '0.75rem', 
              fontWeight: '800', 
              color: '#818cf8', 
              background: 'rgba(99, 102, 241, 0.15)',
              padding: '0.2rem 0.6rem',
              borderRadius: '4px',
              border: '1px solid rgba(99,102,241,0.25)',
              textTransform: 'uppercase'
            }}>{event.category}</span>
          </div>
          <h1 style={{ fontSize: '2.6rem', marginBottom: '0.75rem', color: '#fff', textShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>{event.title}</h1>
          
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.95rem', color: '#e2e8f0', textShadow: '0 2px 4px rgba(0,0,0,0.4)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CalendarIcon size={16} style={{ color: 'var(--primary-color)' }} /> {formattedDate}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <MapPinIcon size={16} style={{ color: 'var(--primary-color)' }} /> {event.location}
            </span>
          </div>
        </div>
      </div>

      <div className="event-detail-grid">
        {/* Left Side: About & Broadcast Feed */}
        <div>
          <div className="event-section">
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              About this Event
            </h2>
            <div style={{ color: 'var(--text-secondary)', lineHeight: '1.7', fontSize: '1.05rem', whiteSpace: 'pre-line' }}>
              {event.description || 'No description provided for this event.'}
            </div>
          </div>

          <div className="event-section">
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BellIcon style={{ color: 'var(--primary-color)' }} /> Real-time Updates & Announcements
            </h2>
            {announcements.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>No announcements or updates posted yet. Check back later for live broadcasts.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {announcements.map((ann) => (
                  <div key={ann.id} className="announcement-item">
                    <div className="announcement-time">
                      {new Date(ann.sent_at).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    <div className="announcement-msg">{ann.message}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: RSVP, Volunteers & Share */}
        <div>
          {/* Status Message Panel */}
          {error && (
            <div style={{ 
              background: 'rgba(239, 68, 68, 0.1)', 
              border: '1px solid rgba(239, 68, 68, 0.3)', 
              color: '#fca5a5', 
              padding: '0.75rem 1rem', 
              borderRadius: '10px',
              fontSize: '0.85rem',
              marginBottom: '1.5rem'
            }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ 
              background: 'rgba(16, 185, 129, 0.1)', 
              border: '1px solid rgba(16, 185, 129, 0.3)', 
              color: '#a7f3d0', 
              padding: '0.75rem 1rem', 
              borderRadius: '10px',
              fontSize: '0.85rem',
              marginBottom: '1.5rem'
            }}>
              {success}
            </div>
          )}

          {/* Registration RSVP Card */}
          <div className="event-section" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem', fontWeight: '800' }}>Event Registration</h3>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
              <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <UsersIcon size={16} /> Attending:
              </span>
              <strong>{registeredCount} / {event.capacity} registered</strong>
            </div>

            {currentUser && currentUser.role === 'organizer' && currentUser.id === event.organizer_id ? (
              <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                <p style={{ fontSize: '0.85rem', marginBottom: '0.75rem', color: 'var(--primary-color)', fontWeight: 'bold' }}>
                  You are hosting this event!
                </p>
                <Link href={`/organizer/events/${event.id}`} className="btn btn-primary" style={{ display: 'flex', width: '100%', borderRadius: '8px' }}>
                  Manage Event Console
                </Link>
              </div>
            ) : currentUser && userRegistrationStatus ? (
              <div style={{ 
                padding: '1rem', 
                background: userRegistrationStatus === 'Waitlisted' ? 'rgba(245, 158, 11, 0.05)' : 'rgba(16, 185, 129, 0.05)',
                border: `1px solid ${userRegistrationStatus === 'Waitlisted' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`,
                borderRadius: '10px', 
                textAlign: 'center' 
              }}>
                <span style={{ 
                  fontSize: '0.95rem', 
                  fontWeight: '800', 
                  color: userRegistrationStatus === 'Waitlisted' ? 'var(--warning-color)' : 'var(--success-color)' 
                }}>
                  RSVP: {userRegistrationStatus}
                </span>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
                  {userRegistrationStatus === 'Waitlisted' 
                    ? "Event has reached capacity. You are placed on the queue waitlist. We'll update you via email."
                    : 'Spot reserved successfully. A confirmation email has been dispatched via Azure.'}
                </p>
              </div>
            ) : (
              <div>
                {isAtCapacity && (
                  <div style={{ 
                    fontSize: '0.8rem', 
                    color: 'var(--warning-color)', 
                    background: 'rgba(245, 158, 11, 0.05)', 
                    padding: '0.65rem 0.85rem', 
                    borderRadius: '8px',
                    marginBottom: '0.85rem',
                    border: '1px solid rgba(245, 158, 11, 0.15)'
                  }}>
                    ⚠️ Event is full. Registering will queue you on the waitlist.
                  </div>
                )}
                
                <button 
                  onClick={handleRSVP} 
                  className="btn btn-primary" 
                  style={{ width: '100%' }}
                  disabled={rsvpLoading || event.status !== 'Published'}
                >
                  {rsvpLoading ? 'Processing RSVP...' : currentUser ? 'RSVP to Event' : 'Sign In to Register'}
                </button>
              </div>
            )}
          </div>

          {/* Volunteer Shifts Card */}
          <div className="event-section" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.4rem', fontWeight: '800' }}>Volunteer Positions</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Review the staffing needs and sign up for open Shifts.
            </p>

            {currentUser && currentUser.role !== 'volunteer' && currentUser.role !== 'organizer' && (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'rgba(99,102,241,0.05)', padding: '0.65rem', borderRadius: '8px', marginBottom: '1.25rem', border: '1px solid rgba(99,102,241,0.1)' }}>
                💡 Volunteer shifts require a <strong>Volunteer</strong> account. Register one or switch roles to sign up.
              </div>
            )}

            {volunteerRoles.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No staffing requirements listed.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {volunteerRoles.map(role => {
                  const isRoleFilled = role.filled_count >= role.capacity;
                  const isUserAssignedThisRole = userVolunteerStatus && userVolunteerStatus.title === role.title;
                  
                  return (
                    <div key={role.id} style={{ 
                      border: '1px solid var(--border-color)', 
                      borderRadius: '10px', 
                      padding: '0.85rem',
                      background: isUserAssignedThisRole ? 'rgba(99, 102, 241, 0.04)' : 'rgba(255,255,255,0.01)',
                      borderColor: isUserAssignedThisRole ? 'var(--primary-color)' : 'var(--border-color)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <strong style={{ fontSize: '0.9rem', color: '#fff' }}>{role.title}</strong>
                          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.15rem' }}>
                            <ClockIcon size={12} /> {role.shift_time}
                          </p>
                        </div>
                        
                        <span style={{ fontSize: '0.78rem', fontWeight: '700', color: isRoleFilled ? 'var(--text-muted)' : 'var(--success-color)' }}>
                          {role.filled_count} / {role.capacity} filled
                        </span>
                      </div>
                      
                      {role.description && (
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>{role.description}</p>
                      )}
                      
                      {isUserAssignedThisRole ? (
                        <div style={{ 
                          marginTop: '0.6rem', 
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.3rem',
                          fontSize: '0.8rem', 
                          color: 'var(--success-color)', 
                          fontWeight: 'bold', 
                          background: 'rgba(16, 185, 129, 0.08)', 
                          padding: '0.35rem', 
                          borderRadius: '6px',
                          border: '1px solid rgba(16, 185, 129, 0.15)'
                        }}>
                          <CheckIcon size={14} /> Assigned to Shift
                        </div>
                      ) : (
                        <button
                          onClick={() => handleVolunteerSignup(role.id)}
                          className="btn btn-secondary"
                          style={{ width: '100%', marginTop: '0.6rem', padding: '0.45rem', fontSize: '0.8rem', borderRadius: '6px' }}
                          disabled={
                            volunteeringId !== null || 
                            isRoleFilled || 
                            (currentUser && currentUser.role !== 'volunteer') || 
                            userVolunteerStatus !== null
                          }
                        >
                          {volunteeringId === role.id ? 'Assigning...' : isRoleFilled ? 'Shift Full' : userVolunteerStatus ? 'Active in another Shift' : 'Sign Up for Shift'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Social Share Card */}
          <div className="event-section" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.85rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShareIcon size={18} style={{ color: 'var(--primary-color)' }} /> Share & Promote
            </h3>
            
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <button 
                onClick={copyShareLink} 
                className="btn btn-secondary" 
                style={{ flex: 1, padding: '0.6rem', fontSize: '0.85rem' }}
              >
                {copied ? '✓ Copied to Clipboard!' : '🔗 Copy Shareable Link'}
              </button>
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
              <a 
                href={`https://twitter.com/intent/tweet?text=Join%20me%20at%20${encodeURIComponent(event.title)}!%20Details:%20`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn btn-secondary"
                style={{ padding: '0.45rem', fontSize: '0.8rem', flex: 1, textAlign: 'center' }}
              >
                Twitter
              </a>
              <a 
                href={`https://www.facebook.com/sharer/sharer.php?u=`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn btn-secondary"
                style={{ padding: '0.45rem', fontSize: '0.8rem', flex: 1, textAlign: 'center' }}
              >
                Facebook
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
