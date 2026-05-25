const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['poster', 'advertisement', 'content', 'video', 'brochure', 'social_media', 'other'],
    required: true
  },
  solution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Solution',
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  files: [
    {
      originalName: String,
      filename: String,
      path: String,
      mimetype: String,
      size: Number
    }
  ],
  status: {
    type: String,
    enum: ['pending_review', 'approved', 'rejected', 'revision_needed'],
    default: 'pending_review'
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  approvedAt: Date,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  feedbackSummary: {
    excellent: { type: Number, default: 0 },
    good: { type: Number, default: 0 },
    okay: { type: Number, default: 0 },
    needs_improvement: { type: Number, default: 0 },
    bad: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  notificationSent: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

materialSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Material', materialSchema);
