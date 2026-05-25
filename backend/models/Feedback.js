const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  material: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Material',
    required: true
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: String,
    enum: ['excellent', 'good', 'okay', 'needs_improvement', 'bad'],
    required: true
  },
  comment: {
    type: String,
    trim: true,
    maxlength: 500
  },
  suggestion: {
    type: String,
    trim: true,
    maxlength: 500
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Prevent duplicate feedback from same user on same material
feedbackSchema.index({ material: 1, submittedBy: 1 }, { unique: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
