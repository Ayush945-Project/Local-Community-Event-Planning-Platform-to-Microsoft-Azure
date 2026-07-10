import { execute, query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { uploadFile } from '@/lib/storage';
import { NextResponse } from 'next/server';

/**
 * GET /api/events
 * Public discovery endpoint to list and search events
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    
    let sql = `
      SELECT e.*, u.name as organizer_name,
             (SELECT COUNT(*) FROM Registrations r WHERE r.event_id = e.id AND r.status = 'Registered') as registered_count
      FROM Events e
      JOIN Users u ON e.organizer_id = u.id
      WHERE e.status = 'Published'
    `;
    const params = [];
    
    if (category && category !== 'All') {
      sql += ' AND e.category = ?';
      params.push(category);
    }
    
    if (search) {
      sql += ' AND (e.title LIKE ? OR e.description LIKE ? OR e.location LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }
    
    sql += ' ORDER BY e.date_time ASC';
    
    const events = await query(sql, params);
    return NextResponse.json({ events });
  } catch (err) {
    console.error('List events API error:', err);
    return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 });
  }
}

/**
 * POST /api/events
 * Create a new event (Organizer only)
 */
export async function POST(request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'organizer') {
      return NextResponse.json({ error: 'Unauthorized. Organizers only.' }, { status: 403 });
    }
    
    const formData = await request.formData();
    const title = formData.get('title');
    const description = formData.get('description');
    const category = formData.get('category');
    const dateTime = formData.get('date_time');
    const location = formData.get('location');
    const capacity = parseInt(formData.get('capacity') || '0', 10);
    const status = formData.get('status') || 'Draft';
    const bannerFile = formData.get('banner');
    const volunteerRolesJson = formData.get('volunteer_roles'); // JSON string array
    
    if (!title || !category || !dateTime || !location || !capacity) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Upload banner if present
    let bannerUrl = '';
    if (bannerFile && bannerFile.size > 0) {
      const bytes = await bannerFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      bannerUrl = await uploadFile(buffer, bannerFile.name, bannerFile.type);
    } else {
      // Default placeholder banner
      bannerUrl = 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=60';
    }
    
    // Insert event
    const eventResult = await execute(
      `INSERT INTO Events (organizer_id, title, description, category, date_time, location, capacity, banner_url, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [user.id, title, description, category, dateTime, location, capacity, bannerUrl, status]
    );
    
    let eventId = eventResult.insertId;
    if (!eventId) {
      // Fallback for SQL Server if output param wasn't returned
      const latestEvents = await query('SELECT id FROM Events WHERE organizer_id = ? ORDER BY created_at DESC', [user.id]);
      if (latestEvents && latestEvents.length > 0) {
        eventId = latestEvents[0].id;
      }
    }
    
    // Insert Volunteer Roles if provided
    if (volunteerRolesJson && eventId) {
      try {
        const roles = JSON.parse(volunteerRolesJson);
        if (Array.isArray(roles)) {
          for (const role of roles) {
            if (role.title && role.capacity) {
              await execute(
                `INSERT INTO VolunteerRoles (event_id, title, shift_time, capacity, description)
                 VALUES (?, ?, ?, ?, ?)`,
                [eventId, role.title, role.shift_time || 'All Day', parseInt(role.capacity, 10), role.description || '']
              );
            }
          }
        }
      } catch (e) {
        console.error('Error parsing/inserting volunteer roles:', e);
      }
    }
    
    return NextResponse.json({ success: true, eventId });
  } catch (err) {
    console.error('Create event API error:', err);
    return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 });
  }
}
