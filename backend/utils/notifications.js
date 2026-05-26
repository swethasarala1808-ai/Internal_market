const nodemailer = require('nodemailer');

// Email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
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
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('⚠️ Email not configured. Skipping.');
      return false;
    }
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"BAS Portal" <${process.env.EMAIL_USER}>`,
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

// Generate WhatsApp wa.me link (same as Pet Clinic)
const generateWhatsAppLink = (phone, message) => {
  const cleanPhone = phone.replace(/\s/g, '').replace('+', '');
  const phoneWithCode = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
  const encodedMsg = encodeURIComponent(message);
  return `https://wa.me/${phoneWithCode}?text=${encodedMsg}`;
};

// Log WhatsApp link (same approach as Pet Clinic _log_whatsapp)
const sendWhatsAppNotification = async (phone, message) => {
  try {
    const waLink = generateWhatsAppLink(phone, message);
    console.log(`📱 WhatsApp link for ${phone}: ${waLink}`);
    return waLink;
  } catch (err) {
    console.error('❌ WhatsApp error:', err.message);
    return null;
  }
};

// Notify all internal users about new material upload
const notifyNewMaterial = async (material, solution, uploader, internalUsers) => {
  const appUrl = process.env.FRONTEND_URL || 'https://internal-market.vercel.app';
  const materialUrl = `${appUrl}/material/${material._id}`;

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #5b21b6; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0;">📢 New Marketing Material Uploaded</h2>
        <p style="margin: 5px 0 0; opacity: 0.8;">BAS Internal Portal</p>
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
            👉 View & Give Feedback
          </a>
        </div>
        <p style="color: #666; font-size: 13px;">
          Your feedback helps the marketing team improve our materials. It only takes 30 seconds!
        </p>
      </div>
      <div style="background: #eee; padding: 12px; border-radius: 0 0 8px 8px; text-align: center; color: #888; font-size: 12px;">
        BAS Internal Marketing Portal
      </div>
    </div>
  `;

  const whatsappMessage = `📢 *New Marketing Material Uploaded!*\n\n*${material.title}*\n📁 Type: ${material.type.replace('_', ' ')}\n🏷️ Solution: ${solution.name}\n👤 By: ${uploader.name}\n${material.description ? `📝 ${material.description}\n` : ''}\n👉 View & give feedback:\n${materialUrl}`;

  // Include WhatsApp links in email for each user who has phone
  for (const user of internalUsers) {
    let finalHtml = emailHtml;

    // Add WhatsApp click link in email if user has phone
    if (user.phone) {
      const waLink = generateWhatsAppLink(user.phone, whatsappMessage);
      finalHtml = emailHtml.replace(
        '</div>\n      <div style="background: #eee;',
        `<div style="margin-top: 16px; text-align: center;">
          <a href="${waLink}" style="background: #25d366; color: white; padding: 10px 24px; 
             border-radius: 6px; text-decoration: none; font-size: 14px; display: inline-block;">
            📱 Open in WhatsApp
          </a>
        </div>
        </div>
      <div style="background: #eee;`
      );
    }

    if (user.notifyEmail !== false && user.email) {
      await sendEmailNotification(
        user.email,
        `📢 New Marketing Material: ${material.title}`,
        finalHtml
      );
    }
  }
};

// Notify marketing team when new feedback arrives
const notifyMarketingFeedback = async (material, feedbackUser, feedback, marketingUsers) => {
  const appUrl = process.env.FRONTEND_URL || 'https://internal-market.vercel.app';
  const materialUrl = `${appUrl}/material/${material._id}`;

  const ratingEmoji = {
    excellent: '🌟', good: '👍', okay: '😐', needs_work: '⚠️', bad: '👎'
  };

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #059669; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0;">💬 New Feedback Received</h2>
        <p style="margin: 5px 0 0; opacity: 0.8;">BAS Internal Portal</p>
      </div>
      <div style="background: #f9f9f9; padding: 24px; border: 1px solid #e0e0e0;">
        <p><strong>Material:</strong> ${material.title}</p>
        <p><strong>From:</strong> ${feedbackUser.name} (${feedbackUser.department || 'Team'})</p>
        <p><strong>Rating:</strong> ${ratingEmoji[feedback.rating] || '⭐'} ${feedback.rating.replace('_', ' ').toUpperCase()}</p>
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
        BAS Internal Marketing Portal
      </div>
    </div>
  `;

  for (const user of marketingUsers) {
    if (user.notifyEmail !== false && user.email) {
      await sendEmailNotification(user.email, `💬 New Feedback on: ${material.title}`, emailHtml);
    }
  }
};

module.exports = {
  sendEmailNotification,
  sendWhatsAppNotification,
  generateWhatsAppLink,
  notifyNewMaterial,
  notifyMarketingFeedback
};
