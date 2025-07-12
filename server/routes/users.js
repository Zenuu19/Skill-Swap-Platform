const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const UserSkill = require('../models/UserSkill');
const Feedback = require('../models/Feedback');
const { protect, optionalAuth } = require('../middleware/auth');
const { upload, handleMulterError } = require('../middleware/upload');

const router = express.Router();

// @desc    Get all users (public profiles only)
// @route   GET /api/users
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, skill, location, availability } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    let query = { 
      profileVisibility: 'public',
      isActive: true,
      isBanned: false
    };

    // Add search filters
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    if (availability) {
      query.availability = { $in: availability.split(',') };
    }

    // If skill filter is provided, we need to join with UserSkill
    let users;
    if (skill) {
      const userSkills = await UserSkill.find({
        type: 'offered',
        isActive: true
      }).populate('skill', 'name').populate('user');

      const filteredUserSkills = userSkills.filter(us => 
        us.skill.name.toLowerCase().includes(skill.toLowerCase())
      );

      const userIds = filteredUserSkills.map(us => us.user._id);
      query._id = { $in: userIds };
    }

    users = await User.find(query)
      .select('-password -__v')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      users,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalUsers: total
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// @desc    Get user's skills
// @route   GET /api/users/skills
// @access  Private
router.get('/skills', protect, async (req, res) => {
  try {
    const userSkills = await UserSkill.find({ user: req.user.id, isActive: true })
      .populate('skill', 'name category description');

    const offeredSkills = userSkills.filter(us => us.type === 'offered');
    const wantedSkills = userSkills.filter(us => us.type === 'wanted');

    res.json({
      offered: offeredSkills,
      wanted: wantedSkills
    });
  } catch (error) {
    console.error('Get user skills error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -__v');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if profile is private and user is not the owner
    if (user.profileVisibility === 'private' && 
        (!req.user || req.user.id !== user._id.toString())) {
      return res.status(403).json({ message: 'This profile is private' });
    }

    // Get user skills
    const userSkills = await UserSkill.find({ user: user._id, isActive: true })
      .populate('skill', 'name category description');

    // Get user feedback/ratings
    const feedback = await Feedback.find({ 
      reviewee: user._id, 
      isPublic: true 
    })
    .populate('reviewer', 'name profilePhoto')
    .sort({ createdAt: -1 })
    .limit(10);

    // Calculate average rating
    const avgRating = feedback.length > 0 
      ? feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length 
      : 0;

    res.json({
      user: user.getPublicProfile(),
      skills: userSkills,
      feedback,
      avgRating: Math.round(avgRating * 10) / 10,
      totalFeedback: feedback.length
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
router.put('/profile', protect, [
  body('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('location').optional().trim().isLength({ max: 100 }).withMessage('Location cannot exceed 100 characters'),
  body('bio').optional().trim().isLength({ max: 500 }).withMessage('Bio cannot exceed 500 characters'),
  body('availability').optional().isArray().withMessage('Availability must be an array'),
  body('skillsOffered').optional().isArray().withMessage('Skills offered must be an array'),
  body('skillsWanted').optional().isArray().withMessage('Skills wanted must be an array'),
  body('profileVisibility').optional().isIn(['public', 'private']).withMessage('Profile visibility must be public or private'),
  body('profilePhoto').optional().isString().withMessage('Profile photo must be a valid filename')
], async (req, res) => {
  try {
    console.log('Profile update request received:', req.body);
    
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { name, location, bio, availability, skillsOffered, skillsWanted, profileVisibility, profilePhoto } = req.body;
    console.log('Extracted fields:', { name, location, bio, availability, skillsOffered, skillsWanted, profileVisibility, profilePhoto });

    const user = await User.findById(req.user.id);
    console.log('Found user:', user ? 'Yes' : 'No');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields
    if (name) user.name = name;
    if (location !== undefined) user.location = location;
    if (bio !== undefined) user.bio = bio;
    if (availability) user.availability = availability;
    if (skillsOffered) user.skillsOffered = skillsOffered;
    if (skillsWanted) user.skillsWanted = skillsWanted;
    if (profileVisibility) user.profileVisibility = profileVisibility;
    if (profilePhoto) user.profilePhoto = profilePhoto;

    console.log('About to save user with updated fields...');
    await user.save();
    console.log('User saved successfully');

    res.json({
      message: 'Profile updated successfully',
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Photo upload route disabled - using predefined avatars instead
/*
// @desc    Upload profile photo
// @route   POST /api/users/profile/photo
// @access  Private
router.post('/profile/photo', protect, upload.single('profilePhoto'), handleMulterError, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete old profile photo if exists
    if (user.profilePhoto) {
      const fs = require('fs');
      const path = require('path');
      const oldPhotoPath = path.join(__dirname, '../uploads/profiles', user.profilePhoto);
      
      if (fs.existsSync(oldPhotoPath)) {
        fs.unlinkSync(oldPhotoPath);
      }
    }

    // Update user with new photo
    user.profilePhoto = req.file.filename;
    await user.save();

    res.json({
      message: 'Profile photo updated successfully',
      profilePhoto: user.profilePhoto,
      photoUrl: `/uploads/profiles/${user.profilePhoto}`
    });
  } catch (error) {
    console.error('Upload profile photo error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// @desc    Delete profile photo
// @route   DELETE /api/users/profile/photo
// @access  Private
router.delete('/profile/photo', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.profilePhoto) {
      const fs = require('fs');
      const path = require('path');
      const photoPath = path.join(__dirname, '../uploads/profiles', user.profilePhoto);
      
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }

      user.profilePhoto = null;
      await user.save();
    }

    res.json({ message: 'Profile photo deleted successfully' });
  } catch (error) {
    console.error('Delete profile photo error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
*/

// @desc    Delete user account
// @route   DELETE /api/users/account
// @access  Private
router.delete('/account', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Soft delete - deactivate account
    user.isActive = false;
    await user.save();

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
