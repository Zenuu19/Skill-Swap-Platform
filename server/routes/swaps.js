const express = require('express');
const { body, validationResult } = require('express-validator');
const SwapRequest = require('../models/SwapRequest');
const SimpleSwapRequest = require('../models/SimpleSwapRequest');
const UserSkill = require('../models/UserSkill');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @desc    Get user's swap requests
// @route   GET /api/swaps
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, type } = req.query;
    const skip = (page - 1) * limit;

    let query = {};

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by type (sent or received)
    if (type === 'sent') {
      query.requester = req.user.id;
    } else if (type === 'received') {
      query.requestee = req.user.id;
    } else {
      // Get both sent and received
      query.$or = [
        { requester: req.user.id },
        { requestee: req.user.id }
      ];
    }

    const swapRequests = await SwapRequest.find(query)
      .populate('requester', 'name profilePhoto location')
      .populate('requestee', 'name profilePhoto location')
      .populate('offeredSkill', 'name category')
      .populate('wantedSkill', 'name category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await SwapRequest.countDocuments(query);

    // Add a field to indicate if the current user is the requester
    const requestsWithUserType = swapRequests.map(request => {
      const requestObj = request.toObject();
      requestObj.isRequester = request.requester._id.toString() === req.user.id;
      return requestObj;
    });

    res.json({
      swapRequests: requestsWithUserType,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalRequests: total
    });
  } catch (error) {
    console.error('Get swap requests error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// @desc    Get user's simple swap requests
// @route   GET /api/swaps/simple
// @access  Private
router.get('/simple', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, type } = req.query;
    const skip = (page - 1) * limit;

    let query = {};

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by type (sent or received)
    if (type === 'sent') {
      query.requester = req.user.id;
    } else if (type === 'received') {
      query.requestee = req.user.id;
    } else {
      // Get both sent and received
      query.$or = [
        { requester: req.user.id },
        { requestee: req.user.id }
      ];
    }

    const swapRequests = await SimpleSwapRequest.find(query)
      .populate('requester', 'name profilePhoto location email')
      .populate('requestee', 'name profilePhoto location email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await SimpleSwapRequest.countDocuments(query);

    // Add a field to indicate if the current user is the requester
    const requestsWithUserType = swapRequests.map(request => {
      const requestObj = request.toObject();
      requestObj.isRequester = request.requester._id.toString() === req.user.id;
      return requestObj;
    });

    res.json({
      swapRequests: requestsWithUserType,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalRequests: total
    });
  } catch (error) {
    console.error('Get simple swap requests error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// @desc    Create simple swap request (with skill names)
// @route   POST /api/swaps/simple
// @access  Private
router.post('/simple', protect, [
  body('requesteeId').isMongoId().withMessage('Invalid requestee ID'),
  body('offeredSkill').trim().isLength({ min: 1, max: 100 }).withMessage('Offered skill is required and must be less than 100 characters'),
  body('wantedSkill').trim().isLength({ min: 1, max: 100 }).withMessage('Wanted skill is required and must be less than 100 characters'),
  body('message').optional().trim().isLength({ max: 500 }).withMessage('Message cannot exceed 500 characters')
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

    const { requesteeId, offeredSkill, wantedSkill, message } = req.body;

    // Check if user is trying to send request to themselves
    if (requesteeId === req.user.id) {
      return res.status(400).json({ message: 'You cannot send a swap request to yourself' });
    }

    // For now, we'll create a simple swap request document
    // This can be enhanced later to integrate with the full skill system
    
    // Check if a similar request already exists
    const existingRequest = await SimpleSwapRequest.findOne({
      requester: req.user.id,
      requestee: requesteeId,
      offeredSkill,
      wantedSkill,
      status: { $in: ['pending', 'accepted'] }
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'A similar swap request already exists' });
    }

    const swapRequest = await SimpleSwapRequest.create({
      requester: req.user.id,
      requestee: requesteeId,
      offeredSkill,
      wantedSkill,
      message
    });

    // Populate the request with user details
    await swapRequest.populate([
      { path: 'requester', select: 'name profilePhoto location' },
      { path: 'requestee', select: 'name profilePhoto location' }
    ]);

    res.status(201).json({
      message: 'Swap request sent successfully',
      swapRequest
    });
  } catch (error) {
    console.error('Create simple swap request error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// @desc    Create swap request
// @route   POST /api/swaps
// @access  Private
router.post('/', protect, [
  body('requesteeId').isMongoId().withMessage('Invalid requestee ID'),
  body('offeredSkillId').isMongoId().withMessage('Invalid offered skill ID'),
  body('wantedSkillId').isMongoId().withMessage('Invalid wanted skill ID'),
  body('message').optional().trim().isLength({ max: 500 }).withMessage('Message cannot exceed 500 characters')
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

    const { requesteeId, offeredSkillId, wantedSkillId, message } = req.body;

    // Check if user is trying to send request to themselves
    if (requesteeId === req.user.id) {
      return res.status(400).json({ message: 'You cannot send a swap request to yourself' });
    }

    // Verify that the requester has the offered skill
    const requesterSkill = await UserSkill.findOne({
      user: req.user.id,
      skill: offeredSkillId,
      type: 'offered',
      isActive: true
    });

    if (!requesterSkill) {
      return res.status(400).json({ message: 'You do not have this skill in your offered skills' });
    }

    // Verify that the requestee has the wanted skill
    const requesteeSkill = await UserSkill.findOne({
      user: requesteeId,
      skill: wantedSkillId,
      type: 'offered',
      isActive: true
    });

    if (!requesteeSkill) {
      return res.status(400).json({ message: 'The requested user does not offer this skill' });
    }

    // Check if a similar request already exists
    const existingRequest = await SwapRequest.findOne({
      requester: req.user.id,
      requestee: requesteeId,
      offeredSkill: offeredSkillId,
      wantedSkill: wantedSkillId,
      status: { $in: ['pending', 'accepted'] }
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'A similar swap request already exists' });
    }

    // Create swap request
    const swapRequest = await SwapRequest.create({
      requester: req.user.id,
      requestee: requesteeId,
      offeredSkill: offeredSkillId,
      wantedSkill: wantedSkillId,
      message
    });

    await swapRequest.populate([
      { path: 'requester', select: 'name profilePhoto location' },
      { path: 'requestee', select: 'name profilePhoto location' },
      { path: 'offeredSkill', select: 'name category' },
      { path: 'wantedSkill', select: 'name category' }
    ]);

    res.status(201).json({
      message: 'Swap request sent successfully',
      swapRequest
    });
  } catch (error) {
    console.error('Create swap request error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// @desc    Get completed swap requests for feedback
// @route   GET /api/swaps/completed
// @access  Private
router.get('/completed', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Get completed swaps where user is involved
    const query = {
      status: 'completed',
      $or: [
        { requester: req.user.id },
        { requestee: req.user.id }
      ]
    };

    // Use SimpleSwapRequest for completed swaps since that's what we're using now
    const swapRequests = await SimpleSwapRequest.find(query)
      .populate('requester', 'name profilePhoto location email')
      .populate('requestee', 'name profilePhoto location email')
      .sort({ completedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get feedback that current user has already given
    const Feedback = require('../models/Feedback');
    const givenFeedbackSwapIds = await Feedback.find({
      reviewer: req.user.id
    }).distinct('swapRequest');

    // Filter out swaps where user has already given feedback
    const swapsNeedingFeedback = swapRequests.filter(swap => 
      !givenFeedbackSwapIds.some(feedbackSwapId => 
        feedbackSwapId.toString() === swap._id.toString()
      )
    );

    const total = swapsNeedingFeedback.length;

    // Add a field to indicate if the current user is the requester
    const swapsWithUserType = swapsNeedingFeedback.map(swap => {
      const swapObj = swap.toObject();
      swapObj.isRequester = swap.requester._id.toString() === req.user.id;
      return swapObj;
    });

    res.json({
      swaps: swapsWithUserType,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalSwaps: total
    });
  } catch (error) {
    console.error('Get completed swaps error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// @desc    Get swap request by ID
// @route   GET /api/swaps/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const swapRequest = await SwapRequest.findById(req.params.id)
      .populate('requester', 'name profilePhoto location email')
      .populate('requestee', 'name profilePhoto location email')
      .populate('offeredSkill', 'name category description')
      .populate('wantedSkill', 'name category description');

    if (!swapRequest) {
      return res.status(404).json({ message: 'Swap request not found' });
    }

    // Check if user is involved in this swap request
    if (swapRequest.requester._id.toString() !== req.user.id && 
        swapRequest.requestee._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const requestObj = swapRequest.toObject();
    requestObj.isRequester = swapRequest.requester._id.toString() === req.user.id;

    res.json({ swapRequest: requestObj });
  } catch (error) {
    console.error('Get swap request by ID error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// @desc    Accept swap request
// @route   PUT /api/swaps/:id/accept
// @access  Private
router.put('/:id/accept', protect, [
  body('responseMessage').optional().trim().isLength({ max: 500 }).withMessage('Response message cannot exceed 500 characters')
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

    const { responseMessage } = req.body;

    const swapRequest = await SwapRequest.findById(req.params.id);

    if (!swapRequest) {
      return res.status(404).json({ message: 'Swap request not found' });
    }

    // Check if user is the requestee
    if (swapRequest.requestee.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the requestee can accept this request' });
    }

    // Check if request is still pending
    if (swapRequest.status !== 'pending') {
      return res.status(400).json({ message: 'This request is no longer pending' });
    }

    // Update request
    swapRequest.status = 'accepted';
    swapRequest.responseMessage = responseMessage;
    swapRequest.acceptedAt = new Date();

    await swapRequest.save();

    await swapRequest.populate([
      { path: 'requester', select: 'name profilePhoto location' },
      { path: 'requestee', select: 'name profilePhoto location' },
      { path: 'offeredSkill', select: 'name category' },
      { path: 'wantedSkill', select: 'name category' }
    ]);

    res.json({
      message: 'Swap request accepted successfully',
      swapRequest
    });
  } catch (error) {
    console.error('Accept swap request error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// @desc    Reject swap request
// @route   PUT /api/swaps/:id/reject
// @access  Private
router.put('/:id/reject', protect, [
  body('responseMessage').optional().trim().isLength({ max: 500 }).withMessage('Response message cannot exceed 500 characters')
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

    const { responseMessage } = req.body;

    const swapRequest = await SwapRequest.findById(req.params.id);

    if (!swapRequest) {
      return res.status(404).json({ message: 'Swap request not found' });
    }

    // Check if user is the requestee
    if (swapRequest.requestee.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the requestee can reject this request' });
    }

    // Check if request is still pending
    if (swapRequest.status !== 'pending') {
      return res.status(400).json({ message: 'This request is no longer pending' });
    }

    // Update request
    swapRequest.status = 'rejected';
    swapRequest.responseMessage = responseMessage;
    swapRequest.rejectedAt = new Date();

    await swapRequest.save();

    await swapRequest.populate([
      { path: 'requester', select: 'name profilePhoto location' },
      { path: 'requestee', select: 'name profilePhoto location' },
      { path: 'offeredSkill', select: 'name category' },
      { path: 'wantedSkill', select: 'name category' }
    ]);

    res.json({
      message: 'Swap request rejected successfully',
      swapRequest
    });
  } catch (error) {
    console.error('Reject swap request error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// @desc    Cancel swap request
// @route   PUT /api/swaps/:id/cancel
// @access  Private
router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const swapRequest = await SwapRequest.findById(req.params.id);

    if (!swapRequest) {
      return res.status(404).json({ message: 'Swap request not found' });
    }

    // Check if user is the requester
    if (swapRequest.requester.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the requester can cancel this request' });
    }

    // Check if request can be cancelled
    if (swapRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending requests can be cancelled' });
    }

    // Update request
    swapRequest.status = 'cancelled';
    swapRequest.cancelledAt = new Date();

    await swapRequest.save();

    res.json({
      message: 'Swap request cancelled successfully',
      swapRequest
    });
  } catch (error) {
    console.error('Cancel swap request error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// @desc    Mark swap as completed
// @route   PUT /api/swaps/:id/complete
// @access  Private
router.put('/:id/complete', protect, async (req, res) => {
  try {
    const swapRequest = await SwapRequest.findById(req.params.id);

    if (!swapRequest) {
      return res.status(404).json({ message: 'Swap request not found' });
    }

    // Check if user is involved in this swap
    if (swapRequest.requester.toString() !== req.user.id && 
        swapRequest.requestee.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if request is accepted
    if (swapRequest.status !== 'accepted') {
      return res.status(400).json({ message: 'Only accepted requests can be marked as completed' });
    }

    // Update request
    swapRequest.status = 'completed';
    swapRequest.completedAt = new Date();

    await swapRequest.save();

    await swapRequest.populate([
      { path: 'requester', select: 'name profilePhoto location' },
      { path: 'requestee', select: 'name profilePhoto location' },
      { path: 'offeredSkill', select: 'name category' },
      { path: 'wantedSkill', select: 'name category' }
    ]);

    res.json({
      message: 'Swap marked as completed successfully',
      swapRequest
    });
  } catch (error) {
    console.error('Complete swap request error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// @desc    Delete swap request
// @route   DELETE /api/swaps/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const swapRequest = await SwapRequest.findById(req.params.id);

    if (!swapRequest) {
      return res.status(404).json({ message: 'Swap request not found' });
    }

    // Check if user is the requester
    if (swapRequest.requester.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the requester can delete this request' });
    }

    // Check if request can be deleted (only pending or rejected requests)
    if (!['pending', 'rejected'].includes(swapRequest.status)) {
      return res.status(400).json({ message: 'Only pending or rejected requests can be deleted' });
    }

    await SwapRequest.findByIdAndDelete(req.params.id);

    res.json({ message: 'Swap request deleted successfully' });
  } catch (error) {
    console.error('Delete swap request error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// @desc    Mark simple swap request as complete
// @route   PATCH /api/swaps/simple/:id/complete
// @access  Private
router.patch('/simple/:id/complete', protect, async (req, res) => {
  try {
    const swapRequest = await SimpleSwapRequest.findById(req.params.id)
      .populate('requester', 'name profilePhoto location email')
      .populate('requestee', 'name profilePhoto location email');

    if (!swapRequest) {
      return res.status(404).json({ message: 'Swap request not found' });
    }

    // Check if the current user is involved in this swap request
    if (swapRequest.requester._id.toString() !== req.user.id && 
        swapRequest.requestee._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to modify this request' });
    }

    // Check if request is accepted (can only complete accepted requests)
    if (swapRequest.status !== 'accepted') {
      return res.status(400).json({ message: 'Only accepted requests can be marked as completed' });
    }

    // Update status to completed
    swapRequest.status = 'completed';
    swapRequest.completedAt = new Date();
    await swapRequest.save();

    res.json({
      message: 'Request marked as completed successfully',
      swapRequest
    });
  } catch (error) {
    console.error('Mark complete swap request error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// @desc    Update simple swap request status (accept/reject)
// @route   PATCH /api/swaps/simple/:id/:action
// @access  Private
router.patch('/simple/:id/:action', protect, async (req, res) => {
  try {
    const { id, action } = req.params;

    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action. Use accept or reject.' });
    }

    const swapRequest = await SimpleSwapRequest.findById(id)
      .populate('requester', 'name profilePhoto location')
      .populate('requestee', 'name profilePhoto location');

    if (!swapRequest) {
      return res.status(404).json({ message: 'Swap request not found' });
    }

    // Check if the current user is the requestee (only they can accept/reject)
    if (swapRequest.requestee._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to modify this request' });
    }

    // Check if request is still pending
    if (swapRequest.status !== 'pending') {
      return res.status(400).json({ message: 'This request has already been processed' });
    }

    // Update status
    swapRequest.status = action === 'accept' ? 'accepted' : 'rejected';
    await swapRequest.save();

    res.json({
      message: `Request ${action}ed successfully`,
      swapRequest
    });
  } catch (error) {
    console.error('Update simple swap request error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// @desc    Delete simple swap request
// @route   DELETE /api/swaps/simple/:id
// @access  Private
router.delete('/simple/:id', protect, async (req, res) => {
  try {
    const swapRequest = await SimpleSwapRequest.findById(req.params.id);

    if (!swapRequest) {
      return res.status(404).json({ message: 'Swap request not found' });
    }

    // Check if user is involved in this swap request
    if (swapRequest.requester.toString() !== req.user.id && 
        swapRequest.requestee.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this request' });
    }

    await SimpleSwapRequest.findByIdAndDelete(req.params.id);

    res.json({ message: 'Swap request deleted successfully' });
  } catch (error) {
    console.error('Delete simple swap request error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
