const mongoose = require('mongoose');

const userSkillSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  skill: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['offered', 'wanted']
  },
  proficiencyLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    default: 'intermediate'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [300, 'Notes cannot exceed 300 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicates
userSkillSchema.index({ user: 1, skill: 1, type: 1 }, { unique: true });

// Index for better search performance
userSkillSchema.index({ user: 1, type: 1 });
userSkillSchema.index({ skill: 1, type: 1 });

module.exports = mongoose.model('UserSkill', userSkillSchema);
