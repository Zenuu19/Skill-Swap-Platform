const express = require('express');
const { body, validationResult } = require('express-validator');
const Feedback = require('../models/Feedback');
const SwapRequest = require('../models/SwapRequest');
const SimpleSwapRequest = require('../models/SimpleSwapRequest');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @desc    Get feedback for a user
// @route   GET /api/feedback/user/:userId
// @access  Public
router.get('/user/:userId', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const feedback = await Feedback.find({ 
      reviewee: req.params.userId,
      isPublic: true 
    })
    .populate('reviewer', 'name profilePhoto')
    .populate('swapRequest', 'offeredSkill wantedSkill')
    .populate({
      path: 'swapRequest',
      populate: [
        { path: 'offeredSkill', select: 'name category' },
        { path: 'wantedSkill', select: 'name category' }
      ]
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    const total = await Feedback.countDocuments({ 
      reviewee: req.params.userId,
      isPublic: true 
    });

    // Calculate average ratings
    const avgRating = feedback.length > 0 
      ? feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length 
      : 0;

    const avgSkillRating = feedback.length > 0
      ? feedback.reduce((sum, f) => sum + (f.skillRating || 0), 0) / feedback.length
      : 0;

    const avgCommunicationRating = feedback.length > 0
      ? feedback.reduce((sum, f) => sum + (f.communicationRating || 0), 0) / feedback.length
      : 0;

    res.json({
      feedback,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalFeedback: total,
      avgRating: Math.round(avgRating * 10) / 10,
      avgSkillRating: Math.round(avgSkillRating * 10) / 10,
      avgCommunicationRating: Math.round(avgCommunicationRating * 10) / 10
    });
  } catch (error) {
    console.error('Get user feedback error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// @desc    Get feedback given by a user
// @route   GET /api/feedback/given
// @access  Private
router.get('/given', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const feedback = await Feedback.find({ reviewer: req.user.id })
      .populate('reviewee', 'name profilePhoto')
      .populate('swapRequest', 'offeredSkill wantedSkill')
      .populate({
        path: 'swapRequest',
        populate: [
          { path: 'offeredSkill', select: 'name category' },
          { path: 'wantedSkill', select: 'name category' }
        ]
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Feedback.countDocuments({ reviewer: req.user.id });

    // Transform feedback to include isRecommended field
    const transformedFeedback = feedback.map(f => {
      const feedbackObj = f.toObject();
      feedbackObj.isRecommended = feedbackObj.recommendsUser;
      return feedbackObj;
    });

    res.json({
      feedback: transformedFeedback,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalFeedback: total
    });
  } catch (error) {
    console.error('Get given feedback error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// @desc    Get feedback received by current user
// @route   GET /api/feedback/received
// @access  Private
router.get('/received', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const feedback = await Feedback.find({ reviewee: req.user.id })
      .populate('reviewer', 'name profilePhoto')
      .populate('swapRequest', 'offeredSkill wantedSkill')
      .populate({
        path: 'swapRequest',
        populate: [
          { path: 'offeredSkill', select: 'name category' },
          { path: 'wantedSkill', select: 'name category' }
        ]
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Feedback.countDocuments({ reviewee: req.user.id });

    // Transform feedback to include isRecommended field
    const transformedFeedback = feedback.map(f => {
      const feedbackObj = f.toObject();
      feedbackObj.isRecommended = feedbackObj.recommendsUser;
      return feedbackObj;
    });

    res.json({
      feedback: transformedFeedback,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalFeedback: total
    });
  } catch (error) {
    console.error('Get received feedback error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// @desc    Create feedback for a swap
// @route   POST /api/feedback
// @access  Private
router.post('/', protect, [
  body('swapRequestId').isMongoId().withMessage('Invalid swap request ID'),
  body('revieweeId').isMongoId().withMessage('Invalid reviewee ID'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().trim().isLength({ max: 500 }).withMessage('Comment cannot exceed 500 characters'),
  body('skillRating').optional().isInt({ min: 1, max: 5 }).withMessage('Skill rating must be between 1 and 5'),
  body('communicationRating').optional().isInt({ min: 1, max: 5 }).withMessage('Communication rating must be between 1 and 5'),
  body('recommendsUser').optional().isBoolean().withMessage('Recommends user must be a boolean'),
  body('isPublic').optional().isBoolean().withMessage('Is public must be a boolean')
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

    const { 
      swapRequestId, 
      revieweeId, 
      rating, 
      comment, 
      skillRating, 
      communicationRating, 
      recommendsUser, 
      isPublic 
    } = req.body;

    // Check if swap request exists and is completed
    const swapRequest = await SwapRequest.findById(swapRequestId);
    if (!swapRequest) {
      return res.status(404).json({ message: 'Swap request not found' });
    }

    if (swapRequest.status !== 'completed') {
      return res.status(400).json({ message: 'Can only provide feedback for completed swaps' });
    }

    // Check if user is involved in the swap
    if (swapRequest.requester.toString() !== req.user.id && 
        swapRequest.requestee.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only provide feedback for your own swaps' });
    }

    // Check if user is trying to review themselves
    if (revieweeId === req.user.id) {
      return res.status(400).json({ message: 'You cannot review yourself' });
    }

    // Check if the reviewee is the other party in the swap
    const otherParty = swapRequest.requester.toString() === req.user.id 
      ? swapRequest.requestee.toString() 
      : swapRequest.requester.toString();
    
    if (revieweeId !== otherParty) {
      return res.status(400).json({ message: 'You can only review the other party in the swap' });
    }

    // Check if feedback already exists
    const existingFeedback = await Feedback.findOne({
      swapRequest: swapRequestId,
      reviewer: req.user.id
    });

    if (existingFeedback) {
      return res.status(400).json({ message: 'You have already provided feedback for this swap' });
    }

    // Create feedback
    const feedback = await Feedback.create({
      swapRequest: swapRequestId,
      reviewer: req.user.id,
      reviewee: revieweeId,
      rating,
      comment,
      skillRating,
      communicationRating,
      recommendsUser: recommendsUser !== undefined ? recommendsUser : true,
      isPublic: isPublic !== undefined ? isPublic : true
    });

    await feedback.populate([
      { path: 'reviewer', select: 'name profilePhoto' },
      { path: 'reviewee', select: 'name profilePhoto' },
      { path: 'swapRequest', select: 'offeredSkill wantedSkill' }
    ]);

    res.status(201).json({
      message: 'Feedback submitted successfully',
      feedback
    });
  } catch (error) {
    console.error('Create feedback error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// @desc    Update feedback
// @route   PUT /api/feedback/:id
// @access  Private
router.put('/:id', protect, [
  body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().trim().isLength({ max: 500 }).withMessage('Comment cannot exceed 500 characters'),
  body('skillRating').optional().isInt({ min: 1, max: 5 }).withMessage('Skill rating must be between 1 and 5'),
  body('communicationRating').optional().isInt({ min: 1, max: 5 }).withMessage('Communication rating must be between 1 and 5'),
  body('recommendsUser').optional().isBoolean().withMessage('Recommends user must be a boolean'),
  body('isPublic').optional().isBoolean().withMessage('Is public must be a boolean')
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

    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    // Check if user is the reviewer
    if (feedback.reviewer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only edit your own feedback' });
    }

    // Update feedback
    const updateData = {};
    const { rating, comment, skillRating, communicationRating, recommendsUser, isPublic } = req.body;

    if (rating !== undefined) updateData.rating = rating;
    if (comment !== undefined) updateData.comment = comment;
    if (skillRating !== undefined) updateData.skillRating = skillRating;
    if (communicationRating !== undefined) updateData.communicationRating = communicationRating;
    if (recommendsUser !== undefined) updateData.recommendsUser = recommendsUser;
    if (isPublic !== undefined) updateData.isPublic = isPublic;

    const updatedFeedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate([
      { path: 'reviewer', select: 'name profilePhoto' },
      { path: 'reviewee', select: 'name profilePhoto' },
      { path: 'swapRequest', select: 'offeredSkill wantedSkill' }
    ]);

    res.json({
      message: 'Feedback updated successfully',
      feedback: updatedFeedback
    });
  } catch (error) {
    console.error('Update feedback error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// @desc    Delete feedback
// @route   DELETE /api/feedback/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    // Check if user is the reviewer
    if (feedback.reviewer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only delete your own feedback' });
    }

    await Feedback.findByIdAndDelete(req.params.id);

    res.json({ message: 'Feedback deleted successfully' });
  } catch (error) {
    console.error('Delete feedback error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// @desc    Get feedback for a specific swap
// @route   GET /api/feedback/swap/:swapId
// @access  Private
router.get('/swap/:swapId', protect, async (req, res) => {
  try {
    // Check if swap request exists and user is involved
    const swapRequest = await SwapRequest.findById(req.params.swapId);
    if (!swapRequest) {
      return res.status(404).json({ message: 'Swap request not found' });
    }

    if (swapRequest.requester.toString() !== req.user.id && 
        swapRequest.requestee.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const feedback = await Feedback.find({ swapRequest: req.params.swapId })
      .populate('reviewer', 'name profilePhoto')
      .populate('reviewee', 'name profilePhoto')
      .sort({ createdAt: -1 });

    res.json({ feedback });
  } catch (error) {
    console.error('Get swap feedback error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// @desc    Create simple feedback (for SimpleSwapRequest)
// @route   POST /api/feedback/simple
// @access  Private
router.post('/simple', protect, [
  body('swapId').isMongoId().withMessage('Invalid swap ID'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().trim().isLength({ max: 500 }).withMessage('Comment cannot exceed 500 characters'),
  body('isRecommended').optional().isBoolean().withMessage('Is recommended must be a boolean')
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

    const { swapId, rating, comment, isRecommended } = req.body;

    // Check if swap request exists and is completed
    const swapRequest = await SimpleSwapRequest.findById(swapId)
      .populate('requester', 'name email')
      .populate('requestee', 'name email');

    if (!swapRequest) {
      return res.status(404).json({ message: 'Swap request not found' });
    }

    if (swapRequest.status !== 'completed') {
      return res.status(400).json({ message: 'Can only provide feedback for completed swaps' });
    }

    // Check if user is involved in the swap
    if (swapRequest.requester._id.toString() !== req.user.id && 
        swapRequest.requestee._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only provide feedback for your own swaps' });
    }

    // Determine who is being reviewed
    const revieweeId = swapRequest.requester._id.toString() === req.user.id 
      ? swapRequest.requestee._id.toString() 
      : swapRequest.requester._id.toString();

    // Check if feedback already exists for this swap from this user
    const existingFeedback = await Feedback.findOne({
      reviewer: req.user.id,
      reviewee: revieweeId,
      swapRequest: swapId
    });

    if (existingFeedback) {
      return res.status(400).json({ message: 'You have already provided feedback for this swap' });
    }

    // Create feedback
    const feedback = await Feedback.create({
      reviewer: req.user.id,
      reviewee: revieweeId,
      swapRequest: swapId,
      rating,
      comment: comment || '',
      skillRating: rating, // Use same rating for now
      communicationRating: rating, // Use same rating for now
      recommendsUser: isRecommended !== undefined ? isRecommended : true,
      isPublic: true
    });

    await feedback.populate([
      { path: 'reviewer', select: 'name profilePhoto' },
      { path: 'reviewee', select: 'name profilePhoto' }
    ]);

    // Transform feedback to include isRecommended field
    const feedbackObj = feedback.toObject();
    feedbackObj.isRecommended = feedbackObj.recommendsUser;

    res.status(201).json({
      message: 'Feedback submitted successfully',
      feedback: feedbackObj
    });
  } catch (error) {
    console.error('Create simple feedback error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
