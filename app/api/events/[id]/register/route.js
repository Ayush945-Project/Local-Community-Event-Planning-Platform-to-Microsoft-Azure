import { execute, query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { sendNotification } from '@/lib/notification';
import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const user = await getSessionUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Please sign in to register' }, { status: 401 });
    }
    
    // Check if event exists and get capacity
    const events = await query('SELECT title, capacity, status FROM Events WHERE id = ?', [id]);
    if (!events || events.length === 0) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    
    const event = events[0];
    if (event.status !== 'Published') {
      return NextResponse.json({ error: 'Registrations are not open for this event' }, { status: 400 });
    }
    
    // Check if already registered
    const existing = await query(
      'SELECT id, status FROM Registrations WHERE event_id = ? AND user_id = ?',
      [id, user.id]
    );
    if (existing && existing.length > 0) {
      return NextResponse.json({ error: `You are already ${existing[0].status.toLowerCase()} for this event` }, { status: 400 });
    }
    
    // Check capacity
    const regCountResult = await query(
      "SELECT COUNT(*) as count FROM Registrations WHERE event_id = ? AND status = 'Registered'",
      [id]
    );
    const registeredCount = regCountResult[0]?.count || 0;
    
    let registrationStatus = 'Registered';
    if (registeredCount >= event.capacity) {
      registrationStatus = 'Waitlisted';
    }
    
    await execute(
      'INSERT INTO Registrations (event_id, user_id, status) VALUES (?, ?, ?)',
      [id, user.id, registrationStatus]
    );
    
    // Trigger notification
    try {
      await sendNotification('registration', {
        userEmail: user.email,
        userName: user.name,
        userPhone: user.phone,
        eventTitle: event.title,
        eventId: id,
        status: registrationStatus
      });
    } catch (notifErr) {
      console.error('Notification trigger failed:', notifErr);
    }
    
    return NextResponse.json({ 
      success: true, 
      status: registrationStatus,
      message: registrationStatus === 'Waitlisted' 
        ? 'Event is at capacity. You have been added to the waitlist.'
        : 'Registration successful!'
    });
  } catch (err) {
    console.error('Registration RSVP error:', err);
    return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 });
  }
}
