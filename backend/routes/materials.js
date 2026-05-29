const express = require('express');
const Material = require('../models/Material');
const User = require('../models/User');
const Solution = require('../models/Solution');
const { auth, marketingOnly } = require('../middleware/auth');
const upload = require('../utils/upload');
const { notifyNewMaterial } = require('../utils/notifications');

const router = express.Router();

// Cloudinary upload helper using fetch (no extra package needed)
async function uploadToCloudinary(buffer, originalname, mimetype) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    const base64 = buffer.toString('base64');
    return `data:${mimetype};base64,${base64}`;
  }

  const crypto = require('crypto');
  const timestamp = Math.round(Date.now() / 1000);
  const folder = 'bas_marketing';

  // Resource type
  let resourceType = 'raw';
  if (mimetype.startsWith('image/')) resourceType = 'image';
  else if (mimetype.startsWith('video/')) resourceType = 'video';
  else if (mimetype === 'application/pdf') resourceType = 'image';

  // Generate signature
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
  const signature = crypto.createHash('sha1')
    .update(paramsToSign + apiSecret).digest('hex');

  // Use URLSearchParams with base64 data URI
  const base64Data = buffer.toString('base64');
  const dataUri = `data:${mimetype};base64,${base64Data}`;

  const body = new URLSearchParams();
  body.append('file', dataUri);
  body.append('api_key', apiKey);
  body.append('timestamp', String(timestamp));
  body.append('signature', signature);
  body.append('folder', folder);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
    { method: 'POST', body: body.toString(), headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  const data = await response.json();
  console.log('Cloudinary result:', data.secure_url ? 'SUCCESS' : data.error?.message);
  if (data.error) throw new Error('Upload failed: ' + data.error.message);
  return data.secure_url;
}

