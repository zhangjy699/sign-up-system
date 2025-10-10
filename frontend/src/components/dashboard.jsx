import { useEffect, useState } from 'react';
import {useNavigate} from 'react-router-dom';
import '../styles/dashboard.css';

function Dashboard(){
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
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
    }, [navigate]);
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

    // Get current time info
    const getGreeting = () => {
        const hour = currentDate.getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 17) return "Good Afternoon";
        return "Good Evening";
    };

    const formatDate = () => {
        return currentDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    return (
        <div className="dashboard-container">
            {/* Top Section with Gradient */}
            <div className="dashboard-hero">
                <div className="hero-header">
                    <span className="date-display">{formatDate()}</span>
                    <button 
                        className="settings-btn"
                        onClick={() => {
                            localStorage.removeItem('user_id');
                            localStorage.removeItem('username');
                            navigate('/login');
                        }}
                    >
                        ⚙️
                    </button>
                </div>
                
                <div className="hero-content">
                    <h1 className="greeting">Hi there,</h1>
                    <h3 className="motivation">Believe in Yourself!</h3>
                </div>
            </div>

            {/* Main Content */}
            <div className="dashboard-main">
                {/* Quick Actions Grid */}
                <div className="action-grid">
                    <button className="action-card" onClick={() => navigate('/tutor-calendar')}>
                        <div className="card-icon">➕</div>
                        <span className="card-title">Create Sessions</span>
                    </button>
                    
                    <button className="action-card">
                        <div className="card-icon">📅</div>
                        <span className="card-title">Register Session</span>
                    </button>
                    
                    <button className="action-card" onClick={handleMySessionsClick}>
                        <div className="card-icon">📚</div>
                        <span className="card-title">My Sessions</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;