import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const UserDashboard = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState('bookings'); 
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [countdown, setCountdown] = useState({ text: 'Establishing Connectivity...', target: null });
  const [toast, setToast] = useState({ show: false, message: '' });

  const [user] = useState(() => {
    try {
      const stored = localStorage.getItem('currentUser');
      return (stored && stored !== 'undefined') ? JSON.parse(stored) : null;
    } catch (e) { return null; }
  });

  const fetchAllData = useCallback(async () => {
    if (!user) return;
    try {
        const [bRes, nRes, eRes] = await Promise.all([
            api.booking.get(`/user/${user.id}`),
            api.user.get(`/${user.id}/notifications`),
            api.event.get('')
        ]);
        setBookings(Array.isArray(bRes.data) ? bRes.data : []);
        setNotifications(Array.isArray(nRes.data) ? nRes.data : []);
        setAllEvents(Array.isArray(eRes.data) ? eRes.data : []);
        setIsDataLoaded(true);
    } catch (e) { console.warn("Background Sync Active..."); }
  }, [user]);

  useEffect(() => {
    if (user) {
        fetchAllData();
        const interval = setInterval(fetchAllData, 7000); 
        return () => clearInterval(interval);
    }
  }, [user, fetchAllData]);

  useEffect(() => {
    const timer = setInterval(() => {
        if (!bookings.length || !allEvents.length) {
            setCountdown({ text: 'Syncing Schedule...', target: null });
            return;
        }
        const eventDates = bookings.map(b => {
            const ev = allEvents.find(e => e && e.id === b.eventId);
            if (!ev || !ev.dateTime) return null;
            const d = new Date(ev.dateTime);
            return isNaN(d.getTime()) ? null : { date: d, name: ev.eventName };
        }).filter(d => d !== null && d.date > new Date());

        if (!eventDates.length) {
            setCountdown({ text: 'Season Concluded', target: 'TechFest 2026' });
            return;
        }
        const closest = eventDates.sort((a, b) => a.date - b.date)[0];
        const diff = closest.date - new Date();
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const m = Math.floor((diff / 1000 / 60) % 60);
        const s = Math.floor((diff / 1000) % 60);
        setCountdown({ text: `${d}d ${h}h ${m}m ${s}s`, target: closest.name });
    }, 1000);
    return () => clearInterval(timer);
  }, [bookings, allEvents]);

  const showToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: '' }), 4000);
  };

  const handleCancelBooking = async (bId, eName) => {
    if (window.confirm(`Initiate cancellation and refund for ${eName}?`)) {
        try {
            await api.booking.delete(`/${bId}`);
            // Send formal refund request to Support Hub
            const refundMsg = { userId: user.id, senderName: user.name, message: `REFUND_REQUEST: I have cancelled my booking for ${eName} (ID: ${bId}). Please process the refund.`, type: 'USER' };
            await api.support.post('/send', refundMsg);
            
            showToast("Cancellation Successful. Refund Process Initiated.");
            fetchAllData();
        } catch (e) { showToast("Cancellation procedure failed. Please contact Support."); }
    }
  };

  const parseSnapshot = (msg) => {
    if (!msg || typeof msg !== 'string' || !msg.startsWith('BOOKING_SNAPSHOT|')) return { isSnapshot: false, text: msg || 'Official Correspondence' };
    return msg.split('|').reduce((acc, p) => {
        const [k, v] = p.split(': ');
        if(v) acc[k.trim()] = v.trim();
        return acc;
    }, {});
  };

  if (!user) return <div className="app-container" style={{textAlign: 'center', padding: '10rem'}}><h2>Access Denied</h2><button className="btn-primary" onClick={() => navigate('/login')}>Return to Login</button></div>;

  return (
    <div className="app-container page-transition" style={{ minHeight: '100vh' }}>
      {/* 🚀 TOAST NOTIFIER */}
      {toast.show && (
          <div className="toast-interactive bounce-in" style={{ position: 'fixed', top: '100px', left: '50%', transform: 'translateX(-50%)', zIndex: '5000', padding: '1rem 2.5rem', background: 'var(--primary)', borderRadius: '2rem', boxShadow: '0 0 40px var(--primary-bright)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}><span style={{fontWeight: '900'}}>{toast.message}</span></div>
          </div>
      )}

      {/* 🏗️ SCAFFOLDED HEADER */}
      <div className="glass-panel" style={{ background: 'linear-gradient(90deg, var(--primary), var(--secondary))', padding: '2.5rem', marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><h4 style={{ margin: 0, opacity: 0.8, fontSize: '0.8rem', letterSpacing: '2px' }}>{countdown.target || 'GLOBAL SYNC'}</h4><div style={{ fontSize: '3rem', fontWeight: '950' }}>{countdown.text}</div></div>
          <div style={{ fontSize: '3.5rem' }}>🛰️</div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '3rem' }}>
        <button className="btn-tab-elite" style={activeTab === 'bookings' ? activeStyle : null} onClick={() => setActiveTab('bookings')}>Ticket Inventory</button>
        <button className="btn-tab-elite" style={activeTab === 'notifications' ? activeStyle : null} onClick={() => setActiveTab('notifications')}>System Inbox</button>
      </div>

      <div className="glass-panel" style={{ minHeight: '600px', padding: '3rem' }}>
        {activeTab === 'bookings' ? (
          <div>
            <h2 className="gradient-text" style={{fontSize: '2rem', marginBottom: '2rem'}}>Credential Registry</h2>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead style={{ borderBottom: '1px solid var(--glass-border)', fontSize: '0.8rem', opacity: 0.5 }}>
                    <tr><th style={{padding: '1rem'}}>ID</th><th style={{padding: '1rem'}}>ASSET NAME</th><th style={{padding: '1rem'}}>TOTAL COST</th><th style={{padding: '1rem'}}>PROTOCOLS</th></tr>
                </thead>
                <tbody>
                    {bookings.map(b => {
                        const evtName = allEvents.find(e => e.id === b.eventId)?.eventName || `Asset #${b.eventId}`;
                        return (
                            <tr key={b.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                <td style={{ padding: '1.5rem 1rem', fontWeight: '900' }}>TF-{b.id}</td>
                                <td style={{ padding: '1.5rem 1rem', color: 'var(--primary)', fontWeight: 'bold' }}>{evtName}</td>
                                <td style={{ padding: '1.5rem 1rem', fontWeight: 'bold' }}>₹{b.totalAmount}</td>
                                <td style={{ padding: '1.5rem 1rem', display: 'flex', gap: '0.5rem' }}>
                                    <button className="btn-elite" onClick={() => setSelectedBooking(b)} style={{ padding: '0.4rem 1rem', fontSize: '0.7rem' }}>OPEN PASS</button>
                                    <button className="btn-elite" style={{ background: 'var(--accent)', color: 'white', border: 'none', padding: '0.4rem 1rem', fontSize: '0.7rem' }} onClick={() => handleCancelBooking(b.id, evtName)}>CANCEL & REFUND</button>
                                </td>
                            </tr>
                        );
                    })}
                    {isDataLoaded && !bookings.length && (<tr><td colSpan="4" style={{ padding: '5rem', textAlign: 'center', opacity: 0.3 }}>No active records found in the Ledger.</td></tr>)}
                </tbody>
                </table>
            </div>
          </div>
        ) : (
            <div>
                <h2 className="gradient-text" style={{fontSize: '2rem', marginBottom: '2rem'}}>Executive Correspondence</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {notifications.map(n => {
                        const snap = parseSnapshot(n.message);
                        return (
                            <div key={n.id} className="glass-panel" style={{ padding: '1.5rem', borderLeft: n.read ? 'none' : '4px solid var(--vivid-pink)', background: n.read ? 'transparent' : 'rgba(139, 92, 246, 0.05)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', opacity: 0.5 }}>
                                    <span>#{n.id}</span>
                                    <span>{new Date(n.timestamp).toLocaleString()}</span>
                                </div>
                                <div style={{ fontWeight: 'bold', margin: '0.5rem 0' }}>{snap.isSnapshot ? `Financial Snapshot: ${snap.ID}` : 'Service Update'}</div>
                                <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>{n.message}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        )}
      </div>

      <style>{`
        .btn-tab-elite { background: transparent; border: 1px solid var(--glass-border); color: white; padding: 0.8rem 2.2rem; border-radius: 12px; cursor: pointer; font-weight: bold; font-size: 0.9rem; transition: 0.3s; }
      `}</style>
    </div>
  );
};

const activeStyle = { background: 'var(--primary)', borderColor: 'var(--primary-bright)', boxShadow: '0 0 25px var(--primary-bright)' };

export default UserDashboard;
