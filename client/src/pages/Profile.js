import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    location: '',
    bio: '',
    profileVisibility: 'public',
    availability: [],
    skillsOffered: [],
    skillsWanted: []
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [newSkillOffered, setNewSkillOffered] = useState('');
  const [newSkillWanted, setNewSkillWanted] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('');

  // Available avatars
  const availableAvatars = [
    'avatar-1.png',
    'avatar-2.png', 
    'avatar-3.png',
    'avatar-4.png',
    'avatar-5.png',
    'avatar-6.png'
  ];

  // Helper function to capitalize first letter for display
  const capitalizeFirst = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const availabilityOptions = [
    'weekdays',
    'weekends', 
    'mornings',
    'evenings',
    'flexible'
  ];

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        location: user.location || '',
        bio: user.bio || '',
        profileVisibility: user.profileVisibility || 'public',
        availability: user.availability || [],
        skillsOffered: user.skillsOffered || [],
        skillsWanted: user.skillsWanted || []
      });
      setSelectedAvatar(user.profilePhoto || 'avatar-1.png');
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvailabilityChange = (option) => {
    setFormData(prev => ({
      ...prev,
      availability: prev.availability.includes(option)
        ? prev.availability.filter(item => item !== option)
        : [...prev.availability, option]
    }));
  };

  const addSkillOffered = () => {
    if (newSkillOffered.trim() && !formData.skillsOffered.includes(newSkillOffered.trim())) {
      setFormData(prev => ({
        ...prev,
        skillsOffered: [...prev.skillsOffered, newSkillOffered.trim()]
      }));
      setNewSkillOffered('');
    }
  };

  const removeSkillOffered = (skill) => {
    setFormData(prev => ({
      ...prev,
      skillsOffered: prev.skillsOffered.filter(s => s !== skill)
    }));
  };

  const addSkillWanted = () => {
    if (newSkillWanted.trim() && !formData.skillsWanted.includes(newSkillWanted.trim())) {
      setFormData(prev => ({
        ...prev,
        skillsWanted: [...prev.skillsWanted, newSkillWanted.trim()]
      }));
      setNewSkillWanted('');
    }
  };

  const removeSkillWanted = (skill) => {
    setFormData(prev => ({
      ...prev,
      skillsWanted: prev.skillsWanted.filter(s => s !== skill)
    }));
  };

  const handleAvatarSelection = async (avatarName) => {
    setSelectedAvatar(avatarName);
    setMessage({ type: '', text: '' });

    try {
      const response = await api.put('/users/profile', {
        ...formData,
        profilePhoto: avatarName
      });
      updateUser(response.data.user);
      setMessage({ type: 'success', text: 'Avatar updated successfully!' });
    } catch (error) {
      console.error('Avatar update error:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to update avatar' 
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    console.log('Submitting form data:', formData);

    try {
      const response = await api.put('/users/profile', formData);
      console.log('Profile update response:', response.data);
      updateUser(response.data.user);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      console.error('Profile update error:', error);
      console.error('Error response:', error.response?.data);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to update profile' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">My Profile</h1>
        <p className="text-gray-600">Manage your profile information and skills</p>
      </div>

      {message.text && (
        <div className={`mb-6 p-4 rounded-md ${
          message.type === 'success' 
            ? 'bg-green-100 border border-green-400 text-green-700'
            : 'bg-red-100 border border-red-400 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h2>
          
          {/* Profile Photo Section */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Choose Your Avatar
            </label>
            
            {/* Current Selected Avatar */}
            <div className="flex items-center space-x-6 mb-6">
              <div className="flex-shrink-0">
                <img
                  src={`/${selectedAvatar}`}
                  alt="Selected Avatar"
                  className="w-20 h-20 rounded-full object-cover border-4 border-blue-500"
                />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Current Avatar</h3>
                <p className="text-sm text-gray-600">Click on any avatar below to change</p>
              </div>
            </div>
            
            {/* Avatar Selection Grid */}
            <div className="grid grid-cols-6 gap-4">
              {availableAvatars.map((avatar) => (
                <button
                  key={avatar}
                  type="button"
                  onClick={() => handleAvatarSelection(avatar)}
                  className={`relative p-2 rounded-lg border-2 transition-all hover:border-blue-400 ${
                    selectedAvatar === avatar 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <img
                    src={`/${avatar}`}
                    alt={`Avatar ${avatar.split('-')[1].split('.')[0]}`}
                    className="w-16 h-16 rounded-full object-cover mx-auto"
                  />
                  {selectedAvatar === avatar && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="City, Country"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profile Visibility
              </label>
              <select
                name="profileVisibility"
                value={formData.profileVisibility}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="public">Public - Anyone can see my profile</option>
                <option value="private">Private - Only I can see my profile</option>
              </select>
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bio
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              rows={4}
              placeholder="Tell others about yourself, your interests, and what you're passionate about..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Availability */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Availability</h2>
          <p className="text-gray-600 mb-4">When are you typically available for skill swaps?</p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {availabilityOptions.map(option => (
              <label key={option} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.availability.includes(option)}
                  onChange={() => handleAvailabilityChange(option)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">{capitalizeFirst(option)}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Skills Offered */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Skills I Can Offer</h2>
          
          <div className="mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newSkillOffered}
                onChange={(e) => setNewSkillOffered(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkillOffered())}
                placeholder="e.g., JavaScript, Graphic Design, Photography..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={addSkillOffered}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 font-medium"
              >
                Add Skill
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {formData.skillsOffered.map((skill, index) => (
              <span
                key={index}
                className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => removeSkillOffered(skill)}
                  className="text-green-600 hover:text-green-800 font-bold"
                >
                  ×
                </button>
              </span>
            ))}
            {formData.skillsOffered.length === 0 && (
              <p className="text-gray-500 text-sm">No skills added yet. Add some skills you can teach others!</p>
            )}
          </div>
        </div>

        {/* Skills Wanted */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Skills I Want to Learn</h2>
          
          <div className="mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newSkillWanted}
                onChange={(e) => setNewSkillWanted(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkillWanted())}
                placeholder="e.g., Python, Public Speaking, Guitar..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={addSkillWanted}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium"
              >
                Add Skill
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {formData.skillsWanted.map((skill, index) => (
              <span
                key={index}
                className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => removeSkillWanted(skill)}
                  className="text-blue-600 hover:text-blue-800 font-bold"
                >
                  ×
                </button>
              </span>
            ))}
            {formData.skillsWanted.length === 0 && (
              <p className="text-gray-500 text-sm">No skills added yet. Add some skills you'd like to learn!</p>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-8 py-3 rounded-md hover:bg-blue-700 disabled:bg-blue-400 font-medium text-lg"
          >
            {loading ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Profile;
