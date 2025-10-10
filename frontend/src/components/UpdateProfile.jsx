import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/auth.css';

const UpdateProfile = () => {
    const [formData, setFormData] = useState({
        name: '',
        study_year: '',
        major: '',
        contact_number: ''
    });
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email;

    const yearOptions = [
        { value: '', label: '--Please Select--' },
        { value: '1', label: 'Year 1' },
        { value: '2', label: 'Year 2' },
        { value: '3', label: 'Year 3' },
        { value: '4', label: 'Year 4' },
        { value: '5', label: 'Year 5' }
    ];
    const majorOptions = [
        { value: '', label: '--Please Select--' },
        { value: 'QFIN', label: 'QFIN' },
        { value: 'SGFN', label: 'SGFN' },
        { value: 'FINA', label: 'FINA' }
    ];

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
                const response = await fetch(`${API_URL}/profile/${email}`);
                
                if (!response.ok) {
                    throw new Error('Failed to fetch profile data');
                }

                const data = await response.json();
                setFormData({
                    name: data.name || '',
                    study_year: data.study_year?.toString() || '',
                    major: data.major || '',
                    contact_number: data.contact_number || ''
                });
            } catch (err) {
                setError('Failed to load profile data');
                console.error('Error fetching profile:', err);
            }
        };

        if (email) {
            fetchProfile();
        }
    }, [email]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate selections
        if (!formData.study_year || !formData.major) {
            setError('Please select a valid year and major');
            return;
        }

        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const response = await fetch(`${API_URL}/profile/${email}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    study_year: parseInt(formData.study_year)
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || 'Failed to update profile');
            }

            navigate('/dashboard', { state: { email } });
        } catch (err) {
            setError(err.message || 'Failed to update profile');
        }
    };

    if (!email) {
        return <div>Invalid access. Please log in first.</div>;
    }

    return (
        <div className="auth-container">
            <div className="logo-container">
                <h1>HKUST</h1>
                <span>Finance Department Portal</span>
            </div>
            <div className="auth-form">
                <h2>Update Your Profile</h2>
                {error && <div className="error-message">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="name" className="form-label">Full Name</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            placeholder="Enter your full name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="form-input"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="study_year" className="form-label">Study Year</label>
                        <select
                            id="study_year"
                            name="study_year"
                            value={formData.study_year}
                            onChange={handleChange}
                            required
                            className="form-input"
                        >
                            {yearOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="major" className="form-label">Major</label>
                        <select
                            id="major"
                            name="major"
                            value={formData.major}
                            onChange={handleChange}
                            required
                            className="form-input"
                        >
                            {majorOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="contact_number" className="form-label">Contact Number</label>
                        <input
                            type="tel"
                            id="contact_number"
                            name="contact_number"
                            placeholder="Enter your contact number"
                            value={formData.contact_number}
                            onChange={handleChange}
                            required
                            className="form-input"
                        />
                    </div>
                    <button type="submit" className="auth-button">
                        Save Changes
                    </button>
                </form>
            </div>
        </div>
    );
};

export default UpdateProfile;