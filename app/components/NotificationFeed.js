'use client';

import { useState, useEffect } from 'react';

export default function NotificationFeed() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 3 seconds to show live updates
    const interval = setInterval(fetchNotifications, 3000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Loading live logs...</p>;
  }

  return (
    <div style={{ 
      background: 'var(--card-bg)', 
      border: '1px solid var(--border-color)', 
      borderRadius: '16px', 
      padding: '1.25rem',
      maxHeight: '480px',
      overflowY: 'auto'
    }}>
      {notifications.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0', fontSize: '0.9rem' }}>
          No notifications sent yet. Triggered events will display here in real time.
        </p>
      ) : (
        <div style={{ display: 'flex', flexSpread: 'column', flexDirection: 'column', gap: '1rem' }}>
          {notifications.map((notif) => {
            const time = new Date(notif.timestamp).toLocaleTimeString();
            let badgeColor = 'var(--primary-color)';
            if (notif.type === 'registration') badgeColor = 'var(--secondary-color)';
            if (notif.type === 'announcement_broadcast') badgeColor = 'var(--warning-color)';
            
            return (
              <div 
                key={notif.id} 
                style={{ 
                  background: 'rgba(255,255,255,0.02)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '10px',
                  padding: '0.75rem',
                  fontSize: '0.85rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ 
                    fontWeight: 'bold', 
                    fontSize: '0.7rem', 
                    textTransform: 'uppercase', 
                    color: badgeColor,
                    background: 'rgba(255,255,255,0.04)',
                    padding: '0.1rem 0.4rem',
                    borderRadius: '4px'
                  }}>
                    {notif.type.replace('_', ' ')}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>🕒 {time}</span>
                </div>
                <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                  {notif.subject}
                </div>
                {notif.type === 'announcement_broadcast' ? (
                  <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.8rem', background: 'rgba(255,255,255,0.01)', padding: '0.4rem', borderRadius: '6px', borderLeft: '2px solid var(--warning-color)' }}>
                    "{notif.payload.message}"
                  </div>
                ) : notif.type === 'registration' ? (
                  <div style={{ color: 'var(--text-secondary)' }}>
                    Recipient: {notif.payload.userName} ({notif.payload.userEmail})<br />
                    Status: <strong style={{ color: notif.payload.status === 'Waitlisted' ? 'var(--warning-color)' : 'var(--secondary-color)' }}>{notif.payload.status}</strong>
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-secondary)' }}>
                    Recipient: {notif.payload.userName} ({notif.payload.userEmail})<br />
                    Role: <strong>{notif.payload.roleTitle}</strong> ({notif.payload.shiftTime})
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
