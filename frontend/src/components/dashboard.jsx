import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/dashboard.css';

function Dashboard() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState({});
    const [selectedDate, setSelectedDate] = useState(null);

    useEffect(() => {
        const user_id = localStorage.getItem('user_id');
        const username = localStorage.getItem('username');
        console.log('Dashboard checking user_id:', user_id);
        console.log('Dashboard checking username:', username);
        
        if (!user_id) {
            console.log('No user_id found, redirecting to login');
            navigate('/login');
            return;
        }

    const fetchEvents = async () => {
        // Simulate API response with Outlook-style events
        const mockEvents = {
            [`${currentDate.getFullYear()}`]: [
                {
                    id: 1,
                    title: 'Start of New Year',
                    time: '23:59',
                    duration: 'All day',
                    color: '#4f46e5',
                    type: 'Holiday'
                }
            ],
            [`${currentDate.getFullYear()}-1-1`]: [
                {
                    id: 6,
                    title: 'New Year\'s Day',
                    time: '23:59',
                    duration: 'All day',
                    color: '#4f46e5',
                    type: 'Holiday'
                }
            ],
            [`${currentDate.getFullYear()}-7-4`]: [
                {
                    id: 7,
                    title: 'Independence Day',
                    time: '23:59',
                    duration: 'All day',
                    color: '#4f46e5',
                    type: 'Holiday'
                }
            ],
            [`${currentDate.getFullYear()}-11-27`]: [
                {
                    id: 8,
                    title: 'Thanksgiving',
                    time: '23:59',
                    duration: 'All day',
                    color: '#4f46e5',
                    type: 'Holiday'
                }
            ],
            [`${currentDate.getFullYear()}-12-25`]: [
                {
                    id: 9,
                    title: 'Christmas Day',
                    time: '23:59',
                    duration: 'All day',
                    color: '#4f46e5',
                    type: 'Holiday'
                }
            ],
            // [`${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-15`]: [
            //     {
            //         id: 3,
            //         title: 'Advanced Mathematics Lecture',
            //         time: '10:00',
            //         duration: '1.5h',
            //         color: '#059669',
            //         type: 'lecture'
            //     }
            // ]
        };

        setEvents(mockEvents);
        setLoading(false);
    };

        fetchEvents();
    }, [navigate, currentDate]);

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <div>Loading your calendar...</div>
            </div>
        );
    }

    const username = localStorage.getItem('username');
    const user_id = localStorage.getItem('user_id');

    // Calendar logic
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startingDayOfWeek = firstDayOfMonth.getDay();
    const daysToShow = [];

    // Add empty days for previous month
    for (let i = 0; i < startingDayOfWeek; i++) {
        daysToShow.push(null);
    }

    // Add days of current month
    for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
        daysToShow.push(day);
    }

    // Add empty days to fill grid
    while (daysToShow.length < 42) {
        daysToShow.push(null);
    }

    // Navigation handlers
    const goToPreviousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
        setSelectedDate(null);
    };

    const goToNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
        setSelectedDate(null);
    };

    // Handle day click
    const handleDayClick = (day) => {
        if (day) {
            const dateKey = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${day}`;
            setSelectedDate(dateKey);
        }
    };

    // Check if day is today
    const isToday = (day) => {
        const today = new Date();
        return day &&
            day === today.getDate() &&
            currentDate.getMonth() === today.getMonth() &&
            currentDate.getFullYear() === today.getFullYear();
    };

    // Get events for a day
    const getDayEvents = (day) => {
        if (!day) return [];
        const dateKey = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${day}`;
        return events[dateKey] || [];
    };

    // Format time display
    const formatTime = (timeString) => {
        if (timeString === 'All day') return 'All day';
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        return `${hour}:${minutes}`;
    };

    // Handle logout
    const handleLogout = () => {
        localStorage.removeItem('user_id');
        localStorage.removeItem('username');
        navigate('/login');
    };

    return (
        <div className="dashboard-container">
            {/* Header */}
            <header className="dashboard-header">
                <div className="header-content">
                    <div className="logo-section">
                        <h1>HKUST</h1>
                        <span>Session Calendar</span>
                    </div>
                    <div className="user-section">
                        <div className="user-info">
                            <span className="user-name">Welcome, {username || 'Student'}!</span>
                            <span className="user-role">ID: {user_id}</span>
                        </div>
                        <button 
                            className="logout-btn"
                            onClick={handleLogout}
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="dashboard-main">
                <div className="dashboard-content">
                    {/* Calendar Header */}
                    <div className="calendar-header">
                        <button onClick={goToPreviousMonth} className="nav-btn">
                            ‹ Previous
                        </button>
                        <h2>
                            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </h2>
                        <button onClick={goToNextMonth} className="nav-btn">
                            Next ›
                        </button>
                    </div>
                    {/* Outlook-style Calendar Grid */}
                    <div className="Events-calendar">
                        <div className="calendar-main">
                            {/* Weekday Headers */}
                            <div className="calendar-weekdays">
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                                    <div key={day} className="weekday-header">
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* Calendar Days Grid */}
                            <div className="calendar-days-grid">
                                {daysToShow.map((day, index) => {
                                    const dayEvents = getDayEvents(day);
                                    const isTodayFlag = isToday(day);
                                    const isSelected = selectedDate === `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${day}`;
                                    
                                    return (
                                        <div
                                            key={index}
                                            className={`calendar-day 
                                                ${day ? 'has-date' : 'empty'} 
                                                ${isTodayFlag ? 'today' : ''} 
                                                ${isSelected ? 'selected' : ''}
                                                ${dayEvents.length > 0 ? 'has-events' : ''}`}
                                            onClick={() => handleDayClick(day)}
                                        >
                                            {day && (
                                                <>
                                                    <div className="day-number">
                                                        {day}
                                                        {isTodayFlag && <span className="today-badge">Today</span>}
                                                    </div>
                                                    <div className="day-events">
                                                        {dayEvents.slice(0, 2).map((event, eventIndex) => (
                                                            <div 
                                                                key={eventIndex}
                                                                className="event-preview"
                                                                style={{ borderLeftColor: event.color }}
                                                            >
                                                                <span className="event-time">{formatTime(event.time)}</span>
                                                                <span className="event-title">{event.title}</span>
                                                            </div>
                                                        ))}
                                                        {dayEvents.length > 2 && (
                                                            <div className="more-events">+{dayEvents.length - 2} more</div>
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Events Sidebar */}
                        {selectedDate && (
                            <div className="events-sidebar">
                                <div className="sidebar-header">
                                    <h3>Events for {new Date(selectedDate).toLocaleDateString('en-US', { 
                                        weekday: 'long', 
                                        month: 'long', 
                                        day: 'numeric', 
                                        year: 'numeric' 
                                    })}</h3>
                                    <button 
                                        className="close-btn"
                                        onClick={() => setSelectedDate(null)}
                                    >
                                        ×
                                    </button>
                                </div>
                                <div className="events-list">
                                    {getDayEvents(new Date(selectedDate).getDate()).length > 0 ? (
                                        getDayEvents(new Date(selectedDate).getDate()).map((event) => (
                                            <div key={event.id} className="event-item">
                                                <div 
                                                    className="event-color-bar"
                                                    style={{ backgroundColor: event.color }}
                                                ></div>
                                                <div className="event-details">
                                                    <div className="event-title">{event.title}</div>
                                                    <div className="event-time">
                                                        {formatTime(event.time)} • {event.duration}
                                                    </div>
                                                    <div className="event-type">{event.type}</div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="no-events">No events scheduled</div>
                                    )}
                                </div>
                                <button className="add-event-btn">
                                    + Add Event
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Quick Actions */}
                    <div className="quick-actions">
                        <h3>Quick Actions</h3>
                        <div className="action-buttons">
                            <button className="action-btn">
                                Register Session
                            </button>
                            <button className="action-btn">
                                View Profile
                            </button>
                            <button className="action-btn">
                                My Sessions
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default Dashboard;