// GET /api/materials
router.get('/', auth, async (req, res) => {
  try {
    const { solution, type, status, search, page = 1, limit = 12 } = req.query;
    const filter = {};
    if (solution) filter.solution = solution;
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (search) filter.title = { $regex: search, $options: 'i' };
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Material.countDocuments(filter);
    const materials = await Material.find(filter)
      .populate('solution', 'name icon color')
      .populate('uploadedBy', 'name email')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    res.json({ materials, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/materials/approved
router.get('/approved', auth, async (req, res) => {
  try {
    const materials = await Material.find({ isApproved: true })
      .populate('solution', 'name icon color')
      .populate('uploadedBy', 'name email')
      .sort({ approvedAt: -1 });
    const grouped = {};
    for (const mat of materials) {
      const solName = mat.solution?.name || 'Uncategorized';
      if (!grouped[solName]) grouped[solName] = { solution: mat.solution, materials: [] };
      grouped[solName].materials.push(mat);
    }
    res.json({ grouped, total: materials.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/materials/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const material = await Material.findById(req.params.id)
      .populate('solution', 'name icon color')
      .populate('uploadedBy', 'name email department')
      .populate('approvedBy', 'name');
    if (!material) return res.status(404).json({ error: 'Material not found' });
    res.json({ material });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/materials - Upload new material
router.post('/', auth, marketingOnly, upload.array('files', 10), async (req, res) => {
  try {
    const { title, description, type, solution } = req.body;
    if (!title || !type || !solution) {
      return res.status(400).json({ error: 'title, type, and solution are required' });
    }
    const solutionDoc = await Solution.findById(solution);
    if (!solutionDoc) return res.status(400).json({ error: 'Solution not found' });

    // Upload files to Cloudinary
    const files = await Promise.all((req.files || []).map(async (f) => {
      const url = await uploadToCloudinary(f.buffer, f.originalname, f.mimetype);
      return {
        originalName: f.originalname,
        filename: f.originalname,
        path: url,
        mimetype: f.mimetype,
        size: f.size
      };
    }));

    const material = new Material({ title, description, type, solution, uploadedBy: req.user._id, files });
    await material.save();

    const internalUsers = await User.find({ role: 'internal', isActive: true });
    notifyNewMaterial(material, solutionDoc, req.user, internalUsers).catch(console.error);
    material.notificationSent = true;
    await material.save();

    await material.populate('solution', 'name icon color');
    await material.populate('uploadedBy', 'name email');
    res.status(201).json({ material, message: 'Material uploaded successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/materials/:id/approve
router.patch('/:id/approve', auth, marketingOnly, async (req, res) => {
  try {
    const material = await Material.findByIdAndUpdate(
      req.params.id,
      { isApproved: true, status: 'approved', approvedAt: new Date(), approvedBy: req.user._id },
      { new: true }
    ).populate('solution', 'name icon color').populate('uploadedBy', 'name email');
    if (!material) return res.status(404).json({ error: 'Material not found' });
    res.json({ material, message: 'Material approved!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/materials/:id/status
router.patch('/:id/status', auth, marketingOnly, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending_review', 'approved', 'rejected', 'revision_needed'];
    if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });
    const update = { status };
    if (status === 'approved') { update.isApproved = true; update.approvedAt = new Date(); update.approvedBy = req.user._id; }
    const material = await Material.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate('solution', 'name icon color').populate('uploadedBy', 'name email');
    if (!material) return res.status(404).json({ error: 'Material not found' });
    res.json({ material });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/materials/:id
router.delete('/:id', auth, marketingOnly, async (req, res) => {
  try {
    const material = await Material.findByIdAndDelete(req.params.id);
    if (!material) return res.status(404).json({ error: 'Material not found' });
    res.json({ message: 'Material deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/materials/:id/send-to-director - Admin sends material to director
router.post('/:id/send-to-director', auth, async (req, res) => {
  try {
    if (!['admin', 'marketing'].includes(req.user.role)) return res.status(403).json({ error: 'Not allowed' });
    const material = await Material.findByIdAndUpdate(req.params.id, {
      sentToDirector: true, sentToDirectorAt: new Date(),
      sentToDirectorBy: req.user._id, status: 'sent_to_director', directorStatus: 'pending'
    }, { new: true }).populate('solution', 'name').populate('uploadedBy', 'name email');
    if (!material) return res.status(404).json({ error: 'Not found' });

    // Notify all directors by email
    const User = require('../models/User');
    const { notifyNewMaterial } = require('../utils/notifications');
    const directors = await User.find({ role: 'director', isActive: true });
    const nodemailer = require('nodemailer');
    if (process.env.EMAIL_USER && directors.length > 0) {
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com', port: 587, secure: false,
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
      });
      const appUrl = process.env.FRONTEND_URL || 'https://internal-market.vercel.app';
      for (const dir of directors) {
        await transporter.sendMail({
          from: `"BAS Portal" <${process.env.EMAIL_USER}>`,
          to: dir.email,
          subject: `📋 Material Needs Your Approval: ${material.title}`,
          html: `<div style="font-family:Arial;max-width:600px;margin:0 auto">
            <div style="background:#1a1a2e;color:white;padding:20px;border-radius:8px 8px 0 0">
              <h2>📋 Material Awaiting Your Approval</h2>
              <p style="opacity:0.8">BAS Internal Marketing Portal</p>
            </div>
            <div style="background:#f9f9f9;padding:24px;border:1px solid #e0e0e0">
              <h3>${material.title}</h3>
              <p><b>Type:</b> ${material.type}</p>
              <p><b>Solution:</b> ${material.solution?.name}</p>
              <p><b>Uploaded by:</b> ${material.uploadedBy?.name}</p>
              <p><b>Sent by:</b> ${req.user.name}</p>
              <div style="text-align:center;margin:24px 0">
                <a href="${appUrl}/material/${material._id}" style="background:#1a1a2e;color:white;padding:12px 28px;border-radius:6px;text-decoration:none;font-size:16px;display:inline-block">
                  👉 Review & Approve
                </a>
              </div>
            </div>
          </div>`
        }).catch(console.error);
      }
    }
    res.json({ material, message: 'Sent to director!' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/materials/:id/director-review - Director approves or rejects
router.post('/:id/director-review', auth, async (req, res) => {
  try {
    if (!['admin', 'director'].includes(req.user.role)) return res.status(403).json({ error: 'Director only' });
    const { decision, note } = req.body; // decision: 'approved' or 'rejected'
    const update = {
      directorStatus: decision,
      directorNote: note,
      directorReviewedAt: new Date(),
      directorReviewedBy: req.user._id,
      status: decision === 'approved' ? 'director_approved' : 'director_rejected'
    };
    if (decision === 'approved') { update.isApproved = true; update.approvedAt = new Date(); update.approvedBy = req.user._id; }
    const material = await Material.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate('solution', 'name').populate('uploadedBy', 'name email');
    if (!material) return res.status(404).json({ error: 'Not found' });
    res.json({ material, message: `Material ${decision} by director!` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/materials/director-queue - Director sees materials sent to them
router.get('/director-queue', auth, async (req, res) => {
  try {
    if (!['admin', 'director'].includes(req.user.role)) return res.status(403).json({ error: 'Director only' });
    const materials = await Material.find({ sentToDirector: true })
      .populate('solution', 'name icon color')
      .populate('uploadedBy', 'name email')
      .populate('sentToDirectorBy', 'name')
      .sort({ sentToDirectorAt: -1 });
    res.json({ materials, total: materials.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
