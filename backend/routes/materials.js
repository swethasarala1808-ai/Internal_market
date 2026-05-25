const express = require('express');
const Material = require('../models/Material');
const User = require('../models/User');
const Solution = require('../models/Solution');
const { auth, marketingOnly } = require('../middleware/auth');
const upload = require('../utils/upload');
const { notifyNewMaterial } = require('../utils/notifications');

const router = express.Router();

// GET /api/materials - Get all materials (with filters)
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

// GET /api/materials/approved - Get approved library grouped by solution
router.get('/approved', auth, async (req, res) => {
  try {
    const materials = await Material.find({ isApproved: true })
      .populate('solution', 'name icon color')
      .populate('uploadedBy', 'name email')
      .sort({ approvedAt: -1 });

    // Group by solution
    const grouped = {};
    for (const mat of materials) {
      const solName = mat.solution?.name || 'Uncategorized';
      if (!grouped[solName]) {
        grouped[solName] = {
          solution: mat.solution,
          materials: []
        };
      }
      grouped[solName].materials.push(mat);
    }

    res.json({ grouped, total: materials.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/materials/:id - Get single material with feedback
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

// POST /api/materials - Upload new material (marketing team only)
router.post('/', auth, marketingOnly, upload.array('files', 10), async (req, res) => {
  try {
    const { title, description, type, solution } = req.body;

    if (!title || !type || !solution) {
      return res.status(400).json({ error: 'title, type, and solution are required' });
    }

    const solutionDoc = await Solution.findById(solution);
    if (!solutionDoc) return res.status(400).json({ error: 'Solution not found' });

    const files = (req.files || []).map(f => ({
      originalName: f.originalname,
      filename: f.filename || f.public_id,
      path: f.path || f.secure_url || f.url,
      mimetype: f.mimetype,
      size: f.size
    }));

    const material = new Material({
      title,
      description,
      type,
      solution,
      uploadedBy: req.user._id,
      files
    });

    await material.save();

    // Notify internal users asynchronously
    const internalUsers = await User.find({ role: 'internal', isActive: true });
    notifyNewMaterial(material, solutionDoc, req.user, internalUsers).catch(console.error);

    // Mark notification as sent
    material.notificationSent = true;
    await material.save();

    await material.populate('solution', 'name icon color');
    await material.populate('uploadedBy', 'name email');

    res.status(201).json({ material, message: 'Material uploaded and notifications sent!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/materials/:id/approve - Approve material (marketing team only)
router.patch('/:id/approve', auth, marketingOnly, async (req, res) => {
  try {
    const material = await Material.findByIdAndUpdate(
      req.params.id,
      {
        isApproved: true,
        status: 'approved',
        approvedAt: new Date(),
        approvedBy: req.user._id
      },
      { new: true }
    ).populate('solution', 'name icon color').populate('uploadedBy', 'name email');

    if (!material) return res.status(404).json({ error: 'Material not found' });
    res.json({ material, message: 'Material approved and moved to library!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/materials/:id/status - Update material status
router.patch('/:id/status', auth, marketingOnly, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending_review', 'approved', 'rejected', 'revision_needed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const update = { status };
    if (status === 'approved') {
      update.isApproved = true;
      update.approvedAt = new Date();
      update.approvedBy = req.user._id;
    }

    const material = await Material.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate('solution', 'name icon color')
      .populate('uploadedBy', 'name email');

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

module.exports = router;
