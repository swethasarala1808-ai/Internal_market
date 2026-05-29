const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const router = express.Router();

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET || 'bas_secret_2024', { expiresIn: '30d' });

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, phone, department } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password required' });
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: 'Email already registered' });
    // Only admin can create admin/director accounts
    const safeRole = ['marketing', 'internal'].includes(role) ? role : 'internal';
    const user = await User.create({ name, email, password, role: safeRole, phone, department });
    const token = generateToken(user._id);
    res.status(201).json({ user: { _id: user._id, name, email, role: safeRole, phone, department }, token });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const user = await User.findOne({ email });
    if (!user || !user.isActive) return res.status(401).json({ error: 'Invalid credentials' });
    const match = await user.comparePassword(password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });
    const token = generateToken(user._id);
    res.json({ user: { _id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone, department: user.department }, token });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
