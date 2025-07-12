const mongoose = require('mongoose');

const simpleSwapRequestSchema = new mongoose.Schema({
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
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Offered skill cannot exceed 100 characters']
  },
  wantedSkill: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Wanted skill cannot exceed 100 characters']
  },
  message: {
    type: String,
    trim: true,
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'completed', 'cancelled'],
    default: 'pending'
  },
  responseMessage: {
    type: String,
    trim: true,
    maxlength: [500, 'Response message cannot exceed 500 characters']
  },
  respondedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for better query performance
simpleSwapRequestSchema.index({ requester: 1, status: 1 });
simpleSwapRequestSchema.index({ requestee: 1, status: 1 });
simpleSwapRequestSchema.index({ createdAt: -1 });

// Compound index to prevent duplicate requests
simpleSwapRequestSchema.index({ 
  requester: 1, 
  requestee: 1, 
  offeredSkill: 1, 
  wantedSkill: 1,
  status: 1 
});

module.exports = mongoose.model('SimpleSwapRequest', simpleSwapRequestSchema);
