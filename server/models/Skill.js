const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Skill name is required'],
    trim: true,
    maxlength: [50, 'Skill name cannot exceed 50 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'Programming', 'Design', 'Marketing', 'Business', 'Writing', 
      'Languages', 'Music', 'Photography', 'Cooking', 'Fitness', 
      'Crafts', 'Teaching', 'Other'
    ]
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  isApproved: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for better search performance
skillSchema.index({ name: 1 });
skillSchema.index({ category: 1 });
skillSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Skill', skillSchema);
