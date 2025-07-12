const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Skill = require('../models/Skill');
const SwapRequest = require('../models/SwapRequest');
const Feedback = require('../models/Feedback');
const AdminAction = require('../models/AdminAction');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Apply admin middleware to all routes
router.use(protect);
router.use(adminOnly);

// @desc    Get admin dashboard statistics
// @route   GET /api/admin/stats
// @access  Private (Admin only)
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ isActive: true });
    const totalSkills = await Skill.countDocuments({ isApproved: true });
    const totalSwaps = await SwapRequest.countDocuments();
    const pendingSwaps = await SwapRequest.countDocuments({ status: 'pending' });
    const completedSwaps = await SwapRequest.countDocuments({ status: 'completed' });
    const bannedUsers = await User.countDocuments({ isBanned: true });
    const pendingSkills = await Skill.countDocuments({ isApproved: false });

    // Get recent activity
    const recentUsers = await User.find({ isActive: true })
      .select('name email joinedAt')
      .sort({ joinedAt: -1 })
      .limit(5);

    const recentSwaps = await SwapRequest.find()
      .populate('requester', 'name')
      .populate('requestee', 'name')
      .populate('offeredSkill', 'name')
      .populate('wantedSkill', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      stats: {
        totalUsers,
        totalSkills,
        totalSwaps,
        pendingSwaps,
        completedSwaps,
        bannedUsers,
        pendingSkills
      },
      recentActivity: {
        recentUsers,
        recentSwaps
      }
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// @desc    Get all users for admin
// @route   GET /api/admin/users
// @access  Private (Admin only)
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const skip = (page - 1) * limit;

    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (status === 'active') {
      query.isActive = true;
      query.isBanned = false;
    } else if (status === 'banned') {
      query.isBanned = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    const users = await User.find(query)
      .select('-password')
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
    console.error('Get admin users error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// @desc    Ban/Unban user
// @route   PUT /api/admin/users/:id/ban
// @access  Private (Admin only)
router.put('/users/:id/ban', [
  body('action').isIn(['ban', 'unban']).withMessage('Action must be ban or unban'),
  body('reason').optional().trim().isLength({ max: 500 }).withMessage('Reason cannot exceed 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { action, reason } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot ban an admin user' });
    }

    if (action === 'ban') {
      user.isBanned = true;
      user.banReason = reason || 'Banned by admin';
    } else {
      user.isBanned = false;
      user.banReason = null;
    }

    await user.save();

    // Log admin action
    await AdminAction.create({
      admin: req.user.id,
      targetUser: user._id,
      actionType: action,
      reason: reason || `User ${action}ned by admin`
    });

    res.json({
      message: `User ${action}ned successfully`,
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error('Ban/Unban user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// @desc    Get all skills for admin
// @route   GET /api/admin/skills
// @access  Private (Admin only)
router.get('/skills', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const skip = (page - 1) * limit;

    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (status === 'approved') {
      query.isApproved = true;
    } else if (status === 'pending') {
      query.isApproved = false;
    }

    const skills = await Skill.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
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
    console.error('Get admin skills error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// @desc    Approve/Reject skill
// @route   PUT /api/admin/skills/:id/approve
// @access  Private (Admin only)
router.put('/skills/:id/approve', [
  body('action').isIn(['approve', 'reject']).withMessage('Action must be approve or reject'),
  body('reason').optional().trim().isLength({ max: 500 }).withMessage('Reason cannot exceed 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { action, reason } = req.body;

    const skill = await Skill.findById(req.params.id).populate('createdBy', 'name email');
    if (!skill) {
      return res.status(404).json({ message: 'Skill not found' });
    }

    if (action === 'approve') {
      skill.isApproved = true;
    } else {
      // For rejection, we might want to delete the skill or mark it as rejected
      await Skill.findByIdAndDelete(req.params.id);
    }

    if (action === 'approve') {
      await skill.save();
    }

    // Log admin action
    await AdminAction.create({
      admin: req.user.id,
      targetUser: skill.createdBy._id,
      actionType: action === 'approve' ? 'approve_skill' : 'reject_skill',
      reason: reason || `Skill ${action}d by admin`,
      details: {
        skillId: skill._id,
        skillName: skill.name
      }
    });

    res.json({
      message: `Skill ${action}d successfully`,
      skill: action === 'approve' ? skill : null
    });
  } catch (error) {
    console.error('Approve/Reject skill error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// @desc    Get all swap requests for admin
// @route   GET /api/admin/swaps
// @access  Private (Admin only)
router.get('/swaps', async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (page - 1) * limit;

    let query = {};

    if (status) {
      query.status = status;
    }

    const swaps = await SwapRequest.find(query)
      .populate('requester', 'name email')
      .populate('requestee', 'name email')
      .populate('offeredSkill', 'name category')
      .populate('wantedSkill', 'name category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await SwapRequest.countDocuments(query);

    res.json({
      swaps,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalSwaps: total
    });
  } catch (error) {
    console.error('Get admin swaps error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// @desc    Get all feedback for admin
// @route   GET /api/admin/feedback
// @access  Private (Admin only)
router.get('/feedback', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const feedback = await Feedback.find()
      .populate('reviewer', 'name email')
      .populate('reviewee', 'name email')
      .populate('swapRequest', 'status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Feedback.countDocuments();

    res.json({
      feedback,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalFeedback: total
    });
  } catch (error) {
    console.error('Get admin feedback error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// @desc    Send platform-wide message
// @route   POST /api/admin/broadcast
// @access  Private (Admin only)
router.post('/broadcast', [
  body('message').trim().isLength({ min: 1, max: 1000 }).withMessage('Message must be between 1 and 1000 characters'),
  body('type').isIn(['announcement', 'maintenance', 'update']).withMessage('Invalid message type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { message, type } = req.body;

    // Here you would typically send emails or push notifications
    // For now, we'll just log the action
    await AdminAction.create({
      admin: req.user.id,
      targetUser: req.user.id, // Self-reference for broadcast messages
      actionType: 'message',
      reason: `Broadcast message sent: ${type}`,
      details: {
        messageType: type,
        message: message
      }
    });

    res.json({ 
      message: 'Broadcast message sent successfully',
      broadcastMessage: message,
      type: type
    });
  } catch (error) {
    console.error('Broadcast message error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// @desc    Get admin actions log
// @route   GET /api/admin/actions
// @access  Private (Admin only)
router.get('/actions', async (req, res) => {
  try {
    const { page = 1, limit = 20, actionType } = req.query;
    const skip = (page - 1) * limit;

    let query = {};

    if (actionType) {
      query.actionType = actionType;
    }

    const actions = await AdminAction.find(query)
      .populate('admin', 'name email')
      .populate('targetUser', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await AdminAction.countDocuments(query);

    res.json({
      actions,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalActions: total
    });
  } catch (error) {
    console.error('Get admin actions error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// @desc    Generate reports
// @route   GET /api/admin/reports
// @access  Private (Admin only)
router.get('/reports', async (req, res) => {
  try {
    const { type, format = 'json' } = req.query;

    let reportData = {};

    switch (type) {
      case 'users':
        reportData = await User.find({ isActive: true })
          .select('name email location joinedAt lastLogin')
          .sort({ joinedAt: -1 });
        break;
      
      case 'swaps':
        reportData = await SwapRequest.find()
          .populate('requester', 'name email')
          .populate('requestee', 'name email')
          .populate('offeredSkill', 'name category')
          .populate('wantedSkill', 'name category')
          .sort({ createdAt: -1 });
        break;
      
      case 'feedback':
        reportData = await Feedback.find()
          .populate('reviewer', 'name email')
          .populate('reviewee', 'name email')
          .sort({ createdAt: -1 });
        break;
      
      default:
        return res.status(400).json({ message: 'Invalid report type' });
    }

    if (format === 'csv') {
      // In a real implementation, you would convert to CSV format
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${type}-report.csv"`);
    }

    res.json({
      reportType: type,
      generatedAt: new Date().toISOString(),
      data: reportData
    });
  } catch (error) {
    console.error('Generate reports error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
