const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  swapRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SwapRequest',
    required: true
  },
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reviewee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  comment: {
    type: String,
    trim: true,
    maxlength: [500, 'Comment cannot exceed 500 characters']
  },
  skillRating: {
    type: Number,
    min: [1, 'Skill rating must be at least 1'],
    max: [5, 'Skill rating cannot exceed 5']
  },
  communicationRating: {
    type: Number,
    min: [1, 'Communication rating must be at least 1'],
    max: [5, 'Communication rating cannot exceed 5']
  },
  recommendsUser: {
    type: Boolean,
    default: true
  },
  isPublic: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better query performance
feedbackSchema.index({ reviewee: 1, isPublic: 1 });
feedbackSchema.index({ reviewer: 1 });
feedbackSchema.index({ swapRequest: 1 });
feedbackSchema.index({ rating: -1 });

// Prevent duplicate feedback for same swap request from same reviewer
feedbackSchema.index({ swapRequest: 1, reviewer: 1 }, { unique: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
