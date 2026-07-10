'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CalendarIcon, MapPinIcon, UsersIcon, SearchIcon } from '@/app/components/Icons';

export default function DiscoveryPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [categories] = useState(['All', 'Workshop', 'Fair', 'Social Gathering', 'Cleanup Drive', 'Cultural Gathering', 'Other']);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (category && category !== 'All') queryParams.append('category', category);
      if (search) queryParams.append('search', search);
      
      const res = await fetch(`/api/events?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch (err) {
      console.error('Error fetching discovery events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [category]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchEvents();
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  return (
    <div>
      {/* Hero Section */}
      <div className="search-banner">
        <div style={{
          position: 'absolute',
          top: '-50%',
          left: '-20%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
          zIndex: 0,
          pointerEvents: 'none'
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '-50%',
          right: '-20%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)',
          zIndex: 0,
          pointerEvents: 'none'
        }}></div>
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <span style={{ 
            fontSize: '0.8rem', 
            fontWeight: '800', 
            letterSpacing: '0.15em', 
            textTransform: 'uppercase', 
            color: '#818cf8',
            background: 'rgba(99,102,241,0.1)',
            padding: '0.35rem 0.85rem',
            borderRadius: '50px',
            border: '1px solid rgba(99,102,241,0.2)'
          }}>
            Local Community Event Platform
          </span>
          <h1 className="search-banner-title" style={{ marginTop: '1rem', fontSize: '3rem' }}>
            Where Communities <span style={{ background: 'linear-gradient(135deg, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Gather</span>
          </h1>
          <p style={{ maxWidth: '600px', color: 'var(--text-secondary)', margin: '0 auto 2rem auto', fontSize: '1.1rem' }}>
            Discover upcoming workshops, neighborhood cleanups, social gatherings, and volunteer opportunities near you.
          </p>
          
          <div className="search-inputs">
            <div style={{ flex: 2, display: 'flex', alignItems: 'center', background: 'rgba(17,24,39,0.3)', borderRadius: '10px', padding: '0 0.75rem', border: '1px solid rgba(255,255,255,0.05)' }}>
              <SearchIcon style={{ color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="Search events by title, keywords or location..." 
                className="form-control"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ border: 'none', background: 'transparent', boxShadow: 'none' }}
              />
            </div>
            
            <select 
              className="form-control" 
              value={category} 
              onChange={(e) => setCategory(e.target.value)}
              style={{ flex: 1, appearance: 'none', backgroundPosition: 'right 1rem center', cursor: 'pointer' }}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat === 'All' ? 'All Categories' : cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Category Pills Slider */}
      <div style={{ 
        display: 'flex', 
        gap: '0.75rem', 
        overflowX: 'auto', 
        paddingBottom: '0.75rem',
        marginBottom: '2.5rem',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className="btn"
            style={{ 
              borderRadius: '50px',
              padding: '0.5rem 1.25rem',
              fontSize: '0.85rem',
              background: category === cat ? 'var(--primary-gradient)' : 'rgba(255,255,255,0.02)',
              color: category === cat ? '#fff' : 'var(--text-secondary)',
              border: '1px solid ' + (category === cat ? 'transparent' : 'var(--border-color)'),
              whiteSpace: 'nowrap'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Events Grid Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '800' }}>Featured Community Events</h2>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Showing {events.length} event{events.length !== 1 ? 's' : ''}
        </span>
      </div>
      
      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem' }}>Fetching community activities...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="card" style={{ padding: '5rem 2rem', textAlign: 'center', alignItems: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📅</div>
          <h3 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>No events scheduled</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', fontSize: '0.95rem' }}>
            We couldn't find any published events matching your filters. Try adjusting your search query or category filter.
          </p>
        </div>
      ) : (
        <div className="grid-layout">
          {events.map((evt) => {
            const date = new Date(evt.date_time).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });
            
            return (
              <div key={evt.id} className="card">
                <div className="card-img-wrapper">
                  <img src={evt.banner_url} alt={evt.title} className="card-img" />
                </div>
                <div className="card-content">
                  <span className="card-category">{evt.category}</span>
                  <h3 className="card-title">{evt.title}</h3>
                  
                  <div className="card-meta">
                    <div className="meta-item">
                      <CalendarIcon style={{ color: 'var(--primary-color)' }} />
                      <span>{date}</span>
                    </div>
                    <div className="meta-item">
                      <MapPinIcon style={{ color: 'var(--primary-color)' }} />
                      <span>{evt.location}</span>
                    </div>
                    <div className="meta-item">
                      <UsersIcon style={{ color: 'var(--primary-color)' }} />
                      <span>{evt.registered_count} / {evt.capacity} attending</span>
                    </div>
                  </div>
                  
                  <div className="card-footer">
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 'bold', color: 'var(--text-muted)' }}>Organizer</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>{evt.organizer_name}</span>
                    </div>
                    <Link href={`/events/${evt.id}`} className="btn btn-primary" style={{ padding: '0.5rem 1.1rem', fontSize: '0.8rem', borderRadius: '8px' }}>
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Platform Features Marketing Block */}
      <div style={{ marginTop: '5rem', borderTop: '1px solid var(--border-color)', paddingTop: '4rem' }}>
        <h2 style={{ textAlign: 'center', fontSize: '2rem', marginBottom: '2.5rem' }}>Features Ready to Scale on Azure</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
          <div className="card" style={{ padding: '2rem', background: 'rgba(255,255,255,0.01)' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🚀</span> Fast Hosting
            </h3>
            <p style={{ fontSize: '0.9rem' }}>
              Powered by high-availability Azure Virtual Machines (VMs) ensuring seamless performance and consistent load times for event listings.
            </p>
          </div>
          <div className="card" style={{ padding: '2rem', background: 'rgba(255,255,255,0.01)' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🔒</span> Secure Data
            </h3>
            <p style={{ fontSize: '0.9rem' }}>
              Built with Azure SQL Database for enterprise-grade data isolation, capacity limits, user records, and volunteer rosters security.
            </p>
          </div>
          <div className="card" style={{ padding: '2rem', background: 'rgba(255,255,255,0.01)' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🔔</span> Event Notifications
            </h3>
            <p style={{ fontSize: '0.9rem' }}>
              Integrates with Azure Functions and Azure Communication Services to dispatch instant email registrations and announcements.
            </p>
          </div>
        </div>
      </div>

      {/* Market Ready Footer */}
      <footer style={{ marginTop: '6rem', borderTop: '1px solid var(--border-color)', padding: '2rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          © {new Date().getFullYear()} CommunityHub Platform. Built for VIT Internship AZ-900 Project.
        </span>
        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <span style={{ cursor: 'pointer' }} onClick={() => alert('Platform Mockup: Terms of Service')}>Terms</span>
          <span style={{ cursor: 'pointer' }} onClick={() => alert('Platform Mockup: Privacy Policy')}>Privacy</span>
          <span style={{ cursor: 'pointer' }} onClick={() => alert('Platform Mockup: Support Center')}>Support</span>
        </div>
      </footer>
    </div>
  );
}
