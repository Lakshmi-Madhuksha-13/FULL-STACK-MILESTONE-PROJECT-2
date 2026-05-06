import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ChatSupport from './components/ChatSupport';
import LiveNotificationBar from './components/LiveNotificationBar';
import Home from './pages/Home';
import EventsPage from './pages/EventsPage';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Profile from './pages/Profile';
import EventBookingPage from './pages/EventBookingPage';
import Leaderboard from './pages/Leaderboard';
import GateControlPage from './pages/GateControlPage';

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '4rem', background: '#0f172a', color: 'white', height: '100vh', textAlign: 'center' }}>
          <h1 style={{ color: '#f43f5e' }}>Nexus System Failure</h1>
          <p style={{ opacity: 0.6 }}>A critical error occurred while rendering the interface.</p>
          <pre style={{ background: 'rgba(255,255,255,0.05)', padding: '2rem', borderRadius: '1rem', marginTop: '2rem', textAlign: 'left', overflow: 'auto', maxWidth: '800px', margin: '2rem auto' }}>
            {this.state.error?.toString()}
          </pre>
          <button onClick={() => window.location.reload()} style={{ background: '#8b5cf6', color: 'white', border: 'none', padding: '1rem 2rem', borderRadius: '0.5rem', cursor: 'pointer', marginTop: '2rem' }}>REBOOT SYSTEM</button>
        </div>
      );
    }
    return this.props.children;
  }
}

import NexusPulseTicker from './components/NexusPulseTicker';

function App() {
  return (
    <ErrorBoundary>
      <Router>
      <Navbar />
      <LiveNotificationBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/dashboard" element={<UserDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/book/:id" element={<EventBookingPage />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/gate" element={<GateControlPage />} />
      </Routes>
      <ChatSupport />
      <NexusPulseTicker />
    </Router>
    </ErrorBoundary>
  );
}

export default App;
