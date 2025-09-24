import { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/auth.css';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Login failed');
      }

      // Handle successful login
      console.log('Login successful:', data);
      // You can add redirect or state management here
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

        <h2>FINA/QFIN Student Portal</h2>
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
            placeholder="Enter your password"
            required
          />
          <i className="fas fa-lock input-icon"></i>
          <i
            className={`fas ${showPassword ? 'fa-eye' : 'fa-eye-slash'} toggle-password`}
            onClick={togglePasswordVisibility}
          ></i>
        </div>

        <div className="options-group">
          <label className="remember-me">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <span className="checkmark"></span>
            Remember my login
          </label>
          <a href="#" className="forgot-password">Forgot Password?</a>
        </div>

        <button type="submit" className="login-btn">Sign In</button>

        <div className="divider"><span>Quick Links</span></div>

        <div className="department-links">
          <a href="https://fina.hkust.edu.hk" target="_blank" rel="noopener noreferrer">FINA Department</a>
          <a href="https://qfin.hkust.edu.hk" target="_blank" rel="noopener noreferrer">QFIN Program</a>
          <a href="https://github.com/zhangjy699/sign-up-system" target="_blank" rel="noopener noreferrer">
            Be a contributor to the portal!
          </a>
        </div>

        <div className="signup-link">
          Don't have an account? <Link to="/signup">Sign Up</Link>
        </div>
      </form>
    </div>
  );
}

export default LoginForm;