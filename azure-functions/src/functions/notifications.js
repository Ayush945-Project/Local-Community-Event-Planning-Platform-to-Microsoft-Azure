const { app } = require('@azure/functions');
const { EmailClient } = require('@azure/communication-email');

const acsConnectionString = process.env.AZURE_COMMUNICATION_SERVICES_CONNECTIONSTRING;
const senderAddress = process.env.AZURE_COMMUNICATION_EMAIL_SENDER;

let emailClient = null;
if (acsConnectionString) {
  try {
    emailClient = new EmailClient(acsConnectionString);
  } catch (err) {
    console.error('Failed to initialize ACS EmailClient in Azure Function:', err);
  }
}

// 1. Trigger for New Registration
app.http('onRegistration', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    context.log(`Processing registration notification trigger`);
    
    try {
      const data = await request.json();
      const { userEmail, userName, eventTitle, status } = data;
      
      if (!userEmail || !userName || !eventTitle || !status) {
        return { status: 400, body: 'Missing required parameters' };
      }
      
      const isWaitlist = status === 'Waitlisted';
      const subject = isWaitlist 
        ? `Waitlisted: ${eventTitle}` 
        : `Registration Confirmed: ${eventTitle}`;
        
      const bodyHtml = `
        <h1>Hello, ${userName}!</h1>
        <p>${isWaitlist 
          ? `The event <strong>${eventTitle}</strong> is currently full. You have been added to the waitlist.` 
          : `Your registration for <strong>${eventTitle}</strong> has been successfully confirmed.`
        }</p>
        <p>We look forward to seeing you there!</p>
        <hr/>
        <small>CommunityHub Event Platform via Azure Functions</small>
      `;

      if (emailClient && senderAddress) {
        const emailMessage = {
          senderAddress: senderAddress,
          content: {
            subject: subject,
            html: bodyHtml,
          },
          recipients: {
            to: [{ address: userEmail, displayName: userName }],
          },
        };
        
        const poller = await emailClient.beginSend(emailMessage);
        const result = await poller.pollUntilDone();
        context.log(`Email sent successfully: ${result.id}`);
      } else {
        context.log(`[SIMULATED EMAIL] To: ${userEmail}, Subject: ${subject}`);
      }
      
      return { status: 200, body: JSON.stringify({ success: true, message: 'Notification sent' }) };
    } catch (err) {
      context.error('Error sending registration notification:', err);
      return { status: 500, body: err.message };
    }
  }
});

// 2. Trigger for Announcement Broadcast
app.http('onAnnouncementBroadcast', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    context.log(`Processing announcement broadcast notification trigger`);
    
    try {
      const data = await request.json();
      const { eventTitle, message, recipients } = data;
      
      if (!eventTitle || !message || !recipients || !Array.isArray(recipients)) {
        return { status: 400, body: 'Missing required parameters' };
      }
      
      const subject = `Important Announcement: ${eventTitle}`;
      
      if (emailClient && senderAddress) {
        context.log(`Sending broadcast emails to ${recipients.length} recipients...`);
        for (const recipient of recipients) {
          const bodyHtml = `
            <h1>Update for ${eventTitle}</h1>
            <p>Hello ${recipient.name},</p>
            <p>${message}</p>
            <hr/>
            <p>Please check the event page for more details.</p>
            <small>CommunityHub Event Platform via Azure Functions</small>
          `;
          
          const emailMessage = {
            senderAddress: senderAddress,
            content: {
              subject: subject,
              html: bodyHtml,
            },
            recipients: {
              to: [{ address: recipient.email, displayName: recipient.name }],
            },
          };
          
          await emailClient.beginSend(emailMessage);
        }
        context.log('All broadcast emails dispatched');
      } else {
        context.log(`[SIMULATED BROADCAST] Event: ${eventTitle}, Msg: ${message}, Recipients: ${recipients.length}`);
      }
      
      return { status: 200, body: JSON.stringify({ success: true, count: recipients.length }) };
    } catch (err) {
      context.error('Error sending broadcast notification:', err);
      return { status: 500, body: err.message };
    }
  }
});
