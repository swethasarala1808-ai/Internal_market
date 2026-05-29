const express = require('express');
const User = require('../models/User');
const { auth, adminOnly } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const router = express.Router();

// GET /api/users/staff-list
router.get('/staff-list', auth, async (req, res) => {
  try {
    if (!['admin', 'marketing'].includes(req.user.role)) return res.status(403).json({ error: 'Access denied' });
    const staff = await User.find({ role: 'internal' }, 'name email department phone isActive createdAt').sort({ name: 1 });
    res.json({ staff });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/users/marketing-list
router.get('/marketing-list', auth, async (req, res) => {
  try {
    if (!['admin', 'marketing'].includes(req.user.role)) return res.status(403).json({ error: 'Access denied' });
    const marketingTeam = await User.find({ role: 'marketing' }, 'name email department phone isActive createdAt').sort({ name: 1 });
    res.json({ marketingTeam });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/users/all - Admin sees ALL users
router.get('/all', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const users = await User.find({}, 'name email role department phone isActive createdAt').sort({ createdAt: -1 });
    res.json({ users });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/users/internal-phones
router.get('/internal-phones', auth, async (req, res) => {
  try {
    const users = await User.find({ role: 'internal', isActive: true, phone: { $exists: true, $ne: '' } }, 'phone');
    res.json({ phones: users.map(u => u.phone).filter(Boolean) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/users/create - Admin creates any user including admin/director
router.post('/create', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const { name, email, password, role, phone, department } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, password required' });
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: 'Email already exists' });
    const user = await User.create({ name, email, password, role: role || 'internal', phone, department });
    res.status(201).json({ user: { _id: user._id, name, email, role: user.role, phone, department, isActive: true } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/users/:id
router.patch('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) return res.status(403).json({ error: 'Not allowed' });
    const { name, department, phone, isActive, role } = req.body;
    const update = { name, department, phone, isActive };
    if (req.user.role === 'admin' && role) update.role = role;
    const updated = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('-password');
    res.json({ user: updated });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/users/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    if (req.user._id.toString() === req.params.id) return res.status(400).json({ error: 'Cannot delete yourself' });
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/users/staff-list (already defined above)
module.exports = router;
