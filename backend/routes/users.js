const express = require('express');
const User = require('../models/User');
const { auth, marketingOnly } = require('../middleware/auth');

const router = express.Router();

// GET /api/users - Get all users (marketing team only)
router.get('/', auth, marketingOnly, async (req, res) => {
  try {
    const users = await User.find({ isActive: true }).select('-password').sort({ name: 1 });
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/users/:id/deactivate
router.patch('/:id/deactivate', auth, marketingOnly, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    ).select('-password');
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

// GET /api/users/internal-phones - Get all internal user phone numbers
router.get('/internal-phones', auth, async (req, res) => {
  try {
    const users = await User.find({ 
      role: 'internal', 
      isActive: true,
      phone: { $exists: true, $ne: '' }
    }, 'phone');
    const phones = users.map(u => u.phone).filter(Boolean);
    res.json({ phones });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/staff-list - Marketing team can see all internal staff
router.get('/staff-list', auth, async (req, res) => {
  try {
    if (req.user.role !== 'marketing' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    const staff = await User.find({ role: 'internal' }, 'name email department phone isActive createdAt').sort({ name: 1 });
    res.json({ staff });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/users/:id - Update staff member
router.patch('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'marketing' && req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const { name, department, phone, isActive } = req.body;
    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { name, department, phone, isActive },
      { new: true }
    ).select('-password');
    res.json({ user: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/users/:id - Delete staff member
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'marketing' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/marketing-list - See all marketing team members
router.get('/marketing-list', auth, async (req, res) => {
  try {
    const marketingTeam = await User.find(
      { role: 'marketing', isActive: true },
      'name email department phone isActive createdAt'
    ).sort({ name: 1 });
    res.json({ marketingTeam });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
