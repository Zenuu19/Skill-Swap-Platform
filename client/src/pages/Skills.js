import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Skills = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [location, setLocation] = useState('');
  const [availability, setAvailability] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Helper function to capitalize first letter for display
  const capitalizeFirst = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  // Modal state for swap request
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userSkills, setUserSkills] = useState({ offered: [], wanted: [] });
  const [targetUserSkills, setTargetUserSkills] = useState([]);
  const [selectedOfferedSkill, setSelectedOfferedSkill] = useState('');
  const [selectedWantedSkill, setSelectedWantedSkill] = useState('');
  const [swapMessage, setSwapMessage] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  const skillCategories = [
    'Programming & Development',
    'Design & Creative',
    'Marketing & Business',
    'Data & Analytics',
    'Language & Communication',
    'Music & Arts',
    'Sports & Fitness',
    'Cooking & Lifestyle',
    'Education & Teaching',
    'Other'
  ];

  const availabilityOptions = [
    'weekdays',
    'weekends',
    'evenings',
    'mornings',
    'flexible'
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users');
      setUsers(response.data.users || []);
    } catch (err) {
      setError('Failed to load users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(userItem => {
    // Exclude current user from the list
    if (user && (userItem._id === user.id || userItem._id === user._id)) {
      return false;
    }

    const matchesSearch = !searchTerm || 
      userItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (userItem.skillsOffered && userItem.skillsOffered.some(skill => 
        skill.toLowerCase().includes(searchTerm.toLowerCase())
      ));
    
    const matchesLocation = !location || 
      (userItem.location && userItem.location.toLowerCase().includes(location.toLowerCase()));
    
    const matchesAvailability = !availability || 
      (userItem.availability && userItem.availability.includes(availability));

    return matchesSearch && matchesLocation && matchesAvailability;
  });

  const sendSwapRequest = async (targetUserId) => {
    try {
      setSelectedUser(users.find(u => u._id === targetUserId));
      setShowSwapModal(true);
      setModalLoading(true);

      // Get current user's skills from the user object (simple strings)
      const currentUser = user;
      const currentUserSkills = {
        offered: currentUser.skillsOffered || [],
        wanted: currentUser.skillsWanted || []
      };
      setUserSkills(currentUserSkills);

      // Get target user's skills from the users array (simple strings)
      const targetUser = users.find(u => u._id === targetUserId);
      const targetUserOfferedSkills = targetUser.skillsOffered || [];
      setTargetUserSkills(targetUserOfferedSkills);

      setModalLoading(false);
    } catch (err) {
      console.error('Error loading skills:', err);
      setModalLoading(false);
      alert('Failed to load skills. Please try again.');
    }
  };

  const handleSendSwapRequest = async () => {
    if (!selectedOfferedSkill || !selectedWantedSkill) {
      alert('Please select both skills for the swap.');
      return;
    }

    try {
      setModalLoading(true);
      
      // For now, we'll send a simple swap request with skill names
      // Later this can be enhanced to work with the proper skill system
      await api.post('/swaps/simple', {
        requesteeId: selectedUser._id,
        offeredSkill: selectedOfferedSkill,
        wantedSkill: selectedWantedSkill,
        message: swapMessage || 'Hi! I would like to explore a skill swap with you.'
      });
      
      alert('Swap request sent successfully!');
      setShowSwapModal(false);
      resetModalState();
    } catch (err) {
      console.error('Error sending swap request:', err);
      // If the simple endpoint doesn't exist, show a helpful message
      if (err.response?.status === 404) {
        alert('Swap request feature is not fully set up yet. Please contact administrator.');
      } else {
        alert('Failed to send swap request. Please try again.');
      }
    } finally {
      setModalLoading(false);
    }
  };

  const resetModalState = () => {
    setSelectedUser(null);
    setUserSkills({ offered: [], wanted: [] });
    setTargetUserSkills([]);
    setSelectedOfferedSkill('');
    setSelectedWantedSkill('');
    setSwapMessage('');
    setModalLoading(false);
  };

  const handleViewProfile = (userId) => {
    navigate(`/user/${userId}`);
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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Browse Skills</h1>
        <p className="text-gray-600">Discover talented people and their skills. Connect and start swapping!</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Skills or Names
            </label>
            <input
              type="text"
              placeholder="e.g., Photoshop, JavaScript..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {skillCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <input
              type="text"
              placeholder="City or region..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Availability
            </label>
            <select
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Any Time</option>
              {availabilityOptions.map(option => (
                <option key={option} value={option}>{capitalizeFirst(option)}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="mt-4 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} found
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('');
              setLocation('');
              setAvailability('');
            }}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map(userItem => (
          <div key={userItem._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <img
                  src={userItem.profilePhoto ? `/${userItem.profilePhoto}` : '/default-avatar.svg'}
                  alt={userItem.name}
                  className="w-12 h-12 rounded-full object-cover"
                  onError={(e) => {
                    e.target.src = '/default-avatar.svg';
                  }}
                />
                <div className="ml-3">
                  <h3 className="text-lg font-semibold text-gray-900">{userItem.name}</h3>
                  {userItem.location && (
                    <p className="text-sm text-gray-600">📍 {userItem.location}</p>
                  )}
                </div>
              </div>

              {/* Skills Offered */}
              {userItem.skillsOffered && userItem.skillsOffered.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Skills Offered:</h4>
                  <div className="flex flex-wrap gap-1">
                    {userItem.skillsOffered.slice(0, 3).map((skill, index) => (
                      <span key={index} className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        {skill}
                      </span>
                    ))}
                    {userItem.skillsOffered.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{userItem.skillsOffered.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Skills Wanted */}
              {userItem.skillsWanted && userItem.skillsWanted.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Skills Wanted:</h4>
                  <div className="flex flex-wrap gap-1">
                    {userItem.skillsWanted.slice(0, 3).map((skill, index) => (
                      <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        {skill}
                      </span>
                    ))}
                    {userItem.skillsWanted.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{userItem.skillsWanted.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Availability */}
              {userItem.availability && userItem.availability.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Available:</h4>
                  <div className="flex flex-wrap gap-1">
                    {userItem.availability.map((time, index) => (
                      <span key={index} className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                        {capitalizeFirst(time)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => sendSwapRequest(userItem._id)}
                  disabled={!user || userItem._id === user.id}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {userItem._id === user?.id ? 'Your Profile' : 'Send Request'}
                </button>
                <button
                  onClick={() => handleViewProfile(userItem._id)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium"
                >
                  View Profile
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* No Results */}
      {filteredUsers.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
          <p className="text-gray-600">Try adjusting your search criteria or check back later for new users.</p>
        </div>
      )}

      {/* Swap Request Modal */}
      {showSwapModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Send Swap Request to {selectedUser?.name}
              </h3>
              
              {modalLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Select Skill to Offer */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Skill you want to offer:
                    </label>
                    <select
                      value={selectedOfferedSkill}
                      onChange={(e) => setSelectedOfferedSkill(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a skill you offer...</option>
                      {userSkills.offered?.map((skill, index) => (
                        <option key={index} value={skill}>
                          {skill}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Select Skill to Want */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Skill you want to learn:
                    </label>
                    <select
                      value={selectedWantedSkill}
                      onChange={(e) => setSelectedWantedSkill(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a skill they offer...</option>
                      {targetUserSkills.map((skill, index) => (
                        <option key={index} value={skill}>
                          {skill}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message (optional):
                    </label>
                    <textarea
                      value={swapMessage}
                      onChange={(e) => setSwapMessage(e.target.value)}
                      placeholder="Hi! I would like to explore a skill swap with you."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows="3"
                      maxLength="500"
                    />
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => {
                        setShowSwapModal(false);
                        resetModalState();
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSendSwapRequest}
                      disabled={!selectedOfferedSkill || !selectedWantedSkill || modalLoading}
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      Send Request
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Skills;
