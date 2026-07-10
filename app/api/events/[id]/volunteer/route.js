import { execute, query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { sendNotification } from '@/lib/notification';
import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const user = await getSessionUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Please sign in to sign up' }, { status: 401 });
    }
    
    if (user.role !== 'volunteer') {
      return NextResponse.json({ error: 'Only accounts registered as Volunteers can sign up for roles.' }, { status: 403 });
    }
    
    const body = await request.json();
    const { roleId } = body;
    
    if (!roleId) {
      return NextResponse.json({ error: 'Missing role selection' }, { status: 400 });
    }
    
    // Check if role exists and belongs to the event
    const roles = await query(
      'SELECT vr.*, e.title as event_title FROM VolunteerRoles vr JOIN Events e ON vr.event_id = e.id WHERE vr.id = ? AND vr.event_id = ?',
      [roleId, id]
    );
    if (!roles || roles.length === 0) {
      return NextResponse.json({ error: 'Volunteer role not found' }, { status: 404 });
    }
    
    const role = roles[0];
    
    // Check if user is already assigned to this role
    const existing = await query(
      'SELECT id, status FROM VolunteerAssignments WHERE role_id = ? AND user_id = ?',
      [roleId, user.id]
    );
    if (existing && existing.length > 0) {
      return NextResponse.json({ error: `You are already assigned to this role (Status: ${existing[0].status})` }, { status: 400 });
    }
    
    // Check capacity
    const filledResult = await query(
      "SELECT COUNT(*) as count FROM VolunteerAssignments WHERE role_id = ? AND status = 'Assigned'",
      [roleId]
    );
    const filledCount = filledResult[0]?.count || 0;
    
    if (filledCount >= role.capacity) {
      return NextResponse.json({ error: 'This volunteer shift is full.' }, { status: 400 });
    }
    
    await execute(
      "INSERT INTO VolunteerAssignments (role_id, user_id, status) VALUES (?, ?, 'Assigned')",
      [roleId, user.id]
    );
    
    // Trigger notification
    try {
      await sendNotification('volunteer_signup', {
        userEmail: user.email,
        userName: user.name,
        userPhone: user.phone,
        eventTitle: role.event_title,
        roleTitle: role.title,
        shiftTime: role.shift_time,
        eventId: id
      });
    } catch (notifErr) {
      console.error('Notification trigger failed:', notifErr);
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Successfully signed up for this volunteer role!'
    });
  } catch (err) {
    console.error('Volunteer sign-up error:', err);
    return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 });
  }
}
