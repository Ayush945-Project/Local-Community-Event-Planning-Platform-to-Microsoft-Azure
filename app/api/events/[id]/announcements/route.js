import { execute, query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { sendNotification } from '@/lib/notification';
import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const user = await getSessionUser();
    
    if (!user || user.role !== 'organizer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Verify ownership
    const events = await query('SELECT title, organizer_id FROM Events WHERE id = ?', [id]);
    if (!events || events.length === 0) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    
    const event = events[0];
    if (event.organizer_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const body = await request.json();
    const { message } = body;
    
    if (!message || message.trim().length === 0) {
      return NextResponse.json({ error: 'Announcement message cannot be empty' }, { status: 400 });
    }
    
    // Insert announcement
    const result = await execute(
      'INSERT INTO Announcements (event_id, message) VALUES (?, ?)',
      [id, message.trim()]
    );
    
    // Get all registrants and volunteers contact details to broadcast notifications
    const registrants = await query(
      `SELECT u.name, u.email, u.phone 
       FROM Registrations r
       JOIN Users u ON r.user_id = u.id
       WHERE r.event_id = ? AND r.status = 'Registered'`,
      [id]
    );
    
    const volunteers = await query(
      `SELECT DISTINCT u.name, u.email, u.phone 
       FROM VolunteerAssignments va
       JOIN VolunteerRoles vr ON va.role_id = vr.id
       JOIN Users u ON va.user_id = u.id
       WHERE vr.event_id = ? AND va.status = 'Assigned'`,
      [id]
    );
    
    // Combine lists
    const recipients = [];
    const emailsSeen = new Set();
    
    [...registrants, ...volunteers].forEach(p => {
      if (p.email && !emailsSeen.has(p.email)) {
        emailsSeen.add(p.email);
        recipients.push({ name: p.name, email: p.email, phone: p.phone });
      }
    });
    
    // Trigger notification broadcast
    try {
      await sendNotification('announcement_broadcast', {
        eventTitle: event.title,
        eventId: id,
        message: message.trim(),
        recipients
      });
    } catch (notifErr) {
      console.error('Broadcast notification failed:', notifErr);
    }
    
    return NextResponse.json({ 
      success: true, 
      announcementId: result.insertId,
      recipientCount: recipients.length
    });
  } catch (err) {
    console.error('Post announcement error:', err);
    return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 });
  }
}
