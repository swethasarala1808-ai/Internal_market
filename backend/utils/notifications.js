const nodemailer = require('nodemailer');

// Email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Send email notification
const sendEmailNotification = async (to, subject, html) => {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html
    });
    console.log(`📧 Email sent to ${to}`);
    return true;
  } catch (err) {
    console.error('❌ Email error:', err.message);
    return false;
  }
};

// Send WhatsApp via Twilio
const sendWhatsAppNotification = async (to, message) => {
  try {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      console.warn('⚠️ Twilio not configured. Skipping WhatsApp.');
      return false;
    }
    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM,
      to: `whatsapp:${to}`,
      body: message
    });
    console.log(`📱 WhatsApp sent to ${to}`);
    return true;
  } catch (err) {
    console.error('❌ WhatsApp error:', err.message);
    return false;
  }
};

// Notify all internal users about new material upload
const notifyNewMaterial = async (material, solution, uploader, internalUsers) => {
  const appUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const materialUrl = `${appUrl}/material/${material._id}`;

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #5b21b6; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0;">📢 New Marketing Material Uploaded</h2>
        <p style="margin: 5px 0 0; opacity: 0.8;">ERPNext Internal Portal</p>
      </div>
      <div style="background: #f9f9f9; padding: 24px; border: 1px solid #e0e0e0;">
        <h3 style="color: #333; margin-top: 0;">${material.title}</h3>
        <p><strong>Type:</strong> ${material.type.replace('_', ' ').toUpperCase()}</p>
        <p><strong>Solution:</strong> ${solution.name}</p>
        <p><strong>Uploaded by:</strong> ${uploader.name}</p>
        ${material.description ? `<p><strong>Description:</strong> ${material.description}</p>` : ''}
        <div style="margin: 24px 0; text-align: center;">
          <a href="${materialUrl}" style="background: #5b21b6; color: white; padding: 12px 28px; 
             border-radius: 6px; text-decoration: none; font-size: 16px; display: inline-block;">
            View & Give Feedback
          </a>
        </div>
        <p style="color: #666; font-size: 13px;">
          Your feedback helps the marketing team improve our materials. It only takes 30 seconds!
        </p>
      </div>
      <div style="background: #eee; padding: 12px; border-radius: 0 0 8px 8px; text-align: center; color: #888; font-size: 12px;">
        ERPNext Internal Marketing Portal
      </div>
    </div>
  `;

  const whatsappMessage = `
📢 *New Marketing Material Uploaded!*

*${material.title}*
📁 Type: ${material.type.replace('_', ' ')}
🏷️ Solution: ${solution.name}
👤 By: ${uploader.name}

${material.description ? `📝 ${material.description}\n` : ''}
👉 View & give feedback: ${materialUrl}
  `.trim();

  const emailPromises = [];
  const whatsappPromises = [];

  for (const user of internalUsers) {
    if (user.notifyEmail && user.email) {
      emailPromises.push(
        sendEmailNotification(user.email, `New Marketing Material: ${material.title}`, emailHtml)
      );
    }
    if (user.notifyWhatsapp && user.phone) {
      whatsappPromises.push(sendWhatsAppNotification(user.phone, whatsappMessage));
    }
  }

  await Promise.allSettled([...emailPromises, ...whatsappPromises]);
};

// Notify marketing team when new feedback arrives
const notifyMarketingFeedback = async (material, feedbackUser, feedback, marketingUsers) => {
  const appUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const materialUrl = `${appUrl}/material/${material._id}`;

  const ratingEmoji = {
    excellent: '🌟',
    good: '👍',
    okay: '😐',
    needs_improvement: '⚠️',
    bad: '👎'
  };

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #059669; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0;">💬 New Feedback Received</h2>
        <p style="margin: 5px 0 0; opacity: 0.8;">ERPNext Internal Portal</p>
      </div>
      <div style="background: #f9f9f9; padding: 24px; border: 1px solid #e0e0e0;">
        <p><strong>Material:</strong> ${material.title}</p>
        <p><strong>From:</strong> ${feedbackUser.name} (${feedbackUser.department || 'Team'})</p>
        <p><strong>Rating:</strong> ${ratingEmoji[feedback.rating]} ${feedback.rating.replace('_', ' ').toUpperCase()}</p>
        ${feedback.comment ? `<p><strong>Comment:</strong> "${feedback.comment}"</p>` : ''}
        ${feedback.suggestion ? `<p><strong>Suggestion:</strong> "${feedback.suggestion}"</p>` : ''}
        <div style="margin: 24px 0; text-align: center;">
          <a href="${materialUrl}" style="background: #059669; color: white; padding: 12px 28px; 
             border-radius: 6px; text-decoration: none; font-size: 16px; display: inline-block;">
            View All Feedback
          </a>
        </div>
      </div>
      <div style="background: #eee; padding: 12px; border-radius: 0 0 8px 8px; text-align: center; color: #888; font-size: 12px;">
        ERPNext Internal Marketing Portal
      </div>
    </div>
  `;

  for (const user of marketingUsers) {
    if (user.notifyEmail && user.email) {
      await sendEmailNotification(
        user.email,
        `New Feedback on: ${material.title}`,
        emailHtml
      );
    }
  }
};

module.exports = {
  sendEmailNotification,
  sendWhatsAppNotification,
  notifyNewMaterial,
  notifyMarketingFeedback
};
