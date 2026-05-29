const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'bas_secret_2024');
    const user = await User.findById(decoded.id).select('-password');
    if (!user || !user.isActive) return res.status(401).json({ error: 'Unauthorized' });
    req.user = user;
    next();
  } catch { res.status(401).json({ error: 'Invalid token' }); }
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  next();
};

const marketingOnly = (req, res, next) => {
  if (!['admin', 'marketing'].includes(req.user.role)) return res.status(403).json({ error: 'Marketing/Admin only' });
  next();
};

const directorOnly = (req, res, next) => {
  if (!['admin', 'director'].includes(req.user.role)) return res.status(403).json({ error: 'Director/Admin only' });
  next();
};

module.exports = { auth, adminOnly, marketingOnly, directorOnly };
