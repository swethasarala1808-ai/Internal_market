const express = require('express');
const Feedback = require('../models/Feedback');
const Material = require('../models/Material');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { notifyMarketingFeedback } = require('../utils/notifications');

const router = express.Router();

// GET /api/feedback/material/:materialId - Get all feedback for a material
router.get('/material/:materialId', auth, async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ material: req.params.materialId })
      .populate('submittedBy', 'name department')
      .sort({ createdAt: -1 });

    res.json({ feedbacks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/feedback/my/:materialId - Check if user already gave feedback
router.get('/my/:materialId', auth, async (req, res) => {
  try {
    const feedback = await Feedback.findOne({
      material: req.params.materialId,
      submittedBy: req.user._id
    });
    res.json({ feedback });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/feedback - Submit feedback
router.post('/', auth, async (req, res) => {
  try {
    const { materialId, rating, comment, suggestion } = req.body;

    const validRatings = ['excellent', 'good', 'okay', 'needs_improvement', 'bad'];
    if (!validRatings.includes(rating)) {
      return res.status(400).json({ error: 'Invalid rating value' });
    }

    // Check material exists
    const material = await Material.findById(materialId);
    if (!material) return res.status(404).json({ error: 'Material not found' });

    // Prevent marketing team from self-reviewing (optional)
    // if (req.user.role === 'marketing') {
    //   return res.status(403).json({ error: 'Marketing team cannot submit feedback' });
    // }

    // Check for duplicate
    const existing = await Feedback.findOne({ material: materialId, submittedBy: req.user._id });
    if (existing) {
      return res.status(400).json({ error: 'You have already submitted feedback for this material' });
    }

    const feedback = new Feedback({
      material: materialId,
      submittedBy: req.user._id,
      rating,
      comment,
      suggestion
    });

    await feedback.save();

    // Update feedback summary on material
    const summaryUpdate = { $inc: { [`feedbackSummary.${rating}`]: 1, 'feedbackSummary.total': 1 } };
    await Material.findByIdAndUpdate(materialId, summaryUpdate);

    // Notify marketing team
    const marketingUsers = await User.find({ role: 'marketing', isActive: true });
    notifyMarketingFeedback(material, req.user, feedback, marketingUsers).catch(console.error);

    await feedback.populate('submittedBy', 'name department');
    res.status(201).json({ feedback, message: 'Feedback submitted! Thank you.' });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'You have already submitted feedback for this material' });
    }
    res.status(500).json({ error: err.message });
  }
});

// GET /api/feedback/stats/:materialId - Get feedback statistics
router.get('/stats/:materialId', auth, async (req, res) => {
  try {
    const material = await Material.findById(req.params.materialId).select('feedbackSummary title');
    if (!material) return res.status(404).json({ error: 'Material not found' });

    const { feedbackSummary } = material;
    const total = feedbackSummary.total || 0;

    const stats = {
      total,
      summary: feedbackSummary,
      percentages: total > 0 ? {
        excellent: Math.round((feedbackSummary.excellent / total) * 100),
        good: Math.round((feedbackSummary.good / total) * 100),
        okay: Math.round((feedbackSummary.okay / total) * 100),
        needs_improvement: Math.round((feedbackSummary.needs_improvement / total) * 100),
        bad: Math.round((feedbackSummary.bad / total) * 100)
      } : {}
    };

    res.json({ stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
