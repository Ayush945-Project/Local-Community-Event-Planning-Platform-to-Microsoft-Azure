import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const notifyLogPath = path.join(process.cwd(), 'public', 'notifications.json');
    if (!fs.existsSync(notifyLogPath)) {
      return NextResponse.json({ notifications: [] });
    }
    
    const content = fs.readFileSync(notifyLogPath, 'utf8');
    const notifications = JSON.parse(content);
    return NextResponse.json({ notifications });
  } catch (err) {
    console.error('Fetch notifications log error:', err);
    return NextResponse.json({ notifications: [] });
  }
}
