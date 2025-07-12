import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const Feedback = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('pending');
  const [feedbacks, setFeedbacks] = useState([]);
  const [completedSwaps, setCompletedSwaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedbackForm, setFeedbackForm] = useState({
    swapId: '',
    rating: 5,
    comment: '',
    isRecommended: true
  });
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (activeTab === 'pending') {
        // Fetch completed swaps that need feedback
        const response = await api.get('/swaps/completed');
        setCompletedSwaps(response.data.swaps || []);
      } else {
        // Fetch given/received feedback
        const endpoint = activeTab === 'given' ? '/feedback/given' : '/feedback/received';
        const response = await api.get(endpoint);
        setFeedbacks(response.data.feedback || []);
      }
    } catch (err) {
      setError('Failed to load feedback data');
      console.error('Error fetching feedback:', err);
    } finally {
      setLoading(false);
    }
  };

  const openFeedbackModal = (swap) => {
    setFeedbackForm({
      swapId: swap._id,
      rating: 5,
      comment: '',
      isRecommended: true
    });
    setShowFeedbackModal(true);
  };

  const closeFeedbackModal = () => {
    setShowFeedbackModal(false);
    setFeedbackForm({
      swapId: '',
      rating: 5,
      comment: '',
      isRecommended: true
    });
  };

  const submitFeedback = async (e) => {
    e.preventDefault();
    try {
      await api.post('/feedback/simple', feedbackForm);
      alert('Feedback submitted successfully!');
      closeFeedbackModal();
      fetchData(); // Refresh data
    } catch (err) {
      alert('Failed to submit feedback. Please try again.');
      console.error('Error submitting feedback:', err);
    }
  };

  const StarRating = ({ rating, onRatingChange, readOnly = false }) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => !readOnly && onRatingChange && onRatingChange(star)}
            className={`text-2xl ${readOnly ? 'cursor-default' : 'cursor-pointer'} ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            } hover:text-yellow-400 transition-colors`}
            disabled={readOnly}
          >
            ★
          </button>
        ))}
      </div>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Feedback & Reviews</h1>
        <p className="text-gray-600">Rate your skill swap experiences and view feedback from others</p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('pending')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'pending'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Pending Reviews
              {completedSwaps.length > 0 && (
                <span className="ml-2 bg-red-100 text-red-600 py-0.5 px-2 rounded-full text-xs">
                  {completedSwaps.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('given')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'given'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Reviews Given
            </button>
            <button
              onClick={() => setActiveTab('received')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'received'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Reviews Received
            </button>
          </nav>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Content based on active tab */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {completedSwaps.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">✅</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No pending reviews</h3>
              <p className="text-gray-600">Complete some skill swaps to leave feedback!</p>
            </div>
          ) : (
            completedSwaps.map(swap => (
              <div key={swap._id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-4">
                      <img
                        src={
                          swap.requester?._id === user.id 
                            ? (swap.requestee?.profilePhoto ? `/${swap.requestee.profilePhoto}` : '/default-avatar.svg')
                            : (swap.requester?.profilePhoto ? `/${swap.requester.profilePhoto}` : '/default-avatar.svg')
                        }
                        alt={
                          swap.requester?._id === user.id 
                            ? swap.requestee?.name
                            : swap.requester?.name
                        }
                        className="w-12 h-12 rounded-full object-cover"
                        onError={(e) => {
                          e.target.src = '/default-avatar.svg';
                        }}
                      />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Swap with {swap.requester?._id === user.id 
                            ? swap.requestee?.name
                            : swap.requester?.name
                          }
                        </h3>
                        <p className="text-sm text-gray-600">
                          Completed on {formatDate(swap.completedAt || swap.updatedAt)}
                        </p>
                      </div>
                    </div>

                    {swap.offeredSkill && swap.wantedSkill && (
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Skills Exchanged</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">You taught</p>
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                              {swap.requester?._id === user.id ? swap.offeredSkill : swap.wantedSkill}
                            </span>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">You learned</p>
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                              {swap.requester?._id === user.id ? swap.wantedSkill : swap.offeredSkill}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => openFeedbackModal(swap)}
                    className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 font-medium"
                  >
                    Leave Review
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {(activeTab === 'given' || activeTab === 'received') && (
        <div className="space-y-4">
          {feedbacks.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">💬</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No {activeTab} reviews yet
              </h3>
              <p className="text-gray-600">
                {activeTab === 'given' 
                  ? "You haven't given any reviews yet."
                  : "You haven't received any reviews yet."
                }
              </p>
            </div>
          ) : (
            feedbacks.map(feedback => (
              <div key={feedback._id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start space-x-4">
                  <img
                    src={
                      activeTab === 'given' 
                        ? (feedback.reviewee?.profilePhoto ? `/${feedback.reviewee.profilePhoto}` : '/default-avatar.svg')
                        : (feedback.reviewer?.profilePhoto ? `/${feedback.reviewer.profilePhoto}` : '/default-avatar.svg')
                    }
                    alt={
                      activeTab === 'given' 
                        ? feedback.reviewee?.name
                        : feedback.reviewer?.name
                    }
                    className="w-12 h-12 rounded-full object-cover"
                    onError={(e) => {
                      e.target.src = '/default-avatar.svg';
                    }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {activeTab === 'given' 
                            ? feedback.reviewee?.name
                            : feedback.reviewer?.name
                          }
                        </h3>
                        <p className="text-sm text-gray-600">
                          {formatDate(feedback.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <StarRating rating={feedback.rating} readOnly={true} />
                        <span className="text-sm text-gray-600">({feedback.rating}/5)</span>
                      </div>
                    </div>

                    {feedback.comment && (
                      <p className="text-gray-700 mb-3 bg-gray-50 p-3 rounded">
                        "{feedback.comment}"
                      </p>
                    )}

                    <div className="flex items-center space-x-4 text-sm">
                      <span className={`px-2 py-1 rounded text-xs ${
                        feedback.isRecommended 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {feedback.isRecommended ? '✓ Recommended' : '✗ Not Recommended'}
                      </span>
                      {feedback.swapRequest?.offeredSkill && (
                        <span className="text-gray-500">
                          Skill: {feedback.swapRequest.offeredSkill}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Leave Feedback</h2>
                <button
                  onClick={closeFeedbackModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={submitFeedback} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rating *
                  </label>
                  <StarRating 
                    rating={feedbackForm.rating}
                    onRatingChange={(rating) => setFeedbackForm(prev => ({ ...prev, rating }))}
                  />
                  <p className="text-xs text-gray-500 mt-1">Click on stars to rate</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comment
                  </label>
                  <textarea
                    value={feedbackForm.comment}
                    onChange={(e) => setFeedbackForm(prev => ({ ...prev, comment: e.target.value }))}
                    rows={4}
                    placeholder="Share your experience with this skill swap..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={feedbackForm.isRecommended}
                      onChange={(e) => setFeedbackForm(prev => ({ ...prev, isRecommended: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">I would recommend this person to others</span>
                  </label>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={closeFeedbackModal}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium"
                  >
                    Submit Review
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Average Rating Summary */}
      {activeTab === 'received' && feedbacks.length > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Rating Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {(feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">Average Rating</div>
              <StarRating 
                rating={Math.round(feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length)} 
                readOnly={true} 
              />
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {feedbacks.filter(f => f.isRecommended).length}
              </div>
              <div className="text-sm text-gray-600">Recommendations</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {feedbacks.length}
              </div>
              <div className="text-sm text-gray-600">Total Reviews</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Feedback;
