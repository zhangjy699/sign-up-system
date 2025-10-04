import React from 'react';
import '../styles/MySessions.css'; // for styling

function SessionsPage() {
    // Updated mock data matching your backend structure
    const mockSessions = [
        { 
            id: 1, 
            tutor_email: "alex@example.com",
            tutor_name: "Alex Johnson", 
            session_type: "React Fundamentals", 
            date: "2025/10/15", 
            time_slot: "14:30-15:30",
            location: "Online",
            description: "Learn the basics of React components and state management",
            is_registered: true,
            registered_student: "student123",
            status: "active",
            created_at: "2025-09-28T18:02:12.704+00:00",
            updated_at: "2025-09-28T18:02:12.704+00:00"
        },
        { 
            id: 2, 
            tutor_email: "sarah@example.com",
            tutor_name: "Sarah Chen", 
            session_type: "Advanced JavaScript", 
            date: "2025/10/20", 
            time_slot: "16:00-17:00",
            location: "Library Room 301",
            description: "Deep dive into closures, promises, and async/await",
            is_registered: true,
            registered_student: "student456",
            status: "active",
            created_at: "2025-09-29T10:15:22.704+00:00",
            updated_at: "2025-09-29T10:15:22.704+00:00"
        },
        { 
            id: 3, 
            tutor_email: "mike@example.com",
            tutor_name: "Mike Rodriguez", 
            session_type: "Node.js Workshop", 
            date: "2025/10/25", 
            time_slot: "11:00-12:30",
            location: "Computer Lab B",
            description: "Hands-on workshop building REST APIs with Node.js",
            is_registered: false,
            registered_student: "",
            status: "active",
            created_at: "2025-09-30T14:45:33.704+00:00",
            updated_at: "2025-09-30T14:45:33.704+00:00"
        },
        { 
            id: 4, 
            tutor_email: "emma@example.com",
            tutor_name: "Emma Wilson", 
            session_type: "Database Design", 
            date: "2025/10/10", 
            time_slot: "13:00-14:00",
            location: "Online",
            description: "Learn how to design efficient database schemas",
            is_registered: true,
            registered_student: "student789",
            status: "completed",
            created_at: "2025-09-27T09:30:45.704+00:00",
            updated_at: "2025-09-27T09:30:45.704+00:00"
        }
    ];

    // Format date from "2025/10/15" to "October 15, 2025"
    const formatDate = (dateString) => {
        const date = new Date(dateString.replace(/\//g, '-'));
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Format time slot from "14:30-15:30" to "2:30 PM - 3:30 PM"
    const formatTimeSlot = (timeSlot) => {
        const [start, end] = timeSlot.split('-');
        const formatTime = (time) => {
            const [hours, minutes] = time.split(':');
            const hour = parseInt(hours);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour % 12 || 12;
            return `${displayHour}:${minutes} ${ampm}`;
        };
        return `${formatTime(start)} - ${formatTime(end)}`;
    };

    return (
        <div className="sessions-page">
            <div className="sessions-header">
                <h1>My Sessions</h1>
                <p>Here are all your registered sessions</p>
            </div>
            
            <div className="sessions-list">
                {mockSessions.map(session => (
                    <div key={session.id} className="session-card">
                        <div className="session-main-info">
                            <div className="session-tutor">
                                <h3>Session by: {session.tutor_name}</h3>
                                <span className="tutor-email">{session.tutor_email}</span>
                            </div>
                            
                            <div className="session-details">
                                <h4>{session.session_type}</h4>
                                <p className="session-description">{session.description}</p>
                                
                                <div className="session-meta">
                                    <div className="meta-item">
                                        <span className="label">Date:</span>
                                        <span className="value">{formatDate(session.date)}</span>
                                    </div>
                                    <div className="meta-item">
                                        <span className="label">Time:</span>
                                        <span className="value">{formatTimeSlot(session.time_slot)}</span>
                                    </div>
                                    <div className="meta-item">
                                        <span className="label">Location:</span>
                                        <span className="value">{session.location}</span>
                                    </div>
                                    {session.registered_student && (
                                        <div className="meta-item">
                                            <span className="label">Registered Student:</span>
                                            <span className="value">{session.registered_student}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="session-status-actions">
                            <div className="status-section">
                                <span className={`status ${session.status.toLowerCase()}`}>
                                    {session.status}
                                </span>
                                <span className={`registration-status ${session.is_registered ? 'registered' : 'not-registered'}`}>
                                    {session.is_registered ? '✓ Registered' : 'Not Registered'}
                                </span>
                            </div>
                            
                            <div className="session-actions">
                                {session.status === 'active' && session.is_registered && (
                                    <button className="btn-secondary">Cancel Registration</button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default SessionsPage;