const nodemailer = require('nodemailer');

const createTransporter = () => nodemailer.createTransport({
  host: 'smtp.gmail.com', port: 587, secure: false,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

const sendEmail = async (to, subject, html) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return;
  try {
    await createTransporter().sendMail({
      from: `"BAS Portal" <${process.env.EMAIL_USER}>`, to, subject, html
    });
    console.log(`📧 Email sent to ${to}`);
  } catch (e) { console.error('Email error:', e.message); }
};

const materialCard = (material, solution, uploader, actionUrl, actionLabel, accentColor = '#1a1a2e') => `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
  <div style="background:${accentColor};color:white;padding:20px;border-radius:8px 8px 0 0">
    <h2 style="margin:0">📢 BAS Internal Marketing Portal</h2>
  </div>
  <div style="background:#f9f9f9;padding:24px;border:1px solid #e0e0e0">
    <h3 style="color:#1a1a2e;margin-top:0">${material.title}</h3>
    <p><b>Type:</b> ${material.type?.replace('_',' ')}</p>
    <p><b>Solution:</b> ${solution?.name || ''}</p>
    <p><b>Uploaded by:</b> ${uploader?.name || ''}</p>
    ${material.description ? `<p><b>Description:</b> ${material.description}</p>` : ''}
    <div style="text-align:center;margin:24px 0">
      <a href="${actionUrl}" style="background:${accentColor};color:white;padding:12px 28px;border-radius:6px;text-decoration:none;font-size:16px;display:inline-block">${actionLabel}</a>
    </div>
  </div>
  <div style="background:#eee;padding:12px;border-radius:0 0 8px 8px;text-align:center;color:#888;font-size:12px">BAS Internal Marketing Portal</div>
</div>`;

// 1. Notify ALL registered users when material uploaded (internal + marketing + admin + director)
const notifyNewMaterial = async (material, solution, uploader, allUsers) => {
  const appUrl = process.env.FRONTEND_URL || 'https://internal-market.vercel.app';
  const url = `${appUrl}/material/${material._id}`;
  const html = materialCard(material, solution, uploader, url, '👉 View & Give Feedback');
  
  for (const u of allUsers) {
    if (u.notifyEmail !== false && u.email && u._id.toString() !== uploader._id.toString()) {
      await sendEmail(u.email, `📢 New Material: ${material.title}`, html);
    }
  }
};

// 2. Notify directors when admin sends report to director
const notifyDirectors = async (material, solution, sender, directors) => {
  const appUrl = process.env.FRONTEND_URL || 'https://internal-market.vercel.app';
  const url = `${appUrl}/director`;
  const html = materialCard(material, solution, sender, url, '📋 Review & Approve', '#059669') 
    .replace('<h2 style="margin:0">📢 BAS Internal Marketing Portal</h2>', 
             '<h2 style="margin:0">📋 Material Sent for Your Approval</h2>');

  for (const d of directors) {
    if (d.email) await sendEmail(d.email, `📋 Needs Your Approval: ${material.title}`, html);
  }
};

// 3. Notify admin when director approves/rejects
const notifyAdminDirectorDecision = async (material, director, decision, note, admins) => {
  const appUrl = process.env.FRONTEND_URL || 'https://internal-market.vercel.app';
  const url = `${appUrl}/material/${material._id}`;
  const color = decision === 'approved' ? '#00C851' : decision === 'rejected' ? '#ef4444' : '#f97316';
  const emoji = decision === 'approved' ? '✅' : decision === 'rejected' ? '❌' : '✏️';
  const html = `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
    <div style="background:${color};color:white;padding:20px;border-radius:8px 8px 0 0">
      <h2 style="margin:0">${emoji} Director Decision: ${decision.replace('_',' ').toUpperCase()}</h2>
    </div>
    <div style="background:#f9f9f9;padding:24px;border:1px solid #e0e0e0">
      <h3>${material.title}</h3>
      <p><b>Decision by:</b> ${director.name}</p>
      <p><b>Status:</b> ${emoji} ${decision.replace('_',' ')}</p>
      ${note ? `<p><b>Note:</b> "${note}"</p>` : ''}
      <div style="text-align:center;margin:20px 0">
        <a href="${url}" style="background:#1a1a2e;color:white;padding:12px 24px;border-radius:6px;text-decoration:none">View Material</a>
      </div>
    </div>
    <div style="background:#eee;padding:12px;border-radius:0 0 8px 8px;text-align:center;color:#888;font-size:12px">BAS Internal Marketing Portal</div>
  </div>`;

  for (const a of admins) {
    if (a.email) await sendEmail(a.email, `${emoji} Director ${decision}: ${material.title}`, html);
  }
};

module.exports = { notifyNewMaterial, notifyDirectors, notifyAdminDirectorDecision, sendEmail };
