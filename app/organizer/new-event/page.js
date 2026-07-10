'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewEventPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Workshop',
    date_time: '',
    location: '',
    capacity: '50',
    status: 'Published'
  });
  const [banner, setBanner] = useState(null);
  
  // Volunteer roles dynamic list
  const [roles, setRoles] = useState([]);
  const [newRole, setNewRole] = useState({
    title: '',
    shift_time: '',
    capacity: '2',
    description: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleBannerChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setBanner(e.target.files[0]);
    }
  };

  const handleAddRole = () => {
    if (!newRole.title || !newRole.capacity) {
      alert('Role title and capacity are required');
      return;
    }
    setRoles([...roles, newRole]);
    setNewRole({
      title: '',
      shift_time: '',
      capacity: '2',
      description: ''
    });
  };

  const handleRemoveRole = (index) => {
    setRoles(roles.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const payload = new FormData();
    payload.append('title', formData.title);
    payload.append('description', formData.description);
    payload.append('category', formData.category);
    payload.append('date_time', formData.date_time);
    payload.append('location', formData.location);
    payload.append('capacity', formData.capacity);
    payload.append('status', formData.status);
    
    if (banner) {
      payload.append('banner', banner);
    }
    
    if (roles.length > 0) {
      payload.append('volunteer_roles', JSON.stringify(roles));
    }

    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        body: payload
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create event');
      }

      router.push('/organizer/dashboard');
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto' }}>
      <h1 style={{ marginBottom: '0.25rem' }}>Create Community Event</h1>
      <p style={{ marginBottom: '2rem' }}>Fill out the details below to publish your event page and recruit volunteers.</p>

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

      <form onSubmit={handleSubmit} className="card" style={{ padding: '2.5rem', gap: '1.5rem', display: 'flex', flexDirection: 'column' }}>
        
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
          <div className="form-group">
            <label className="form-label">Event Title</label>
            <input 
              type="text" 
              name="title" 
              className="form-control" 
              placeholder="E.g., Central Park Cleanup Drive" 
              required
              value={formData.title}
              onChange={handleChange}
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Category</label>
            <select name="category" className="form-control" value={formData.category} onChange={handleChange}>
              <option value="Workshop">Workshop</option>
              <option value="Fair">Fair / Festival</option>
              <option value="Social Gathering">Social Gathering</option>
              <option value="Cleanup Drive">Cleanup Drive</option>
              <option value="Cultural Gathering">Cultural Gathering</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea 
            name="description" 
            className="form-control" 
            rows="4" 
            placeholder="Describe the event, schedule, requirements, etc."
            value={formData.description}
            onChange={handleChange}
          ></textarea>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
          <div className="form-group">
            <label className="form-label">Date & Time</label>
            <input 
              type="datetime-local" 
              name="date_time" 
              className="form-control" 
              required
              value={formData.date_time}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Location / Address</label>
            <input 
              type="text" 
              name="location" 
              className="form-control" 
              placeholder="E.g., Community Hall Room B" 
              required
              value={formData.location}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Max Capacity (Attendees)</label>
            <input 
              type="number" 
              name="capacity" 
              className="form-control" 
              min="1"
              required
              value={formData.capacity}
              onChange={handleChange}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div className="form-group">
            <label className="form-label">Event Banner Image</label>
            <input 
              type="file" 
              accept="image/*" 
              className="form-control" 
              onChange={handleBannerChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Publishing Status</label>
            <select name="status" className="form-control" value={formData.status} onChange={handleChange}>
              <option value="Published">Published (Publicly Visible)</option>
              <option value="Draft">Draft (Private to Dashboard)</option>
            </select>
          </div>
        </div>

        {/* Volunteer Roles Planner */}
        <div style={{ 
          marginTop: '1.5rem', 
          borderTop: '1px solid var(--border-color)', 
          paddingTop: '1.5rem' 
        }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Volunteer Roles & Shifts</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Recruit volunteers by creating shifts or tasks. Volunteers will be able to browse and sign up for these roles.
          </p>

          {/* Current Roles Added */}
          {roles.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {roles.map((r, index) => (
                <div key={index} style={{ 
                  background: 'rgba(255,255,255,0.03)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '10px', 
                  padding: '0.75rem 1.25rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <strong style={{ color: 'var(--primary-color)' }}>{r.title}</strong>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: '1rem' }}>
                      🕒 {r.shift_time} | 👥 Limit: {r.capacity}
                    </span>
                    {r.description && <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>{r.description}</p>}
                  </div>
                  <button 
                    type="button" 
                    className="btn btn-danger" 
                    style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                    onClick={() => handleRemoveRole(index)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add Role Form Inline */}
          <div style={{ 
            background: 'rgba(255,255,255,0.02)', 
            border: '1px solid var(--border-color)', 
            borderRadius: '12px',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr', gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <input 
                  type="text" 
                  placeholder="Role Title (e.g. Registration Desk)" 
                  className="form-control"
                  value={newRole.title}
                  onChange={(e) => setNewRole({ ...newRole, title: e.target.value })}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <input 
                  type="text" 
                  placeholder="Shift Time (e.g. 9:00 AM - 12:00 PM)" 
                  className="form-control"
                  value={newRole.shift_time}
                  onChange={(e) => setNewRole({ ...newRole, shift_time: e.target.value })}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <input 
                  type="number" 
                  placeholder="Capacity" 
                  className="form-control"
                  min="1"
                  value={newRole.capacity}
                  onChange={(e) => setNewRole({ ...newRole, capacity: e.target.value })}
                />
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <input 
                type="text" 
                placeholder="Role Description (optional)" 
                className="form-control"
                value={newRole.description}
                onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
              />
              <button 
                type="button" 
                className="btn btn-secondary" 
                style={{ whiteSpace: 'nowrap' }}
                onClick={handleAddRole}
              >
                + Add Role
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={() => router.push('/organizer/dashboard')}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading}
          >
            {loading ? 'Creating Event...' : 'Publish Event'}
          </button>
        </div>
      </form>
    </div>
  );
}
