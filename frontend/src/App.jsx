import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import LoginForm from './components/LoginForm'
import SignupForm from './components/SignupForm'
import ProfileCompletion from './components/ProfileCompletion'
import Dashboard from './components/dashboard'
import ProfileForm from './components/ProfileForm'
import UpdateProfile from './components/UpdateProfile'
import ProfileView from './components/ProfileView'
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route path="/signup" element={<SignupForm />} />
        <Route path="/profile-completion" element={<ProfileCompletion />} />
        <Route path="/profile" element={<ProfileForm />} />
        <Route path="/profile/update" element={<UpdateProfile />} />
        <Route path="/profile/view" element={<ProfileView />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  )
}

export default App
