const mongoose = require('mongoose');

const adminActionSchema = new mongoose.Schema({
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  actionType: {
    type: String,
    required: true,
    enum: ['ban', 'unban', 'warn', 'delete_skill', 'approve_skill', 'reject_skill', 'message']
  },
  reason: {
    type: String,
    required: true,
    trim: true,
    maxlength: [500, 'Reason cannot exceed 500 characters']
  },
  details: {
    type: mongoose.Schema.Types.Mixed // For storing additional action-specific data
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better query performance
adminActionSchema.index({ admin: 1 });
adminActionSchema.index({ targetUser: 1 });
adminActionSchema.index({ actionType: 1 });
adminActionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AdminAction', adminActionSchema);
