import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

const UserProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profileUser, setProfileUser] = useState(null);
  const [userSkills, setUserSkills] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Helper function to capitalize first letter for display
  const capitalizeFirst = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const fetchUserProfile = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/users/${id}`);
      setProfileUser(response.data.user);
      setUserSkills(response.data.skills || []);
      setFeedback(response.data.feedback || []);
      setAvgRating(response.data.avgRating || 0);
    } catch (err) {
      setError('Failed to load user profile');
      console.error('Error fetching user profile:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  const renderStarRating = (rating) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="ml-2 text-sm text-gray-600">({rating}/5)</span>
      </div>
    );
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

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => navigate('/skills')}
            className="mt-2 text-blue-600 hover:text-blue-800"
          >
            ← Back to Skills
          </button>
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">User not found</h2>
          <button
            onClick={() => navigate('/skills')}
            className="text-blue-600 hover:text-blue-800"
          >
            ← Back to Skills
          </button>
        </div>
      </div>
    );
  }

  const offeredSkills = userSkills.filter(skill => skill.type === 'offered');
  const wantedSkills = userSkills.filter(skill => skill.type === 'wanted');

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/skills')}
          className="text-blue-600 hover:text-blue-800 mb-4"
        >
          ← Back to Skills
        </button>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-start space-x-6">
          <div className="flex-shrink-0">
            <img
              src={profileUser.profilePhoto ? `/${profileUser.profilePhoto}` : '/default-avatar.svg'}
              alt={profileUser.name}
              className="w-24 h-24 rounded-full object-cover"
              onError={(e) => {
                e.target.src = '/default-avatar.svg';
              }}
            />
          </div>
          
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{profileUser.name}</h1>
            
            {profileUser.location && (
              <p className="text-gray-600 mb-2">📍 {profileUser.location}</p>
            )}
            
            {avgRating > 0 && (
              <div className="mb-3">
                {renderStarRating(avgRating)}
                <span className="text-sm text-gray-500 ml-2">({feedback.length} reviews)</span>
              </div>
            )}
            
            {profileUser.bio && (
              <p className="text-gray-700 leading-relaxed">{profileUser.bio}</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Skills Section */}
        <div>
          {/* Skills Offered */}
          {offeredSkills.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Skills Offered</h2>
              <div className="space-y-3">
                {offeredSkills.map((userSkill) => (
                  <div key={userSkill._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-900">{userSkill.skill.name}</h3>
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        {userSkill.proficiencyLevel}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{userSkill.skill.category}</p>
                    {userSkill.skill.description && (
                      <p className="text-sm text-gray-700">{userSkill.skill.description}</p>
                    )}
                    {userSkill.notes && (
                      <p className="text-sm text-gray-600 mt-2 italic">{userSkill.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills Wanted */}
          {wantedSkills.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Skills Wanted</h2>
              <div className="space-y-3">
                {wantedSkills.map((userSkill) => (
                  <div key={userSkill._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-900">{userSkill.skill.name}</h3>
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        Seeking {userSkill.proficiencyLevel}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{userSkill.skill.category}</p>
                    {userSkill.skill.description && (
                      <p className="text-sm text-gray-700">{userSkill.skill.description}</p>
                    )}
                    {userSkill.notes && (
                      <p className="text-sm text-gray-600 mt-2 italic">{userSkill.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Feedback Section */}
        <div>
          {feedback.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Feedback</h2>
              <div className="space-y-4">
                {feedback.map((review) => (
                  <div key={review._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <div className="flex items-center space-x-3">
                        <img
                          src={review.reviewer.profilePhoto ? `/${review.reviewer.profilePhoto}` : '/default-avatar.svg'}
                          alt={review.reviewer.name}
                          className="w-8 h-8 rounded-full object-cover"
                          onError={(e) => {
                            e.target.src = '/default-avatar.svg';
                          }}
                        />
                        <span className="font-medium text-gray-900">{review.reviewer.name}</span>
                      </div>
                      <div className="ml-auto">
                        {renderStarRating(review.rating)}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-gray-700 text-sm">{review.comment}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Availability */}
          {profileUser.availability && profileUser.availability.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6 mt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Availability</h2>
              <div className="flex flex-wrap gap-2">
                {profileUser.availability.map((time, index) => (
                  <span key={index} className="bg-yellow-100 text-yellow-800 text-sm px-3 py-1 rounded-full">
                    {capitalizeFirst(time)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
