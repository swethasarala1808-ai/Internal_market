const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const materialRoutes = require('./routes/materials');
const feedbackRoutes = require('./routes/feedback');
const userRoutes = require('./routes/users');
const solutionRoutes = require('./routes/solutions');

const app = express();

// Middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});
app.use(cors({ origin: '*', credentials: false }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/users', userRoutes);
app.use('/api/solutions', solutionRoutes);

// Health check
// ONE-TIME SETUP: Create admin user
app.post('/api/setup-admin', async (req, res) => {
  try {
    const { secret } = req.body;
    if (secret !== 'BAS_SETUP_2024') return res.status(403).json({ error: 'Wrong secret' });
    const User = require('./models/User');
    // Delete all users
    const del = await User.deleteMany({});
    // Create admin
    const admin = await User.create({
      name: 'Swetha S',
      email: 'swethasarala1808@gmail.com',
      password: 'Swetha@123',
      role: 'admin',
      department: 'Management',
      isActive: true
    });
    res.json({ message: 'Done! Admin created.', email: admin.email, deleted: del.deletedCount });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'BAS Marketing Portal API is running' });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

module.exports = app;
