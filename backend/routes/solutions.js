const express = require('express');
const Solution = require('../models/Solution');
const { auth, marketingOnly } = require('../middleware/auth');

const router = express.Router();

// GET /api/solutions
router.get('/', auth, async (req, res) => {
  try {
    const solutions = await Solution.find({ isActive: true }).sort({ name: 1 });
    res.json({ solutions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/solutions - Create solution (marketing only)
router.post('/', auth, marketingOnly, async (req, res) => {
  try {
    const { name, description, icon, color } = req.body;
    const solution = new Solution({ name, description, icon, color });
    await solution.save();
    res.status(201).json({ solution });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Solution with this name already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

// Seed default ERPNext solutions
router.post('/seed', auth, marketingOnly, async (req, res) => {
  try {
    const defaultSolutions = [
      { name: 'HR & Payroll', icon: '👥', color: '#7c3aed' },
      { name: 'CRM', icon: '🤝', color: '#2563eb' },
      { name: 'Accounting', icon: '📊', color: '#059669' },
      { name: 'Manufacturing', icon: '🏭', color: '#d97706' },
      { name: 'Inventory', icon: '📦', color: '#dc2626' },
      { name: 'Project Management', icon: '📋', color: '#0891b2' },
      { name: 'E-Commerce', icon: '🛒', color: '#be185d' },
      { name: 'Healthcare', icon: '🏥', color: '#16a34a' },
      { name: 'Education', icon: '🎓', color: '#ea580c' },
      { name: 'Helpdesk', icon: '🎧', color: '#6d28d9' }
    ];

    const results = [];
    for (const sol of defaultSolutions) {
      const existing = await Solution.findOne({ name: sol.name });
      if (!existing) {
        const created = await Solution.create(sol);
        results.push(created);
      }
    }

    res.json({ created: results.length, message: `${results.length} solutions seeded` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/solutions/:id
router.delete('/:id', auth, marketingOnly, async (req, res) => {
  try {
    await Solution.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Solution deactivated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
