import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Filter,
  Search,
  BookOpen
} from 'lucide-react';
import axios from 'axios';

export const Sessions = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    program: '',
    date: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const categories = [
    'Course Tutoring',
    'Case Competition Preparation',
    'Profile Coaching Sessions',
    'Market News Sharing',
    'FINA Free Chat',
    'Course Selection',
    'Books Sharing',
    'Internship Sharing',
    'Other'
  ];

  useEffect(() => {
    fetchSessions();
  }, [filters, page]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters.category) params.append('category', filters.category);
      if (filters.program) params.append('program', filters.program);
      if (filters.date) params.append('date', filters.date);
      params.append('page', page);
      params.append('limit', 12);

      const response = await axios.get(`/api/sessions?${params}`);
      setSessions(response.data.data);
      setTotalPages(response.data.pages);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setPage(1);
  };

  const filteredSessions = sessions.filter(session =>
    session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.tutor.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.tutor.lastName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getLocationIcon = (location) => {
    switch (location) {
      case 'Online':
        return '🌐';
      case 'On-campus':
        return '🏫';
      case 'Off-campus':
        return '📍';
      default:
        return '📍';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Available Sessions</h1>
          <p className="text-gray-600 mt-2">
            Find and book tutoring sessions with experienced students.
          </p>
        </div>

        {/* Filters */}
        <div className="card p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search sessions, tutors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="lg:w-64">
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="input"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Program Filter */}
            <div className="lg:w-48">
              <select
                value={filters.program}
                onChange={(e) => handleFilterChange('program', e.target.value)}
                className="input"
              >
                <option value="">All Programs</option>
                <option value="FINA">FINA</option>
                <option value="QFIN">QFIN</option>
              </select>
            </div>

            {/* Date Filter */}
            <div className="lg:w-48">
              <input
                type="date"
                value={filters.date}
                onChange={(e) => handleFilterChange('date', e.target.value)}
                className="input"
              />
            </div>
          </div>
        </div>

        {/* Sessions Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredSessions.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {filteredSessions.map((session) => (
                <div key={session._id} className="card hover:shadow-lg transition-shadow">
                  <div className="card-body">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                        {session.title}
                      </h3>
                      <span className="badge badge-primary text-xs">
                        {session.category}
                      </span>
                    </div>

                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <BookOpen className="w-4 h-4 mr-1" />
                      <span>
                        {session.tutor.firstName} {session.tutor.lastName}
                      </span>
                    </div>

                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <Calendar className="w-4 h-4 mr-1" />
                      <span>{formatDate(session.startTime)}</span>
                    </div>

                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <Clock className="w-4 h-4 mr-1" />
                      <span>
                        {formatTime(session.startTime)} - {formatTime(session.endTime)}
                      </span>
                    </div>

                    <div className="flex items-center text-sm text-gray-600 mb-4">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span className="flex items-center">
                        {getLocationIcon(session.location)} {session.location}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="w-4 h-4 mr-1" />
                        <span>
                          {session.currentParticipants}/{session.maxParticipants} participants
                        </span>
                      </div>
                      <span className="badge badge-success">
                        {session.isAvailable ? 'Available' : 'Full'}
                      </span>
                    </div>

                    {session.description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {session.description}
                      </p>
                    )}

                    <Link
                      to={`/sessions/${session._id}`}
                      className="btn-primary w-full"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center">
                <nav className="flex space-x-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="btn-secondary btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`btn-sm ${
                        pageNum === page ? 'btn-primary' : 'btn-secondary'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                    className="btn-secondary btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your filters or check back later for new sessions.
            </p>
            <button
              onClick={() => {
                setFilters({ category: '', program: '', date: '' });
                setSearchTerm('');
                setPage(1);
              }}
              className="btn-primary"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
