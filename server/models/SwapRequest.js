const mongoose = require('mongoose');

const swapRequestSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  requestee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  offeredSkill: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill',
    required: true
  },
  wantedSkill: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'cancelled', 'completed'],
    default: 'pending'
  },
  message: {
    type: String,
    trim: true,
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  responseMessage: {
    type: String,
    trim: true,
    maxlength: [500, 'Response message cannot exceed 500 characters']
  },
  acceptedAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  rejectedAt: {
    type: Date,
    default: null
  },
  cancelledAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for better query performance
swapRequestSchema.index({ requester: 1, status: 1 });
swapRequestSchema.index({ requestee: 1, status: 1 });
swapRequestSchema.index({ status: 1 });
swapRequestSchema.index({ createdAt: -1 });

// Prevent duplicate requests
swapRequestSchema.index({ 
  requester: 1, 
  requestee: 1, 
  offeredSkill: 1, 
  wantedSkill: 1,
  status: 1 
}, { 
  unique: true,
  partialFilterExpression: { status: { $in: ['pending', 'accepted'] } }
});

module.exports = mongoose.model('SwapRequest', swapRequestSchema);
