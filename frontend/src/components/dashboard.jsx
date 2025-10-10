import { useEffect, useState } from 'react';
import {useNavigate, useLocation} from 'react-router-dom';
import '../styles/dashboard.css';
import { DEFAULT_AVATAR_SVG } from '../constants';

function Dashboard(){
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const [successMessage, setSuccessMessage] = useState('');
    const [userProfile, setUserProfile] = useState(null);
    
    useEffect(() => {
        const user_id = localStorage.getItem('user_id');
        const username = localStorage.getItem('username');
        console.log('Dashboard checking user_id:', user_id);
        console.log('Dashboard checking username:', username);
        
        // Check for success message from profile completion
        if (location.state?.message) {
            setSuccessMessage(location.state.message);
            // Clear the message after 5 seconds
            setTimeout(() => setSuccessMessage(''), 5000);
        }
        
        // Authentication failed
        if (!user_id){
            console.log('No user_id found, redirecting to login');
            navigate('/login');
            return;
        }
        
        // Fetch user profile if available
        fetchUserProfile(username);
        
        console.log('User authenticated, setting loading to false');
        setLoading(false);
    }, [navigate, location.state]);

    const fetchUserProfile = async (email) => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const response = await fetch(`${API_URL}/profile/${email}`);
            
            if (response.ok) {
                const profileData = await response.json();
                setUserProfile(profileData);
            }
        } catch (error) {
            console.log('Could not fetch profile:', error);
            // Don't show error as profile might not exist yet
        }
    };
    if (loading){
        return <div>Loading...</div>
    }
    // Get user info
    const username = localStorage.getItem('username');
    const user_id = localStorage.getItem('user_id');
    
    // Simple calendar - just show current month
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startingDayOfWeek = firstDayOfMonth.getDay();
    
    // Create simple days array
    const daysToShow = [];
    
    // Add empty days for previous month
    for (let i = 0; i < startingDayOfWeek; i++) {
        daysToShow.push(null);
    }
    
    // Add days of current month
    for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
        daysToShow.push(day);
    }
    
    // Add empty days to fill grid (42 total)
    while (daysToShow.length < 42) {
        daysToShow.push(null);
    }
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
                            <span className="user-name">Welcome, {userProfile?.preferred_name || userProfile?.full_english_name || 'Student'}!</span>
                        </div>
                        <div className="header-actions">
                            <button 
                                className="profile-icon-btn"
                                onClick={() => navigate('/profile/view', { state: { email: username } })}
                                title="View Profile"
                            >
                                <img 
                                    src={userProfile?.profile_picture || '/default-avatar.png'} 
                                    alt="Profile" 
                                    className="profile-avatar"
                                    onError={(e) => {
                                        e.target.src = DEFAULT_AVATAR_SVG;
                                    }}
                                />
                            </button>
                            <button 
                                className="logout-btn"
                                onClick={() => {
                                    localStorage.removeItem('user_id');
                                    localStorage.removeItem('username');
                                    navigate('/login');
                                }}
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="dashboard-main">
                <div className="dashboard-content">
                    {/* Success Message */}
                    {successMessage && (
                        <div className="success-message" style={{
                            backgroundColor: '#d4edda',
                            color: '#155724',
                            padding: '12px 20px',
                            borderRadius: '8px',
                            marginBottom: '20px',
                            border: '1px solid #c3e6cb'
                        }}>
                            ✅ {successMessage}
                        </div>
                    )}
                    
                    <h2>Session Registration Calendar</h2>
                    <p>Current Month: {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                    
                    {/* Simple Calendar Grid */}
                    <div className="calendar-grid">
                        {/* Day headers */}
                        <div className="calendar-day-headers">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                                <div key={day} className="day-header">
                                    {day}
                                </div>
                            ))}
                        </div>
                        
                        {/* Calendar days */}
                        <div className="calendar-days">
                            {daysToShow.map((day, index) => (
                                <div key={index} className="calendar-day">
                                    {day}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="quick-actions">
                        <h3>Quick Actions</h3>
                        <div className="action-buttons">
                            <button className="action-btn">
                                📅 Register Session
                            </button>
                            <button className="action-btn">
                                📚 My Sessions
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default Dashboard;