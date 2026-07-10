import fs from 'fs';
import path from 'path';
import { EmailClient } from '@azure/communication-email';

const acsConnectionString = process.env.AZURE_COMMUNICATION_SERVICES_CONNECTIONSTRING;
const senderAddress = process.env.AZURE_COMMUNICATION_EMAIL_SENDER; // e.g. "donotreply@yourdomain.azurecomm.net"

let emailClient = null;

if (acsConnectionString) {
  try {
    emailClient = new EmailClient(acsConnectionString);
    console.log('Azure Communication Services EmailClient initialized');
  } catch (err) {
    console.error('Failed to initialize ACS EmailClient:', err);
  }
}

/**
 * Sends a notification. If Azure Communication Services is configured, it sends an email.
 * Otherwise, it logs to a local file for the UI notification preview feed.
 */
export async function sendNotification(type, payload) {
  const timestamp = new Date().toISOString();
  
  let subject = '';
  let bodyHtml = '';
  
  // Define notification templates
  if (type === 'registration') {
    const isWaitlist = payload.status === 'Waitlisted';
    subject = isWaitlist 
      ? `Waitlisted: ${payload.eventTitle}` 
      : `Registration Confirmed: ${payload.eventTitle}`;
    bodyHtml = `
      <h1>Hello, ${payload.userName}!</h1>
      <p>${isWaitlist 
        ? `The event <strong>${payload.eventTitle}</strong> is currently full. You have been added to the waitlist.` 
        : `Your registration for <strong>${payload.eventTitle}</strong> has been successfully confirmed.`
      }</p>
      <p>We look forward to seeing you there!</p>
      <hr/>
      <small>CommunityHub Event Platform</small>
    `;
  } else if (type === 'volunteer_signup') {
    subject = `Volunteer Sign-up Confirmed: ${payload.eventTitle}`;
    bodyHtml = `
      <h1>Thank you for volunteering, ${payload.userName}!</h1>
      <p>You have successfully signed up for the following role:</p>
      <ul>
        <li><strong>Role:</strong> ${payload.roleTitle}</li>
        <li><strong>Shift/Time:</strong> ${payload.shiftTime}</li>
        <li><strong>Event:</strong> ${payload.eventTitle}</li>
      </ul>
      <p>Your support makes our community events possible!</p>
      <hr/>
      <small>CommunityHub Event Platform</small>
    `;
  } else if (type === 'announcement_broadcast') {
    subject = `Important Announcement: ${payload.eventTitle}`;
    bodyHtml = `
      <h1>Update for ${payload.eventTitle}</h1>
      <p>${payload.message}</p>
      <hr/>
      <p>Please check the event page for more real-time updates.</p>
      <small>CommunityHub Event Platform</small>
    `;
  }

  // 1. Send via Azure Communication Services if configured
  if (emailClient && senderAddress) {
    try {
      if (type === 'announcement_broadcast') {
        // Send to all recipients
        for (const recipient of payload.recipients) {
          const emailMessage = {
            senderAddress: senderAddress,
            content: {
              subject: subject,
              html: bodyHtml.replace('${payload.userName}', recipient.name),
            },
            recipients: {
              to: [{ address: recipient.email, displayName: recipient.name }],
            },
          };
          
          await emailClient.beginSend(emailMessage);
        }
      } else {
        const emailMessage = {
          senderAddress: senderAddress,
          content: {
            subject: subject,
            html: bodyHtml,
          },
          recipients: {
            to: [{ address: payload.userEmail, displayName: payload.userName }],
          },
        };
        
        await emailClient.beginSend(emailMessage);
      }
      console.log(`ACS Email sent for ${type} notification`);
    } catch (err) {
      console.error('Failed to send email via ACS:', err);
    }
  }

  // 2. Always log to local JSON file for the UI preview panel (very useful for local demo/validation!)
  try {
    const notifyLogPath = path.join(process.cwd(), 'public', 'notifications.json');
    
    // Ensure parent directory exists
    const dir = path.dirname(notifyLogPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    let notifications = [];
    if (fs.existsSync(notifyLogPath)) {
      try {
        const content = fs.readFileSync(notifyLogPath, 'utf8');
        notifications = JSON.parse(content);
      } catch (e) {
        notifications = [];
      }
    }
    
    const newLog = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      type,
      subject,
      timestamp,
      payload
    };
    
    // Keep last 50 notifications
    notifications.unshift(newLog);
    if (notifications.length > 50) {
      notifications = notifications.slice(0, 50);
    }
    
    fs.writeFileSync(notifyLogPath, JSON.stringify(notifications, null, 2), 'utf8');
    console.log(`Logged notification ${newLog.id} to local preview file`);
  } catch (logErr) {
    console.error('Failed to write local notification log:', logErr);
  }
}
