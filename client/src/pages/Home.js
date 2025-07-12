import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Search, Users, BookOpen, MessageCircle, Star, ArrowRight } from 'lucide-react';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const Home = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Helper function to capitalize first letter for display
  const capitalizeFirst = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users?limit=6');
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/skills?search=${encodeURIComponent(searchTerm)}`);
    }
  };

  const stats = [
    { icon: Users, label: 'Active Users', value: '500+' },
    { icon: BookOpen, label: 'Skills Available', value: '1000+' },
    { icon: MessageCircle, label: 'Successful Swaps', value: '200+' },
    { icon: Star, label: 'Average Rating', value: '4.8' }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Exchange Skills, <span className="text-yellow-300">Grow Together</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
            Connect with skilled individuals in your community. Share your expertise and learn something new.
          </p>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="What skill are you looking for?"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 text-lg text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-yellow-400 text-gray-900 px-6 py-2 rounded-lg hover:bg-yellow-500 transition-colors font-semibold"
              >
                Search
              </button>
            </div>
          </form>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <Link to="/skills" className="btn-primary bg-yellow-400 text-gray-900 hover:bg-yellow-500 text-lg px-8 py-3">
                Browse Skills
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn-primary bg-yellow-400 text-gray-900 hover:bg-yellow-500 text-lg px-8 py-3">
                  Get Started
                </Link>
                <Link to="/login" className="btn-outline border-white text-white hover:bg-white hover:text-gray-900 text-lg px-8 py-3">
                  Login
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                  <stat.icon className="w-8 h-8 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Users */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Meet Our Community</h2>
            <p className="text-xl text-gray-600">Discover skilled individuals ready to share their expertise</p>
          </div>

          {loading ? (
            <LoadingSpinner message="Loading community members..." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {users.map((user) => (
                <div key={user._id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center mb-4">
                    <img
                      src={user.profilePhoto ? `/${user.profilePhoto}` : '/default-avatar.svg'}
                      alt={user.name}
                      className="w-16 h-16 rounded-full object-cover mr-4"
                      onError={(e) => {
                        e.target.src = '/default-avatar.svg';
                      }}
                    />
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{user.name}</h3>
                      {user.location && (
                        <p className="text-gray-600">{user.location}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {user.availability?.map((time, index) => (
                        <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          {capitalizeFirst(time)}
                        </span>
                      ))}
                    </div>
                  </div>

                  <Link
                    to={`/user/${user._id}`}
                    className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View Profile
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link to="/skills" className="btn-primary">
              View All Members
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Simple steps to start your skill exchange journey</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Create Your Profile</h3>
              <p className="text-gray-600">List your skills and what you'd like to learn. Upload a photo and set your availability.</p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <span className="text-2xl font-bold text-blue-600">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Find & Connect</h3>
              <p className="text-gray-600">Browse skills, find people who have what you need, and send swap requests.</p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <span className="text-2xl font-bold text-blue-600">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Learn & Share</h3>
              <p className="text-gray-600">Meet up, exchange skills, and leave feedback for a stronger community.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!isAuthenticated && (
        <section className="py-16 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Start Learning?</h2>
            <p className="text-xl mb-8">Join thousands of learners and teachers in our community</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register" className="btn-primary bg-yellow-400 text-gray-900 hover:bg-yellow-500 text-lg px-8 py-3">
                Sign Up Now
              </Link>
              <Link to="/skills" className="btn-outline border-white text-white hover:bg-white hover:text-gray-900 text-lg px-8 py-3">
                Browse Skills
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
