import React, { useState, useEffect } from 'react';
import '../styles/MySessions.css';
import { useAuth } from '../contexts/authcontext.jsx';

function SessionsPage() {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const { user } = useAuth();

    useEffect(() => {
        if (user?.email) {
            fetchMySessions();
        }
    }, [user]);

    const fetchMySessions = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch(`http://localhost:8000/my-sessions/${encodeURIComponent(user.email)}`);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch sessions: ${response.status}`);
            }
            
            const data = await response.json();
            setSessions(data.registrations || []);
            
        } catch (err) {
            setError(err.message);
            console.error('Error fetching sessions:', err);
        } finally {
            setLoading(false);
        }
    };

    // in case not logged in
    if (!user) {
        return (
            <div className="sessions-page">
                <div className="loading-state">
                    <p>Please log in to view your sessions</p>
                </div>
            </div>
        );
    }

    // in case no email
    if (!user.email) {
        return (
            <div className="sessions-page">
                <div className="error-state">
                    <h2>Email Required</h2>
                    <p>Your account email is not available. Please contact support.</p>
                    <p>Username: {user.username}</p>
                </div>
            </div>
        );
    }

    // Format date from "2025/10/15" to "October 15, 2025"
    const formatDate = (dateString) => {
        try {
            const date = new Date(dateString.replace(/\//g, '-'));
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            return dateString; // Return original if formatting fails
        }
    };

    // Format time slot from "14:30-15:30" to "2:30 PM - 3:30 PM"
    const formatTimeSlot = (timeSlot) => {
        try {
            const [start, end] = timeSlot.split('-');
            const formatTime = (time) => {
                const [hours, minutes] = time.split(':');
                const hour = parseInt(hours);
                const ampm = hour >= 12 ? 'PM' : 'AM';
                const displayHour = hour % 12 || 12;
                return `${displayHour}:${minutes} ${ampm}`;
            };
            return `${formatTime(start)} - ${formatTime(end)}`;
        } catch (error) {
            return timeSlot; // Return original if formatting fails
        }
    };

    // Handle session cancellation
    const handleCancelRegistration = async (registrationId) => {
        if (window.confirm('Are you sure you want to cancel this registration?')) {
            try {
                // TODO: Implement cancel registration API call
                console.log('Cancelling registration:', registrationId);
                // After successful cancellation, refetch sessions
                await fetchMySessions();
            } catch (err) {
                console.error('Error cancelling registration:', err);
                alert('Failed to cancel registration. Please try again.');
            }
        }
    };

    if (loading) {
        return (
            <div className="sessions-page">
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading your sessions...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="sessions-page">
                <div className="error-state">
                    <h2>Error Loading Sessions</h2>
                    <p>{error}</p>
                    <button onClick={fetchMySessions} className="btn-primary">
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="sessions-page">
            <div className="sessions-header">
                <h1>My Sessions</h1>
                <p>
                    {sessions.length === 0 
                        ? "You haven't registered for any sessions yet."
                        : `You have ${sessions.length} registered session${sessions.length !== 1 ? 's' : ''}`
                    }
                </p>
            </div>
            
            {sessions.length === 0 ? (
                <div className="empty-state">
                    <h3>No sessions found</h3>
                    <p>Register for a session to see it here!</p>
                    <button className="btn-primary" onClick={() => window.history.back()}>
                        Browse Available Sessions
                    </button>
                </div>
            ) : (
                <div className="sessions-list">
                    {sessions.map(registration => (
                        <div key={registration.registration_id} className="session-card">
                            <div className="session-main-info">
                                <div className="session-tutor">
                                    <h3>Tutor: {registration.session_details.tutor_name}</h3>
                                    <span className="student-email">Your Email: {registration.student_email}</span>
                                </div>
                                
                                <div className="session-details">
                                    <h4>{registration.session_details.session_type}</h4>
                                    <p className="session-description">
                                        {registration.session_details.description}
                                    </p>
                                    
                                    <div className="session-meta">
                                        <div className="meta-item">
                                            <span className="label">Date:</span>
                                            <span className="value">
                                                {formatDate(registration.session_details.date)}
                                            </span>
                                        </div>
                                        <div className="meta-item">
                                            <span className="label">Time:</span>
                                            <span className="value">
                                                {formatTimeSlot(registration.session_details.time_slot)}
                                            </span>
                                        </div>
                                        <div className="meta-item">
                                            <span className="label">Location:</span>
                                            <span className="value">
                                                {registration.session_details.location}
                                            </span>
                                        </div>
                                        <div className="meta-item">
                                            <span className="label">Registered On:</span>
                                            <span className="value">
                                                {new Date(registration.registration_time).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="session-status-actions">
                                <div className="status-section">
                                    <span className="status active">
                                        {registration.status}
                                    </span>
                                    <span className="registration-status registered">
                                        ✓ Registered
                                    </span>
                                </div>
                                
                                <div className="session-actions">
                                    <button className="btn-primary">View Details</button>
                                    <button 
                                        className="btn-secondary"
                                        onClick={() => handleCancelRegistration(registration.registration_id)}
                                    >
                                        Cancel Registration
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default SessionsPage;