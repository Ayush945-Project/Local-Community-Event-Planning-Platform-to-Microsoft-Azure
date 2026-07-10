import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { initializeDatabase } from '@/lib/init-db';
import { notFound } from 'next/navigation';
import EventPageClient from './EventPageClient';

export const dynamic = 'force-dynamic';

/**
 * Generate Open Graph Metadata dynamically for search engine and social preview indexing.
 */
export async function generateMetadata({ params }) {
  const { id } = await params;
  try {
    await initializeDatabase();
    const events = await query('SELECT title, description, banner_url FROM Events WHERE id = ?', [id]);
    if (!events || events.length === 0) return { title: 'Event Not Found | CommunityHub' };
    
    const event = events[0];
    return {
      title: `${event.title} | CommunityHub`,
      description: event.description || 'Join this local community event!',
      openGraph: {
        title: event.title,
        description: event.description || 'Join this local community event!',
        images: [{ url: event.banner_url }],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: event.title,
        description: event.description || 'Join this local community event!',
        images: [event.banner_url],
      }
    };
  } catch (err) {
    console.error('Metadata generation error:', err);
    return { title: 'CommunityHub Event' };
  }
}

export default async function EventDetailPage({ params }) {
  const { id } = await params;
  
  // Initialize DB
  await initializeDatabase();
  
  const user = await getSessionUser();
  
  // 1. Fetch Event Details
  const events = await query(
    `SELECT e.*, u.name as organizer_name, u.email as organizer_email, u.phone as organizer_phone
     FROM Events e
     JOIN Users u ON e.organizer_id = u.id
     WHERE e.id = ?`,
    [id]
  );
  
  if (!events || events.length === 0) {
    notFound();
  }
  
  const event = events[0];
  
  // 2. Fetch Volunteer Roles
  const volunteerRoles = await query(
    `SELECT vr.*, 
     (SELECT COUNT(*) FROM VolunteerAssignments va WHERE va.role_id = vr.id AND va.status = 'Assigned') as filled_count
     FROM VolunteerRoles vr
     WHERE vr.event_id = ?`,
    [id]
  );
  
  // 3. Fetch Announcements
  const announcements = await query(
    'SELECT * FROM Announcements WHERE event_id = ? ORDER BY sent_at DESC',
    [id]
  );
  
  // 4. Fetch Registration Count
  const regCountResult = await query(
    "SELECT COUNT(*) as count FROM Registrations WHERE event_id = ? AND status = 'Registered'",
    [id]
  );
  const registeredCount = regCountResult[0]?.count || 0;
  
  // 5. Fetch User RSVP and Volunteer states if logged in
  let userRegistrationStatus = null;
  let userVolunteerStatus = null;
  
  if (user) {
    const userReg = await query(
      'SELECT status FROM Registrations WHERE event_id = ? AND user_id = ?',
      [id, user.id]
    );
    userRegistrationStatus = userReg && userReg.length > 0 ? userReg[0].status : null;
    
    const userVol = await query(
      `SELECT va.status, vr.title, vr.shift_time
       FROM VolunteerAssignments va
       JOIN VolunteerRoles vr ON va.role_id = vr.id
       WHERE vr.event_id = ? AND va.user_id = ?`,
      [id, user.id]
    );
    userVolunteerStatus = userVol && userVol.length > 0 ? userVol[0] : null;
  }
  
  const initialData = {
    event,
    volunteerRoles,
    announcements,
    userRegistrationStatus,
    userVolunteerStatus,
    registeredCount
  };

  return <EventPageClient initialData={initialData} currentUser={user} />;
}
