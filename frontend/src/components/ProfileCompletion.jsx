import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/auth.css';

function ProfileCompletion() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get user email from location state (passed from signup)
  const userEmail = location.state?.email || '';
  
  const [formData, setFormData] = useState({
    contact_number: '',
    major: '',
    full_english_name: '',
    preferred_name: '',
    study_year: ''
  });
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}/profile/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail,
          ...formData
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Profile completion failed');
      }

      // Success - store user data in localStorage and redirect to dashboard
      console.log('Profile completed successfully:', data);
      
      // Store user credentials for dashboard access
      localStorage.setItem('username', userEmail);
      localStorage.setItem('user_id', data.user_id || userEmail);
      
      navigate('/dashboard', { 
        state: { 
          email: userEmail,
          message: 'Profile completed successfully!',
          profileCompleted: true
        } 
      });
      
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // If no email is provided, redirect to signup
  if (!userEmail) {
    navigate('/signup');
    return null;
  }

  return (
    <div className="container">
      <form className="login-form" onSubmit={handleSubmit}>
        <div className="logo-container">
          <div className="logo-text">
            <h1>HKUST</h1>
            <span>Finance Department Portal</span>
          </div>
        </div>

        <h2>Complete Your Profile</h2>
        <p className="profile-subtitle">Please provide additional information to complete your registration</p>
        
        {error && <p className="error-message">{error}</p>}

        <div className="input-group">
          <label htmlFor="full_english_name">Full English Name *</label>
          <input
            type="text"
            id="full_english_name"
            name="full_english_name"
            value={formData.full_english_name}
            onChange={handleChange}
            placeholder="e.g. John Smith"
            required
          />
          <i className="fas fa-user input-icon"></i>
        </div>

        <div className="input-group">
          <label htmlFor="preferred_name">Preferred Name</label>
          <input
            type="text"
            id="preferred_name"
            name="preferred_name"
            value={formData.preferred_name}
            onChange={handleChange}
            placeholder="e.g. Johnny (Optional)"
          />
          <i className="fas fa-user-tag input-icon"></i>
        </div>

        <div className="input-group">
          <label htmlFor="contact_number">Contact Number *</label>
          <input
            type="tel"
            id="contact_number"
            name="contact_number"
            value={formData.contact_number}
            onChange={handleChange}
            placeholder="e.g. +852 1234 5678"
            required
          />
          <i className="fas fa-phone input-icon"></i>
        </div>

        <div className="input-group">
          <label htmlFor="major">Major *</label>
          <select
            id="major"
            name="major"
            value={formData.major}
            onChange={handleChange}
            required
          >
            <option value="">Select your major</option>
            <option value="FINA">FINA</option>
            <option value="QFIN">QFIN</option>
            <option value="SGFN">SGFN</option>
          </select>
          <i className="fas fa-graduation-cap input-icon"></i>
        </div>

        <div className="input-group">
          <label htmlFor="study_year">Study Year *</label>
          <select
            id="study_year"
            name="study_year"
            value={formData.study_year}
            onChange={handleChange}
            required
          >
            <option value="">Select your study year</option>
            <option value="Year 1">Year 1</option>
            <option value="Year 2">Year 2</option>
            <option value="Year 3">Year 3</option>
            <option value="Year 4">Year 4</option>
            <option value="Year 5">Year 5</option>
          </select>
          <i className="fas fa-calendar input-icon"></i>
        </div>

        <button type="submit" className="login-btn" disabled={isLoading}>
          {isLoading ? 'Completing Profile...' : 'Complete Profile'}
        </button>

        <div className="profile-info">
          <small>* Required fields</small>
        </div>
      </form>
    </div>
  );
}

export default ProfileCompletion;