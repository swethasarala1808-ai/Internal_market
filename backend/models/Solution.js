const mongoose = require('mongoose');

const solutionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
    // e.g. "HR & Payroll", "CRM", "Manufacturing", "Accounting"
  },
  description: {
    type: String,
    trim: true
  },
  icon: {
    type: String,
    default: '📦'
  },
  color: {
    type: String,
    default: '#5b21b6'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Solution', solutionSchema);
