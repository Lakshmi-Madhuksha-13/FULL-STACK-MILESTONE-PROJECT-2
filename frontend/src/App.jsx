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

function App() {
  return (
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
      </Routes>
      <ChatSupport />
    </Router>
  );
}

export default App;
