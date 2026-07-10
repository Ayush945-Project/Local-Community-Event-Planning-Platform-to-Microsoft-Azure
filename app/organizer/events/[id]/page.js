'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ManageEventPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Announcement input
  const [announcementMsg, setAnnouncementMsg] = useState('');
  const [announcing, setAnnouncing] = useState(false);
  const [announceSuccess, setAnnounceSuccess] = useState('');
  
  // Event edit inputs
  const [eventStatus, setEventStatus] = useState('Published');
  const [eventCapacity, setEventCapacity] = useState(50);
  const [updatingSettings, setUpdatingSettings] = useState(false);
  
  // Active Tab
  const [activeTab, setActiveTab] = useState('registrants');

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/events/${id}`);
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          router.push('/auth');
          return;
        }
        throw new Error('Failed to load event data');
      }
      const json = await res.json();
      setData(json);
      setEventStatus(json.event.status);
      setEventCapacity(json.event.capacity);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handlePostAnnouncement = async (e) => {
    e.preventDefault();
    if (!announcementMsg.trim()) return;
    
    setAnnouncing(true);
    setAnnounceSuccess('');
    setError('');
    
    try {
      const res = await fetch(`/api/events/${id}/announcements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: announcementMsg.trim() })
      });
      
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to post announcement');
      }
      
      setAnnounceSuccess(`Announcement broadcasted successfully to ${json.recipientCount} participants!`);
      setAnnouncementMsg('');
      
      // Reload event data to show new announcement in list
      fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setAnnouncing(false);
    }
  };

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    setUpdatingSettings(true);
    setError('');
    
    try {
      const res = await fetch(`/api/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.event.title,
          description: data.event.description,
          category: data.event.category,
          date_time: data.event.date_time,
          location: data.event.location,
          capacity: parseInt(eventCapacity, 10),
          status: eventStatus
        })
      });
      
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to update settings');
      }
      
      alert('Event details updated successfully!');
      fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingSettings(false);
    }
  };

  if (loading) return <p>Loading event manager...</p>;
  if (error && !data) return <div style={{ color: 'var(--danger-color)' }}>Error: {error}</div>;
  if (!data) return <p>Event not found.</p>;

  const { event, volunteerRoles, announcements, registrations = [], volunteerAssignments = [] } = data;
  
  const formattedDate = new Date(event.date_time).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/organizer/dashboard" style={{ fontSize: '0.9rem', color: 'var(--primary-color)' }}>
          ← Back to Dashboard
        </Link>
      </div>

      <div className="card" style={{ padding: '2rem', marginBottom: '2rem', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span className={`badge badge-${event.status.toLowerCase()}`}>{event.status}</span>
              <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>{event.category}</span>
            </div>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{event.title}</h1>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              📅 {formattedDate} | 📍 {event.location}
            </p>
          </div>
          
          <Link href={`/events/${id}`} className="btn btn-secondary">
            View Live Page
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        borderBottom: '1px solid var(--border-color)', 
        marginBottom: '1.5rem', 
        gap: '1rem' 
      }}>
        <button 
          className="nav-link" 
          style={{ 
            borderRadius: '0', 
            borderBottom: activeTab === 'registrants' ? '2px solid var(--primary-color)' : 'none',
            background: 'transparent',
            fontWeight: activeTab === 'registrants' ? 'bold' : 'normal',
            color: activeTab === 'registrants' ? 'var(--text-primary)' : 'var(--text-secondary)'
          }}
          onClick={() => setActiveTab('registrants')}
        >
          Registrants ({registrations.length})
        </button>
        <button 
          className="nav-link" 
          style={{ 
            borderRadius: '0', 
            borderBottom: activeTab === 'volunteers' ? '2px solid var(--primary-color)' : 'none',
            background: 'transparent',
            fontWeight: activeTab === 'volunteers' ? 'bold' : 'normal',
            color: activeTab === 'volunteers' ? 'var(--text-primary)' : 'var(--text-secondary)'
          }}
          onClick={() => setActiveTab('volunteers')}
        >
          Volunteers ({volunteerAssignments.length})
        </button>
        <button 
          className="nav-link" 
          style={{ 
            borderRadius: '0', 
            borderBottom: activeTab === 'announcements' ? '2px solid var(--primary-color)' : 'none',
            background: 'transparent',
            fontWeight: activeTab === 'announcements' ? 'bold' : 'normal',
            color: activeTab === 'announcements' ? 'var(--text-primary)' : 'var(--text-secondary)'
          }}
          onClick={() => setActiveTab('announcements')}
        >
          Broadcast Updates
        </button>
        <button 
          className="nav-link" 
          style={{ 
            borderRadius: '0', 
            borderBottom: activeTab === 'settings' ? '2px solid var(--primary-color)' : 'none',
            background: 'transparent',
            fontWeight: activeTab === 'settings' ? 'bold' : 'normal',
            color: activeTab === 'settings' ? 'var(--text-primary)' : 'var(--text-secondary)'
          }}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
      </div>

      {error && (
        <div style={{ 
          background: 'rgba(239, 68, 68, 0.1)', 
          border: '1px solid rgba(239, 68, 68, 0.3)', 
          color: '#fca5a5', 
          padding: '0.75rem 1rem', 
          borderRadius: '10px',
          marginBottom: '1.5rem'
        }}>
          {error}
        </div>
      )}

      {/* Tab: Registrants */}
      {activeTab === 'registrants' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem' }}>Registered Attendees</h2>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Total: <strong>{registrations.filter(r => r.status === 'Registered').length} / {event.capacity}</strong> 
              {registrations.filter(r => r.status === 'Waitlisted').length > 0 && (
                <span style={{ color: 'var(--warning-color)', marginLeft: '1rem' }}>
                  Waitlist: <strong>{registrations.filter(r => r.status === 'Waitlisted').length}</strong>
                </span>
              )}
            </span>
          </div>
          
          {registrations.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No registrations yet.</p>
          ) : (
            <div className="table-wrapper">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Date Registered</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map(reg => (
                    <tr key={reg.id}>
                      <td style={{ fontWeight: '600' }}>{reg.name}</td>
                      <td>{reg.email}</td>
                      <td>{reg.phone || 'N/A'}</td>
                      <td>{new Date(reg.registered_at).toLocaleDateString()}</td>
                      <td>
                        <span className={`badge badge-${reg.status === 'Waitlisted' ? 'waitlist' : 'published'}`} 
                              style={{ 
                                backgroundColor: reg.status === 'Waitlisted' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                color: reg.status === 'Waitlisted' ? 'var(--warning-color)' : 'var(--secondary-color)'
                              }}>
                          {reg.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Volunteers */}
      {activeTab === 'volunteers' && (
        <div>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Volunteer Roster</h2>
          
          {volunteerAssignments.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No volunteers signed up yet.</p>
          ) : (
            <div className="table-wrapper">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Assigned Role</th>
                    <th>Shift Time</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Signup Date</th>
                  </tr>
                </thead>
                <tbody>
                  {volunteerAssignments.map(asg => (
                    <tr key={asg.id}>
                      <td style={{ fontWeight: '600' }}>{asg.name}</td>
                      <td>
                        <span style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>{asg.role_title}</span>
                      </td>
                      <td>{asg.shift_time}</td>
                      <td>{asg.email}</td>
                      <td>{asg.phone || 'N/A'}</td>
                      <td>{new Date(asg.assigned_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ marginTop: '2rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Recruiting Positions Overview</h3>
            <div className="grid-layout" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
              {volunteerRoles.map(role => (
                <div key={role.id} className="card" style={{ padding: '1rem' }}>
                  <h4 style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{role.title}</h4>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Shift: {role.shift_time}</span>
                  <div style={{ 
                    marginTop: '0.5rem', 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    fontSize: '0.85rem'
                  }}>
                    <span>Filled:</span>
                    <strong>{role.filled_count} / {role.capacity}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Post Announcement */}
      {activeTab === 'announcements' && (
        <div style={{ maxWidth: '600px' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Broadcast Updates & Announcements</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            Broadcasting an announcement will post it to the event page feed and trigger automated email notifications to all registered attendees and active volunteers.
          </p>

          {announceSuccess && (
            <div style={{ 
              background: 'rgba(16, 185, 129, 0.1)', 
              border: '1px solid rgba(16, 185, 129, 0.3)', 
              color: '#a7f3d0', 
              padding: '0.75rem 1rem', 
              borderRadius: '10px',
              fontSize: '0.85rem',
              marginBottom: '1.25rem'
            }}>
              {announceSuccess}
            </div>
          )}

          <form onSubmit={handlePostAnnouncement} className="card" style={{ padding: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label">Update Message</label>
              <textarea 
                className="form-control" 
                rows="4" 
                placeholder="E.g., The meetup point has been shifted to Entrance Gate 2. Please arrive 10 minutes early!" 
                required
                value={announcementMsg}
                onChange={(e) => setAnnouncementMsg(e.target.value)}
              ></textarea>
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={announcing || !announcementMsg.trim()}
              style={{ alignSelf: 'flex-end', marginTop: '0.5rem' }}
            >
              {announcing ? 'Sending Broadcast...' : '📣 Broadcast Update'}
            </button>
          </form>

          <div style={{ marginTop: '2rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Previous Announcements</h3>
            {announcements.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No announcements posted yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {announcements.map(ann => (
                  <div key={ann.id} className="announcement-item">
                    <div className="announcement-time">
                      {new Date(ann.sent_at).toLocaleString()}
                    </div>
                    <div className="announcement-msg">{ann.message}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Settings */}
      {activeTab === 'settings' && (
        <div style={{ maxWidth: '500px' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Event Settings</h2>
          
          <form onSubmit={handleUpdateSettings} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">Event Status</label>
              <select 
                className="form-control" 
                value={eventStatus} 
                onChange={(e) => setEventStatus(e.target.value)}
              >
                <option value="Draft">Draft (Private)</option>
                <option value="Published">Published (Public)</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Attendee Capacity</label>
              <input 
                type="number" 
                className="form-control" 
                min="1"
                required
                value={eventCapacity} 
                onChange={(e) => setEventCapacity(e.target.value)}
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={updatingSettings}
              style={{ alignSelf: 'flex-end', marginTop: '0.5rem' }}
            >
              {updatingSettings ? 'Saving...' : 'Save Settings'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
