import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/auth.css';
import { DEFAULT_AVATAR_SVG } from '../constants';

const ProfileView = () => {
    const [profileData, setProfileData] = useState(null);
    const [formData, setFormData] = useState({
        full_english_name: '',
        preferred_name: '',
        study_year: '',
        major: '',
        contact_number: '',
        profile_picture: ''
    });
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email || localStorage.getItem('username');

    console.log('ProfileView - Email from location:', location.state?.email);
    console.log('ProfileView - Email from localStorage:', localStorage.getItem('username'));
    console.log('ProfileView - Final email:', email);

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
        if (!email) {
            navigate('/login');
            return;
        }
        fetchProfile();
    }, [email, navigate]);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const response = await fetch(`${API_URL}/profile/${email}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch profile data');
            }

            const data = await response.json();
            setProfileData(data);
            
            // Ensure study_year is converted to string for form compatibility
            const updatedFormData = {
                full_english_name: data.full_english_name || '',
                preferred_name: data.preferred_name || '',
                study_year: data.study_year ? data.study_year.toString() : '',
                major: data.major || '',
                contact_number: data.contact_number || '',
                profile_picture: data.profile_picture || ''
            };
            
            setFormData(updatedFormData);
        } catch (err) {
            setError('Failed to load profile data');
            console.error('Error fetching profile:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleProfilePictureChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Check file size (limit to 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setError('Image size must be less than 5MB');
                return;
            }

            // Check file type
            if (!file.type.startsWith('image/')) {
                setError('Please select a valid image file');
                return;
            }

            // Convert to base64 for display and storage
            const reader = new FileReader();
            reader.onload = (e) => {
                const base64 = e.target.result;
                setFormData(prevState => ({
                    ...prevState,
                    profile_picture: base64
                }));
                setError(''); // Clear any previous errors
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        
        // Validate selections
        if (!formData.study_year || !formData.major) {
            setError('Please select a valid year and major');
            return;
        }

        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const response = await fetch(`${API_URL}/profile/completed/${email}`, {
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

            // Refresh profile data and exit edit mode
            await fetchProfile();
            setIsEditing(false);
            setError('');
        } catch (err) {
            setError(err.message || 'Failed to update profile');
        }
    };

    const handleCancel = () => {
        // Reset form data to original profile data
        if (profileData) {
            const resetFormData = {
                full_english_name: profileData.full_english_name || '',
                preferred_name: profileData.preferred_name || '',
                study_year: profileData.study_year ? profileData.study_year.toString() : '',
                major: profileData.major || '',
                contact_number: profileData.contact_number || '',
                profile_picture: profileData.profile_picture || ''
            };
            setFormData(resetFormData);
        }
        setIsEditing(false);
        setError('');
    };

    if (loading) {
        return (
            <div className="auth-container">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Loading profile...</p>
                </div>
            </div>
        );
    }

    if (!profileData) {
        return (
            <div className="auth-container">
                <div className="logo-container">
                    <h1>HKUST</h1>
                    <span>Finance Department Portal</span>
                </div>
                <div className="auth-form">
                    <h2>Profile Not Found</h2>
                    <p>Please complete your profile first.</p>
                    <button 
                        onClick={() => navigate('/dashboard')} 
                        className="auth-button"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-container profile-view">
            <div className="logo-container">
                <h1>HKUST</h1>
                <span>Finance Department Portal</span>
            </div>
            <div className="auth-form">
                <div className="profile-header">
                    <h2>My Profile</h2>
                    <button 
                        onClick={() => navigate('/dashboard')} 
                        className="back-btn"
                        title="Back to Dashboard"
                    >
                        ← Back
                    </button>
                </div>
                
                {error && <div className="error-message">{error}</div>}
                
                <div className="profile-content">
                    {/* Profile Picture Section */}
                    <div className="profile-picture-section">
                        <div className="current-avatar">
                            <img 
                                src={formData.profile_picture || '/default-avatar.png'} 
                                alt="Profile" 
                                className="profile-avatar"
                                onError={(e) => {
                                    e.target.src = DEFAULT_AVATAR_SVG;
                                }}
                            />
                        </div>
                        {isEditing && (
                            <div className="picture-upload">
                                <input
                                    type="file"
                                    id="profile_picture_file"
                                    accept="image/*"
                                    onChange={handleProfilePictureChange}
                                    style={{ display: 'none' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => document.getElementById('profile_picture_file').click()}
                                    className="upload-btn"
                                >
                                    Change Picture
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Email (non-editable) */}
                    <div className="form-group">
                        <label className="form-label">Registration Email</label>
                        <div className="readonly-field">{email}</div>
                        <small className="field-note">Email cannot be changed</small>
                    </div>

                    {/* Editable fields */}
                    <form onSubmit={handleUpdate}>
                        <div className="form-group">
                            <label htmlFor="full_english_name" className="form-label">Full English Name</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    id="full_english_name"
                                    name="full_english_name"
                                    placeholder="Enter your full English name"
                                    value={formData.full_english_name}
                                    onChange={handleChange}
                                    required
                                    className="form-input"
                                />
                            ) : (
                                <div className="readonly-field">{formData.full_english_name || 'Not provided'}</div>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="preferred_name" className="form-label">Preferred Name</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    id="preferred_name"
                                    name="preferred_name"
                                    placeholder="Enter your preferred name (optional)"
                                    value={formData.preferred_name}
                                    onChange={handleChange}
                                    className="form-input"
                                />
                            ) : (
                                <div className="readonly-field">{formData.preferred_name || 'Not provided'}</div>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="study_year" className="form-label">Study Year</label>
                            {isEditing ? (
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
                            ) : (
                                <div className="readonly-field">{formData.study_year ? `Year ${formData.study_year}` : 'Not provided'}</div>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="major" className="form-label">Major</label>
                            {isEditing ? (
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
                            ) : (
                                <div className="readonly-field">{formData.major || 'Not provided'}</div>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="contact_number" className="form-label">Contact Number</label>
                            {isEditing ? (
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
                            ) : (
                                <div className="readonly-field">{formData.contact_number || 'Not provided'}</div>
                            )}
                        </div>

                        {/* Action buttons */}
                        <div className="profile-actions">
                            {isEditing ? (
                                <div className="action-buttons">
                                    <button type="submit" className="auth-button update-btn">
                                        Update
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={handleCancel}
                                        className="auth-button cancel-btn"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            ) : (
                                <button 
                                    type="button"
                                    onClick={() => setIsEditing(true)}
                                    className="auth-button edit-btn"
                                >
                                    Edit Profile
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ProfileView;