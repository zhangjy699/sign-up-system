import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/tutorCalendar.css';
import '../styles/registerSession.css';

function RegisterSession() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [currentWeek, setCurrentWeek] = useState(new Date());
    const [sessionTypes, setSessionTypes] = useState([]);
    const [selectedSessionType, setSelectedSessionType] = useState('');
    const [availableSlots, setAvailableSlots] = useState([]);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [registering, setRegistering] = useState(false);

    // Color palette for sessions (same as TutorCalendar for consistency)
    const sessionColors = [
        '#4CAF50', '#2196F3', '#FF9800', '#9C27B0', 
        '#F44336', '#00BCD4', '#FFEB3B', '#795548',
        '#607D8B', '#E91E63', '#3F51B5', '#009688'
    ];

    // Function to get consistent color for session type
    const getSessionColor = (sessionType) => {
        const hash = sessionType.split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
        }, 0);
        return sessionColors[Math.abs(hash) % sessionColors.length];
    };

    // Function to get short display name for session type
    const getSessionDisplayName = (sessionType) => {
        const typeMap = {
            'Course Tutoring': 'TUTORING',
            'Case Competition Preparation': 'CASE',
            'Profile Coaching Sessions': 'COACHING',
            'Market News sharing': 'NEWS',
            'FINA free chat': 'CHAT',
            'Course selection': 'COURSE',
            'Books sharing': 'BOOKS',
            'Internship sharing': 'INTERN'
        };
        return typeMap[sessionType] || sessionType.split(' ')[0].toUpperCase();
    };

    // Time slots from 9 AM to 11 PM
    const timeSlots = [
        '09:00-10:00', '10:00-11:00', '11:00-12:00', '12:00-13:00',
        '13:00-14:00', '14:00-15:00', '15:00-16:00', '16:00-17:00',
        '17:00-18:00', '18:00-19:00', '19:00-20:00', '20:00-21:00',
        '21:00-22:00', '22:00-23:00'
    ];

    useEffect(() => {
        const user_id = localStorage.getItem('user_id');
        
        if (!user_id) {
            navigate('/login');
            return;
        }
        
        fetchSessionTypes();
        setLoading(false);
    }, [navigate]);

    // Fetch available slots whenever session type or week changes
    useEffect(() => {
        if (selectedSessionType) {
            fetchAvailableSlots();
        }
    }, [selectedSessionType, currentWeek]);

    const fetchSessionTypes = async () => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const response = await fetch(`${API_URL}/session-types`);
            const data = await response.json();
            setSessionTypes(data.session_types);
        } catch (error) {
            console.error('Error fetching session types:', error);
        }
    };

    const fetchAvailableSlots = async () => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const response = await fetch(
                `${API_URL}/student/calendar?session_type=${encodeURIComponent(selectedSessionType)}`
            );
            
            if (response.ok) {
                const data = await response.json();
                setAvailableSlots(data.calendar_slots || []);
            } else {
                setAvailableSlots([]);
            }
        } catch (error) {
            console.error('Error fetching available slots:', error);
            setAvailableSlots([]);
        }
    };

    // Get week dates
    const getWeekDates = (date) => {
        const week = [];
        const startDate = new Date(date);
        const day = startDate.getDay();
        const diff = startDate.getDate() - day;
        
        for (let i = 0; i < 7; i++) {
            const weekDate = new Date(startDate.setDate(diff + i));
            week.push(new Date(weekDate));
        }
        return week;
    };

    const weekDates = getWeekDates(currentWeek);

    const navigateWeek = (direction) => {
        const newDate = new Date(currentWeek);
        newDate.setDate(newDate.getDate() + (direction * 7));
        setCurrentWeek(newDate);
    };

    const formatDate = (date) => {
        return date.toISOString().split('T')[0];
    };

    const getMonthYear = (date) => {
        return date.toLocaleDateString('en-US', { 
            month: 'short',
            year: 'numeric'
        });
    };

    // Check if a date is in the past
    const isPastDate = (date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);
        return checkDate < today;
    };

    // Get available tutors for a specific date and time slot
    const getAvailableTutors = (date, timeSlot) => {
        const dateStr = formatDate(date);
        const slot = availableSlots.find(
            s => s.date === dateStr && s.time_slot === timeSlot && s.session_type === selectedSessionType
        );
        return slot ? slot.available_tutors : [];
    };

    // Handle slot click - show tutors modal
    const handleSlotClick = (date, timeSlot, tutors) => {
        if (tutors.length === 0 || isPastDate(date)) {
            return;
        }

        setSelectedSlot({
            date: formatDate(date),
            timeSlot: timeSlot,
            tutors: tutors
        });
        setShowConfirmModal(true);
    };

    // Handle registration
    const handleRegister = async (tutor) => {
        setRegistering(true);
        
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const userEmail = localStorage.getItem('username');
            
            const response = await fetch(`${API_URL}/student/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    student_email: userEmail,
                    availability_id: tutor.id
                })
            });

            if (response.ok) {
                alert('Successfully registered for the session!');
                setShowConfirmModal(false);
                setSelectedSlot(null);
                // Refresh available slots
                fetchAvailableSlots();
            } else {
                const errorData = await response.json();
                alert(`Registration failed: ${errorData.detail}`);
            }
        } catch (error) {
            console.error('Error registering for session:', error);
            alert('Error registering for session. Please try again.');
        } finally {
            setRegistering(false);
        }
    };

    if (loading) {
        return <div className="loading-spinner">Loading...</div>;
    }

    const username = localStorage.getItem('username');

    return (
        <div className="dashboard-container register-session-page">
            <header className="dashboard-header">
                <div className="header-content">
                    <div className="logo-section">
                        <h1>HKUST FINA Department</h1>
                        <span>Session Registration</span>
                    </div>
                    <div className="user-section">
                        <div className="user-info">
                            <span className="user-name">Welcome, {username || 'Student'}!</span>
                            <span className="user-role">Book a mentor session</span>
                        </div>
                        <button 
                            className="logout-btn"
                            onClick={() => navigate('/dashboard')}
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            </header>

            <main className="dashboard-main">
                <div className="dashboard-content">
                    <div className="calendar-header">
                        <div className="left-controls">
                            <div className="session-type-filter">
                                <label htmlFor="session-type">Session Type</label>
                                <select 
                                    id="session-type"
                                    value={selectedSessionType}
                                    onChange={(e) => setSelectedSessionType(e.target.value)}
                                >
                                    <option value="">Choose a session type</option>
                                    {sessionTypes.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="calendar-nav">
                                <button 
                                    className="calendar-nav-btn"
                                    onClick={() => navigateWeek(-1)}
                                >
                                    ←
                                </button>
                                <button 
                                    className="today-btn"
                                    onClick={() => setCurrentWeek(new Date())}
                                >
                                    This Week
                                </button>
                                <button 
                                    className="calendar-nav-btn"
                                    onClick={() => navigateWeek(1)}
                                >
                                    →
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="instructions">
                        <p>Select the session type you’re interested in to explore available times.</p>
                        <p>Colored slots show the tutors who are still available. Click a slot to review tutor details and confirm your booking.</p>
                    </div>

                    {selectedSessionType ? (
                        <>
                            {availableSlots.length === 0 && (
                                <div className="register-empty-state">
                                    <h3>No open slots right now</h3>
                                    <p>We’re adding more sessions soon. Try another type or check back later.</p>
                                </div>
                            )}
                            <div className="weekly-calendar">
                                <div className="calendar-month-indicator">
                                    {getMonthYear(currentWeek)}
                                </div>
                                
                                <div className="calendar-grid">
                                    <div className="time-column">
                                        <div className="time-header">Time</div>
                                        {timeSlots.map(timeSlot => (
                                            <div key={timeSlot} className="time-slot-label">
                                                {timeSlot}
                                            </div>
                                        ))}
                                    </div>
                                    
                                    {weekDates.map((date, dayIndex) => (
                                        <div key={dayIndex} className="day-column">
                                            <div className="day-header">
                                                <div className="day-name">
                                                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                                                </div>
                                                <div className="day-date">
                                                    {date.getDate()}
                                                </div>
                                            </div>
                                            
                                            {timeSlots.map(timeSlot => {
                                                const tutors = getAvailableTutors(date, timeSlot);
                                                const hasTutors = tutors.length > 0;
                                                const isPast = isPastDate(date);
                                                
                                                return (
                                                    <div 
                                                        key={`${dayIndex}-${timeSlot}`}
                                                        className={`time-slot ${hasTutors ? 'available' : ''} ${isPast ? 'past-date' : ''}`}
                                                        onClick={() => handleSlotClick(date, timeSlot, tutors)}
                                                        style={{ cursor: hasTutors && !isPast ? 'pointer' : 'default' }}
                                                    >
                                                        {hasTutors && !isPast ? (
                                                            <div 
                                                                className="available-slot-card"
                                                                style={{ 
                                                                    backgroundColor: getSessionColor(selectedSessionType),
                                                                    opacity: Math.min(0.55 + (tutors.length * 0.12), 1)
                                                                }}
                                                            >
                                                                <div className="slot-time">{timeSlot.split('-')[0]}</div>
                                                                <div className="slot-count">{tutors.length} tutor{tutors.length > 1 ? 's' : ''}</div>
                                                            </div>
                                                        ) : (
                                                            <div className="empty-slot"></div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="register-empty-state">
                            <h3>Select a session type to begin</h3>
                            <p>Use the filter above to choose the coaching or sharing session you want to join.</p>
                        </div>
                    )}
                </div>
            </main>

            {showConfirmModal && selectedSlot && (
                <div className="modal-overlay">
                    <div className="modal-content tutor-selection-modal">
                        <h3>Available Tutors</h3>
                        <div className="modal-info">
                            <p><strong>Date:</strong> {selectedSlot.date}</p>
                            <p><strong>Time:</strong> {selectedSlot.timeSlot}</p>
                            <p><strong>Session Type:</strong> {selectedSessionType}</p>
                        </div>
                        
                        <div className="tutors-list">
                            <p className="select-instruction">Select a tutor to register:</p>
                            {selectedSlot.tutors.map(tutor => (
                                <div key={tutor.id} className="tutor-card">
                                    <div className="tutor-info">
                                        <h4>{tutor.tutor_name}</h4>
                                        <p className="tutor-location">📍 {tutor.location}</p>
                                        {tutor.description && (
                                            <p className="tutor-description">📝 {tutor.description}</p>
                                        )}
                                    </div>
                                    <button 
                                        className="register-btn"
                                        onClick={() => handleRegister(tutor)}
                                        disabled={registering}
                                    >
                                        {registering ? 'Registering...' : 'Register'}
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="modal-actions">
                            <button 
                                type="button" 
                                className="cancel-btn"
                                onClick={() => {
                                    setShowConfirmModal(false);
                                    setSelectedSlot(null);
                                }}
                                disabled={registering}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default RegisterSession;

