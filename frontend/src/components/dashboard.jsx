import { useEffect, useState } from 'react';
import {useNavigate} from 'react-router-dom';
import '../styles/dashboard.css';

function Dashboard(){
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [profilePicture, setProfilePicture] = useState(null);
    const [profileLoading, setProfileLoading] = useState(true);
    useEffect(() => {
        const user_id = localStorage.getItem('user_id');
        const username = localStorage.getItem('username');
        console.log('Dashboard checking user_id:', user_id);
        console.log('Dashboard checking username:', username);
        // Authentication failed
        if (!user_id){
            console.log('No user_id found, redirecting to login');
            navigate('/login');
            return;
        }
        console.log('User authenticated, setting loading to false');
        setLoading(false);
        
        // Fetch user profile to get profile picture
        fetchUserProfile();
    }, [navigate]);

    const fetchUserProfile = async () => {
        try {
            const userEmail = localStorage.getItem('user_email');
            if (!userEmail) {
                setProfileLoading(false);
                return;
            }

            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const response = await fetch(`${API_URL}/profile/${encodeURIComponent(userEmail)}`);
            
            if (response.ok) {
                const profileData = await response.json();
                if (profileData.profile_picture) {
                    setProfilePicture(profileData.profile_picture);
                }
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setProfileLoading(false);
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

    // FOR MY SESSIONS BUTTON
    const handleMySessionsClick = () => {
        navigate('/sessions'); // Redirect to sessions page
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
                            <button 
                                className="profile-icon-btn"
                                onClick={() => navigate('/profile')}
                                title="Update Profile"
                            >
                                {profileLoading ? (
                                    <i className="fas fa-spinner fa-spin"></i>
                                ) : profilePicture ? (
                                    <img 
                                        src={profilePicture} 
                                        alt="Profile" 
                                        className="profile-picture-small"
                                    />
                                ) : (
                                    <i className="fas fa-user-circle"></i>
                                )}
                            </button>
                        </div>
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
            </header>

            {/* Main Content */}
            <main className="dashboard-main">
                <div className="dashboard-content">
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
                            <button className="action-btn" onClick={() => navigate('/tutor-calendar')}>
                                ➕ Create Sessions
                            </button>
                            <button className="action-btn">
                                📅 Register Session
                            </button>
                            <button className="action-btn">
                                👤 View Profile
                            </button>
                            <button className="action-btn" onClick={handleMySessionsClick}>
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