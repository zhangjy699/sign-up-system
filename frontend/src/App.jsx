import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import LoginForm from './components/LoginForm'
import SignupForm from './components/SignupForm'
import Dashboard from './components/Dashboard'
import MySessions from './components/MySessions';
import { AuthProvider } from './contexts/authcontext';
import './App.css'

function App() {
  return (
  <AuthProvider>
    <Router>
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route path="/signup" element={<SignupForm />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/sessions" element={< MySessions />} />
        {/* <Route path="/Profile" element={<Dashboard />} /> */}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  </AuthProvider>
  )
}

export default App
