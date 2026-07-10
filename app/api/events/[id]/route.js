import { execute, query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

/**
 * GET /api/events/[id]
 * Fetch single event details including volunteer roles, announcements,
 * and if logged in as the organizer, registrant list and volunteer roster.
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const user = await getSessionUser();
    
    // Fetch event details
    const events = await query(
      `SELECT e.*, u.name as organizer_name, u.email as organizer_email, u.phone as organizer_phone
       FROM Events e
       JOIN Users u ON e.organizer_id = u.id
       WHERE e.id = ?`,
      [id]
    );
    
    if (!events || events.length === 0) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    
    const event = events[0];
    const isOrganizer = user && user.id === event.organizer_id;
    
    // Fetch volunteer roles
    const volunteerRoles = await query(
      `SELECT vr.*, 
       (SELECT COUNT(*) FROM VolunteerAssignments va WHERE va.role_id = vr.id AND va.status = 'Assigned') as filled_count
       FROM VolunteerRoles vr
       WHERE vr.event_id = ?`,
      [id]
    );
    
    // Fetch announcements
    const announcements = await query(
      'SELECT * FROM Announcements WHERE event_id = ? ORDER BY sent_at DESC',
      [id]
    );
    
    // Build response payload
    const payload = {
      event,
      volunteerRoles,
      announcements
    };
    
    // Add sensitive attendee and volunteer list only if requester is the Organizer
    if (isOrganizer) {
      // Fetch registrations
      payload.registrations = await query(
        `SELECT r.id, r.status, r.registered_at, u.name, u.email, u.phone
         FROM Registrations r
         JOIN Users u ON r.user_id = u.id
         WHERE r.event_id = ?
         ORDER BY r.registered_at DESC`,
        [id]
      );
      
      // Fetch volunteer assignments roster
      payload.volunteerAssignments = await query(
        `SELECT va.id, va.status, va.assigned_at, vr.title as role_title, vr.shift_time, u.name, u.email, u.phone
         FROM VolunteerAssignments va
         JOIN VolunteerRoles vr ON va.role_id = vr.id
         JOIN Users u ON va.user_id = u.id
         WHERE vr.event_id = ?
         ORDER BY va.assigned_at DESC`,
        [id]
      );
    } else if (user) {
      // Check if current user is registered/volunteered for this event
      const userRegistration = await query(
        'SELECT status FROM Registrations WHERE event_id = ? AND user_id = ?',
        [id, user.id]
      );
      payload.userRegistrationStatus = userRegistration && userRegistration.length > 0 ? userRegistration[0].status : null;
      
      const userVolunteered = await query(
        `SELECT va.status, vr.title, vr.shift_time
         FROM VolunteerAssignments va
         JOIN VolunteerRoles vr ON va.role_id = vr.id
         WHERE vr.event_id = ? AND va.user_id = ?`,
        [id, user.id]
      );
      payload.userVolunteerStatus = userVolunteered && userVolunteered.length > 0 ? userVolunteered[0] : null;
    }
    
    // Total registration count for public display
    const regCountResult = await query(
      "SELECT COUNT(*) as count FROM Registrations WHERE event_id = ? AND status = 'Registered'",
      [id]
    );
    payload.registeredCount = regCountResult[0]?.count || 0;
    
    return NextResponse.json(payload);
  } catch (err) {
    console.error('Fetch event details error:', err);
    return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 });
  }
}

/**
 * PUT /api/events/[id]
 * Update an event's details or status (Organizer only)
 */
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const user = await getSessionUser();
    
    if (!user || user.role !== 'organizer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Verify ownership
    const events = await query('SELECT organizer_id FROM Events WHERE id = ?', [id]);
    if (!events || events.length === 0) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    
    if (events[0].organizer_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden. You do not own this event.' }, { status: 403 });
    }
    
    const body = await request.json();
    const { title, description, category, date_time, location, capacity, status } = body;
    
    if (!title || !category || !date_time || !location || !capacity || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    await execute(
      `UPDATE Events 
       SET title = ?, description = ?, category = ?, date_time = ?, location = ?, capacity = ?, status = ?
       WHERE id = ?`,
      [title, description, category, date_time, location, capacity, status, id]
    );
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Update event error:', err);
    return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 });
  }
}
