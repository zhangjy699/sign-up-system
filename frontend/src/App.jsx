import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import LoginForm from './components/LoginForm'
import SignupForm from './components/SignupForm'
import ProfileCompletion from './components/ProfileCompletion'
import ProfileUpdate from './components/ProfileUpdate'
import Dashboard from './components/Dashboard'
import MySessions from './components/MySessions';
import TutorCalendar from './components/TutorCalendar';
import { AuthProvider } from './contexts/authcontext';
import './App.css'

function App() {
  return (
  <AuthProvider>
    <Router>
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route path="/signup" element={<SignupForm />} />
        <Route path="/complete-profile" element={<ProfileCompletion />} />
        <Route path="/profile" element={<ProfileUpdate />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/sessions" element={< MySessions />} />
        <Route path="/tutor-calendar" element={<TutorCalendar />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  </AuthProvider>
  )
}

export default App
