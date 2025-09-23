import { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/auth.css';

function SignupForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Signup failed');
      }

      // Handle successful signup
      console.log('Signup successful:', data);
      // You can add redirect to login page here
    } catch (err) {
      setError(err.message);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="container">
      <form className="login-form" onSubmit={handleSubmit}>
        <div className="logo-container">
          <div className="logo-text">
            <h1>HKUST</h1>
            <span>Finance Department Portal</span>
          </div>
        </div>

        <h2>Create New Account</h2>
        {error && <p className="error-message">{error}</p>}

        <div className="input-group">
          <label htmlFor="email">HKUST ITSC Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. jsmith@connect.ust.hk"
            required
          />
          <i className="fas fa-envelope input-icon"></i>
        </div>

        <div className="input-group">
          <label htmlFor="password">Password</label>
          <input
            type={showPassword ? "text" : "password"}
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a password"
            required
          />
          <i className="fas fa-lock input-icon"></i>
          <i
            className={`fas ${showPassword ? 'fa-eye' : 'fa-eye-slash'} toggle-password`}
            onClick={togglePasswordVisibility}
          ></i>
        </div>

        <button type="submit" className="login-btn">Sign Up</button>

        <div className="signup-link">
          Already have an account? <Link to="/login">Sign In</Link>
        </div>
      </form>
    </div>
  );
}

export default SignupForm;