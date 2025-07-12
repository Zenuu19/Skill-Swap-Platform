import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const SwapRequests = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('received');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [user, activeTab]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get(`/swaps/simple?type=${activeTab}`);
      setRequests(response.data.swapRequests || []);
    } catch (err) {
      setError('Failed to load swap requests');
      console.error('Error fetching requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async (requestId, action) => {
    try {
      await api.patch(`/swaps/simple/${requestId}/${action}`);
      setRequests(prev => prev.map(req => 
        req._id === requestId 
          ? { ...req, status: action === 'accept' ? 'accepted' : 'rejected' }
          : req
      ));
    } catch (err) {
      alert(`Failed to ${action} request. Please try again.`);
      console.error(`Error ${action}ing request:`, err);
    }
  };

  const deleteRequest = async (requestId) => {
    if (!window.confirm('Are you sure you want to delete this request?')) {
      return;
    }

    try {
      await api.delete(`/swaps/simple/${requestId}`);
      setRequests(prev => prev.filter(req => req._id !== requestId));
    } catch (err) {
      alert('Failed to delete request. Please try again.');
      console.error('Error deleting request:', err);
    }
  };

  const contactUser = (request) => {
    const otherUser = activeTab === 'received' ? request.requester : request.requestee;
    const subject = `Regarding Skill Swap Request - ${request.offeredSkill} for ${request.wantedSkill}`;
    const body = `Hi ${otherUser.name},

I'm reaching out regarding our skill swap request where you offered "${request.offeredSkill}" in exchange for "${request.wantedSkill}".

${request.message ? `Your message: "${request.message}"` : ''}

Let's discuss the details of our skill exchange.

Best regards,
${user.name}`;

    const mailtoLink = `mailto:${otherUser.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink);
  };

  const markComplete = async (requestId) => {
    if (!window.confirm('Are you sure you want to mark this swap as completed?')) {
      return;
    }

    try {
      await api.patch(`/swaps/simple/${requestId}/complete`);
      setRequests(prev => prev.map(req => 
        req._id === requestId 
          ? { ...req, status: 'completed' }
          : req
      ));
    } catch (err) {
      alert('Failed to mark request as complete. Please try again.');
      console.error('Error marking request complete:', err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Swap Requests</h1>
        <p className="text-gray-600">Manage your incoming and outgoing skill swap requests</p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('received')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'received'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Received Requests
              {requests.filter(req => req.status === 'pending').length > 0 && (
                <span className="ml-2 bg-red-100 text-red-600 py-0.5 px-2 rounded-full text-xs">
                  {requests.filter(req => req.status === 'pending').length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('sent')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'sent'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Sent Requests
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

      {/* Requests List */}
      <div className="space-y-4">
        {requests.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No {activeTab} requests
            </h3>
            <p className="text-gray-600">
              {activeTab === 'received' 
                ? "You haven't received any skill swap requests yet."
                : "You haven't sent any skill swap requests yet."
              }
            </p>
          </div>
        ) : (
          requests.map(request => (
            <div key={request._id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <img
                        src={
                          activeTab === 'received' 
                            ? (request.requester?.profilePhoto ? `/${request.requester.profilePhoto}` : '/default-avatar.svg')
                            : (request.requestee?.profilePhoto ? `/${request.requestee.profilePhoto}` : '/default-avatar.svg')
                        }
                        alt={
                          activeTab === 'received' 
                            ? request.requester?.name
                            : request.requestee?.name
                        }
                        className="w-12 h-12 rounded-full object-cover"
                        onError={(e) => {
                          e.target.src = '/default-avatar.svg';
                        }}
                      />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {activeTab === 'received' 
                            ? request.requester?.name
                            : request.requestee?.name
                          }
                        </h3>
                        <p className="text-sm text-gray-600">
                          {activeTab === 'received' 
                            ? `${request.requester?.location || 'Location not specified'}`
                            : `${request.requestee?.location || 'Location not specified'}`
                          }
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                  </div>

                  {/* Skills Exchange */}
                  {request.offeredSkill && request.wantedSkill && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Skill Exchange</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Offering</p>
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                            {request.offeredSkill}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Wants</p>
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                            {request.wantedSkill}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Message */}
                  {request.message && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Message</h4>
                      <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded">
                        "{request.message}"
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Sent: {formatDate(request.createdAt)}</span>
                    {request.respondedAt && (
                      <span>Responded: {formatDate(request.respondedAt)}</span>
                    )}
                    {request.completedAt && (
                      <span>Completed: {formatDate(request.completedAt)}</span>
                    )}
                  </div>

                  {/* Completion Message */}
                  {request.status === 'completed' && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800 font-medium">
                        ✅ Skill swap completed successfully!
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Thank you for participating in our skill exchange community.
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="mt-4 lg:mt-0 lg:ml-6 flex flex-col sm:flex-row gap-2">
                  {activeTab === 'received' && request.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleRequest(request._id, 'accept')}
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 font-medium text-sm"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleRequest(request._id, 'reject')}
                        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 font-medium text-sm"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => contactUser(request)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium text-sm"
                      >
                        Contact User
                      </button>
                    </>
                  )}
                  
                  {activeTab === 'received' && request.status === 'accepted' && (
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => contactUser(request)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium text-sm"
                      >
                        Contact User
                      </button>
                      <button 
                        onClick={() => markComplete(request._id)}
                        className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 font-medium text-sm"
                      >
                        Mark Complete
                      </button>
                    </div>
                  )}
                  
                  {activeTab === 'sent' && request.status === 'pending' && (
                    <button
                      onClick={() => deleteRequest(request._id)}
                      className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 font-medium text-sm"
                    >
                      Cancel Request
                    </button>
                  )}

                  {activeTab === 'sent' && request.status === 'accepted' && (
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => contactUser(request)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium text-sm"
                      >
                        Contact User
                      </button>
                      <button 
                        onClick={() => markComplete(request._id)}
                        className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 font-medium text-sm"
                      >
                        Mark Complete
                      </button>
                    </div>
                  )}

                  {/* For completed requests, only show contact option */}
                  {request.status === 'completed' && (
                    <button
                      onClick={() => contactUser(request)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium text-sm"
                    >
                      Contact User
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Stats Summary */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {requests.filter(req => req.status === 'pending').length}
          </div>
          <div className="text-sm text-gray-600">Pending</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {requests.filter(req => req.status === 'accepted').length}
          </div>
          <div className="text-sm text-gray-600">Accepted</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-red-600">
            {requests.filter(req => req.status === 'rejected').length}
          </div>
          <div className="text-sm text-gray-600">Rejected</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {requests.filter(req => req.status === 'completed').length}
          </div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
      </div>
    </div>
  );
};

export default SwapRequests;
