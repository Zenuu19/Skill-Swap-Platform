const express = require('express');
const { body, validationResult } = require('express-validator');
const Skill = require('../models/Skill');
const UserSkill = require('../models/UserSkill');
const { protect, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all skills
// @route   GET /api/skills
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { page = 1, limit = 50, search, category } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    let query = { isApproved: true };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      query.category = category;
    }

    const skills = await Skill.find(query)
      .populate('createdBy', 'name')
      .sort({ name: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Skill.countDocuments(query);

    res.json({
      skills,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalSkills: total
    });
  } catch (error) {
    console.error('Get skills error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// @desc    Get skill categories
// @route   GET /api/skills/categories
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    const categories = [
      'Programming', 'Design', 'Marketing', 'Business', 'Writing', 
      'Languages', 'Music', 'Photography', 'Cooking', 'Fitness', 
      'Crafts', 'Teaching', 'Other'
    ];

    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// @desc    Create new skill
// @route   POST /api/skills
// @access  Private
router.post('/', protect, [
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Skill name must be between 2 and 50 characters'),
  body('category').isIn([
    'Programming', 'Design', 'Marketing', 'Business', 'Writing', 
    'Languages', 'Music', 'Photography', 'Cooking', 'Fitness', 
    'Crafts', 'Teaching', 'Other'
  ]).withMessage('Invalid category'),
  body('description').optional().trim().isLength({ max: 200 }).withMessage('Description cannot exceed 200 characters')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { name, category, description } = req.body;

    // Check if skill already exists
    const existingSkill = await Skill.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') } 
    });

    if (existingSkill) {
      return res.status(400).json({ message: 'Skill already exists' });
    }

    // Create skill
    const skill = await Skill.create({
      name,
      category,
      description,
      createdBy: req.user.id
    });

    await skill.populate('createdBy', 'name');

    res.status(201).json({
      message: 'Skill created successfully',
      skill
    });
  } catch (error) {
    console.error('Create skill error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// @desc    Get skill by ID
// @route   GET /api/skills/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id)
      .populate('createdBy', 'name');

    if (!skill) {
      return res.status(404).json({ message: 'Skill not found' });
    }

    if (!skill.isApproved) {
      return res.status(403).json({ message: 'Skill is not approved' });
    }

    // Get users who offer this skill
    const usersOffering = await UserSkill.find({ 
      skill: skill._id, 
      type: 'offered',
      isActive: true 
    })
    .populate('user', 'name profilePhoto location profileVisibility')
    .limit(10);

    // Get users who want this skill
    const usersWanting = await UserSkill.find({ 
      skill: skill._id, 
      type: 'wanted',
      isActive: true 
    })
    .populate('user', 'name profilePhoto location profileVisibility')
    .limit(10);

    // Filter out private profiles
    const publicUsersOffering = usersOffering.filter(us => 
      us.user.profileVisibility === 'public'
    );

    const publicUsersWanting = usersWanting.filter(us => 
      us.user.profileVisibility === 'public'
    );

    res.json({
      skill,
      usersOffering: publicUsersOffering,
      usersWanting: publicUsersWanting,
      totalOffering: publicUsersOffering.length,
      totalWanting: publicUsersWanting.length
    });
  } catch (error) {
    console.error('Get skill by ID error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// @desc    Add skill to user profile
// @route   POST /api/skills/:id/add
// @access  Private
router.post('/:id/add', protect, [
  body('type').isIn(['offered', 'wanted']).withMessage('Type must be either offered or wanted'),
  body('proficiencyLevel').optional().isIn(['beginner', 'intermediate', 'advanced', 'expert']).withMessage('Invalid proficiency level'),
  body('notes').optional().trim().isLength({ max: 300 }).withMessage('Notes cannot exceed 300 characters')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { type, proficiencyLevel, notes } = req.body;

    // Check if skill exists
    const skill = await Skill.findById(req.params.id);
    if (!skill) {
      return res.status(404).json({ message: 'Skill not found' });
    }

    if (!skill.isApproved) {
      return res.status(400).json({ message: 'Skill is not approved' });
    }

    // Check if user already has this skill of the same type
    const existingUserSkill = await UserSkill.findOne({
      user: req.user.id,
      skill: skill._id,
      type: type
    });

    if (existingUserSkill) {
      return res.status(400).json({ message: `You already have this skill in your ${type} list` });
    }

    // Create user skill
    const userSkill = await UserSkill.create({
      user: req.user.id,
      skill: skill._id,
      type,
      proficiencyLevel: proficiencyLevel || 'intermediate',
      notes
    });

    await userSkill.populate('skill', 'name category description');

    res.status(201).json({
      message: 'Skill added to your profile successfully',
      userSkill
    });
  } catch (error) {
    console.error('Add skill to user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// @desc    Remove skill from user profile
// @route   DELETE /api/skills/:id/remove
// @access  Private
router.delete('/:id/remove', protect, [
  body('type').isIn(['offered', 'wanted']).withMessage('Type must be either offered or wanted')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { type } = req.body;

    // Find and remove user skill
    const userSkill = await UserSkill.findOneAndDelete({
      user: req.user.id,
      skill: req.params.id,
      type: type
    });

    if (!userSkill) {
      return res.status(404).json({ message: 'Skill not found in your profile' });
    }

    res.json({ message: 'Skill removed from your profile successfully' });
  } catch (error) {
    console.error('Remove skill from user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// @desc    Update user skill
// @route   PUT /api/skills/:id/update
// @access  Private
router.put('/:id/update', protect, [
  body('type').isIn(['offered', 'wanted']).withMessage('Type must be either offered or wanted'),
  body('proficiencyLevel').optional().isIn(['beginner', 'intermediate', 'advanced', 'expert']).withMessage('Invalid proficiency level'),
  body('notes').optional().trim().isLength({ max: 300 }).withMessage('Notes cannot exceed 300 characters')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { type, proficiencyLevel, notes } = req.body;

    // Find and update user skill
    const userSkill = await UserSkill.findOneAndUpdate(
      {
        user: req.user.id,
        skill: req.params.id,
        type: type
      },
      {
        proficiencyLevel: proficiencyLevel || 'intermediate',
        notes
      },
      { new: true }
    ).populate('skill', 'name category description');

    if (!userSkill) {
      return res.status(404).json({ message: 'Skill not found in your profile' });
    }

    res.json({
      message: 'Skill updated successfully',
      userSkill
    });
  } catch (error) {
    console.error('Update user skill error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
