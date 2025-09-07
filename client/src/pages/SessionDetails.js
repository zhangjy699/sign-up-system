import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  User,
  BookOpen,
  ArrowLeft
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

export const SessionDetails = () => {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    fetchSession();
  }, [id]);

  const fetchSession = async () => {
    try {
      const response = await axios.get(`/api/sessions/${id}`);
      setSession(response.data.data);
    } catch (error) {
      console.error('Error fetching session:', error);
      toast.error('Failed to load session details');
    } finally {
      setLoading(false);
    }
  };

  const handleBookSession = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/sessions/${id}` } } });
      return;
    }

    setBookingLoading(true);
    try {
      const response = await axios.post('/api/bookings', {
        sessionId: id,
        studentMessage: 'I would like to book this session.'
      });
      setBooking(response.data.data);
      toast.success('Session booked successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to book session');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Session not found</h1>
          <button onClick={() => navigate('/sessions')} className="btn-primary">
            Back to Sessions
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/sessions')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Sessions
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="card-body">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      {session.title}
                    </h1>
                    <span className="badge badge-primary">
                      {session.category}
                    </span>
                  </div>
                </div>

                {session.description && (
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Description</h2>
                    <p className="text-gray-600 whitespace-pre-wrap">{session.description}</p>
                  </div>
                )}

                {/* Session Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Date</p>
                      <p className="font-medium text-gray-900">{formatDate(session.startTime)}</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <Clock className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Time</p>
                      <p className="font-medium text-gray-900">
                        {formatTime(session.startTime)} - {formatTime(session.endTime)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <MapPin className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <p className="font-medium text-gray-900 flex items-center">
                        {getLocationIcon(session.location)} {session.location}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <Users className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Capacity</p>
                      <p className="font-medium text-gray-900">
                        {session.currentParticipants}/{session.maxParticipants} participants
                      </p>
                    </div>
                  </div>
                </div>

                {session.requirements && (
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Requirements</h2>
                    <p className="text-gray-600 whitespace-pre-wrap">{session.requirements}</p>
                  </div>
                )}

                {session.materials && session.materials.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Materials</h2>
                    <div className="space-y-2">
                      {session.materials.map((material, index) => (
                        <div key={index} className="flex items-center">
                          <BookOpen className="w-4 h-4 text-gray-400 mr-2" />
                          <a
                            href={material.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:text-primary-700"
                          >
                            {material.name}
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Tutor Info */}
            <div className="card mb-6">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-gray-900">Tutor</h2>
              </div>
              <div className="card-body">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mr-4">
                    <User className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {session.tutor.firstName} {session.tutor.lastName}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {session.tutor.program} • Year {session.tutor.yearOfStudy}
                    </p>
                  </div>
                </div>

                {session.tutor.bio && (
                  <p className="text-sm text-gray-600 mb-4">{session.tutor.bio}</p>
                )}

                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-900">Expertise</h4>
                  <div className="flex flex-wrap gap-1">
                    {session.tutor.tutoringCategories?.map((category, index) => (
                      <span key={index} className="badge badge-secondary text-xs">
                        {category}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Booking Section */}
            <div className="card">
              <div className="card-body">
                <div className="text-center">
                  <div className="mb-4">
                    <span className={`badge ${session.isAvailable ? 'badge-success' : 'badge-error'}`}>
                      {session.isAvailable ? 'Available' : 'Full'}
                    </span>
                  </div>

                  {session.isAvailable ? (
                    <button
                      onClick={handleBookSession}
                      disabled={bookingLoading || booking}
                      className="btn-primary w-full btn-lg"
                    >
                      {bookingLoading ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          Booking...
                        </>
                      ) : booking ? (
                        'Booked'
                      ) : (
                        'Book Session'
                      )}
                    </button>
                  ) : (
                    <p className="text-gray-600">This session is full</p>
                  )}

                  {booking && (
                    <div className="mt-4 p-3 bg-success-50 border border-success-200 rounded-lg">
                      <p className="text-sm text-success-800">
                        ✅ Session booked successfully! Check your dashboard for details.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
