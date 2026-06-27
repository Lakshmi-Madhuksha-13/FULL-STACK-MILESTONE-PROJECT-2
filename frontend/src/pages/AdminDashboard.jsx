import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, BarElement } from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import GateControl from '../components/GateControl';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement);

/* ─── MODAL ─────────────────────────────────────────────── */
const Modal = ({ show, title, message, onConfirm, onCancel, confirmLabel = 'CONFIRM', danger = true }) => {
  if (!show) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-panel bounce-in" style={{ maxWidth: '440px', width: '90%', padding: '3rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1.2rem' }}>{danger ? '⚠️' : 'ℹ️'}</div>
        <h3 style={{ marginBottom: '0.8rem' }}>{title}</h3>
        <p style={{ color: 'var(--text-dim)', marginBottom: '2.5rem', lineHeight: 1.6 }}>{message}</p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button className="btn-elite" onClick={onCancel} style={{ padding: '0.8rem 2rem' }}>CANCEL</button>
          <button className="btn-elite" onClick={onConfirm} style={{ background: danger ? 'var(--accent)' : 'var(--primary)', border: 'none', padding: '0.8rem 2rem', fontWeight: 900 }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
};

/* ─── STATUS BADGE ───────────────────────────────────────── */
const StatusBadge = ({ status }) => {
  const map = {
    CONFIRMED: { bg: 'rgba(16,185,129,0.1)', color: '#10b981', label: '✅ CONFIRMED' },
    CANCELLED: { bg: 'rgba(244,63,94,0.1)', color: '#f43f5e', label: '🚫 CANCELLED' },
    REFUNDED:  { bg: 'rgba(251,191,36,0.1)', color: '#fbbf24', label: '💰 REFUNDED' },
    ADMITTED:  { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6', label: '🎟️ ADMITTED' },
    REJECTED:  { bg: 'rgba(244,63,94,0.1)', color: '#f43f5e', label: '❌ REJECTED' },
  };
  const s = map[status?.toUpperCase()] || { bg: 'rgba(255,255,255,0.05)', color: '#fff', label: status };
  return <span style={{ background: s.bg, color: s.color, padding: '0.25rem 0.8rem', borderRadius: '2rem', fontSize: '0.65rem', fontWeight: 900, border: `1px solid ${s.color}` }}>{s.label}</span>;
};

const GateStatusBadge = ({ booking }) => {
    const isAdmitted = booking.status === 'ADMITTED' || booking.usedFlag;
    const isRejected = booking.status === 'REJECTED';
    
    if (isAdmitted) return <span style={{ color: '#10b981', fontSize: '0.65rem', fontWeight: 950 }}>● ENTERED</span>;
    if (isRejected) return <span style={{ color: '#f43f5e', fontSize: '0.65rem', fontWeight: 950 }}>● DENIED</span>;
    return <span style={{ color: '#94a3b8', fontSize: '0.65rem', fontWeight: 950, opacity: 0.5 }}>● NOT ENTERED</span>;
};

const RefundBadge = ({ status }) => {
  const map = {
    REQUESTED: { bg: 'rgba(244,63,94,0.1)', color: '#f43f5e', label: 'REQUESTED' },
    PROCESSING: { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6', label: 'PROCESSING' },
    APPROVED: { bg: 'rgba(16,185,129,0.1)', color: '#10b981', label: 'APPROVED' },
    REJECTED: { bg: 'rgba(255,255,255,0.05)', color: '#94a3b8', label: 'REJECTED' },
    REFUNDED: { bg: 'rgba(251,191,36,0.1)', color: '#fbbf24', label: 'REFUNDED' },
  };
  const s = map[status?.toUpperCase()] || { bg: 'rgba(255,255,255,0.05)', color: '#94a3b8', label: status || 'PENDING' };
  return <span style={{ background: s.bg, color: s.color, padding: '0.25rem 0.6rem', borderRadius: '4px', fontSize: '0.6rem', fontWeight: 900 }}>{s.label}</span>;
};

/* ─── ADMIN DASHBOARD ───────────────────────────────────── */
const AdminDashboard = () => {
  const currentUser = (() => {
    try { const s = localStorage.getItem('currentUser'); return s && s !== 'undefined' ? JSON.parse(s) : null; } catch { return null; }
  })();

  const isAdmin = (currentUser?.role || '').toUpperCase() === 'ADMIN';
  const isVolunteer = (currentUser?.role || '').toUpperCase() === 'VOLUNTEER';
  const isStaff = isAdmin || isVolunteer;

  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
    if (location.state?.tab) return location.state.tab;
    return isVolunteer ? 'verify' : 'analytics';
  });

  useEffect(() => {
    if (location.state?.tab) setActiveTab(location.state.tab);
  }, [location.state]);
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
   const [bookings, setBookings] = useState([]);
  const [waitlistEntries, setWaitlistEntries] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '' });
  const [modal, setModal] = useState({ show: false });
  const [editingEvent, setEditingEvent] = useState(null);
  const [newEvent, setNewEvent] = useState({ eventName: '', venue: '', department: '', dateTime: '', price: 0, totalTickets: 100, availableTickets: 100, poster: '', description: '' });
  const [verifyId, setVerifyId] = useState('');
  
  // Support
  const [supportMsgs, setSupportMsgs] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const chatScrollRef = useRef();

  const showToast = (msg) => { setToast({ show: true, message: msg }); setTimeout(() => setToast({ show: false, message: '' }), 4000); };
  const showModal = (title, message, onConfirm, danger = true) => setModal({ show: true, title, message, onConfirm, danger });
  const closeModal = () => setModal({ show: false });

  const fetchAll = async () => {
    try {
       const [eRes, uRes, bRes, nRes, wRes] = await Promise.all([
        api.event.get(''), 
        api.user.get(''), 
        api.booking.get(''), 
        api.user.get('/notifications/all').catch(() => ({ data: [] })),
        api.booking.get('/waitlist').catch(() => ({ data: [] }))
      ]);
      setEvents(Array.isArray(eRes.data) ? eRes.data : []);
      setUsers(Array.isArray(uRes.data) ? uRes.data : []);
      setBookings(Array.isArray(bRes.data) ? bRes.data : []);
      setNotifications(Array.isArray(nRes.data) ? nRes.data : []);
      setWaitlistEntries(Array.isArray(wRes.data) ? wRes.data : []);
      setIsLoaded(true);
    } catch (e) {}
  };

  const fetchSupport = async () => {
    try {
      const res = await api.support.get('/all');
      setSupportMsgs(Array.isArray(res.data) ? res.data : []);
    } catch (e) {}
  };

  useEffect(() => {
    if (!currentUser || !isStaff) return;
    fetchAll();
    const i = setInterval(fetchAll, 8000);
    return () => clearInterval(i);
  }, [isStaff]);

  useEffect(() => {
    if (activeTab !== 'support') return;
    fetchSupport();
    const i = setInterval(fetchSupport, 3000);
    return () => clearInterval(i);
  }, [activeTab]);

  useEffect(() => {
    if (chatScrollRef.current) chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
  }, [supportMsgs, selectedUserId]);

  const supportByUser = useMemo(() => {
    return (supportMsgs || []).reduce((acc, m) => {
      if (!m || !m.userId) return acc;
      const uId = m.userId.toString();
      if (!acc[uId]) acc[uId] = [];
      acc[uId].push(m);
      return acc;
    }, {});
  }, [supportMsgs]);

   const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!newEvent.eventName || !newEvent.department || !newEvent.dateTime || !newEvent.venue) {
      showToast("Please fill all required fields.");
      return;
    }
    try {
      await api.event.post('', { ...newEvent, availableTickets: newEvent.totalTickets });
      setNewEvent({ eventName: '', venue: '', department: '', dateTime: '', price: 0, totalTickets: 100, availableTickets: 100, poster: '', description: '' });
      showToast('Event deployed to Nexus registry!');
      fetchAll();
    } catch { showToast('Deployment error.'); }
  };

  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    try {
      await api.event.put(`/${editingEvent.id}`, editingEvent);
      setEditingEvent(null);
      showToast('Event reconfigured!');
      fetchAll();
    } catch { showToast('Update failed.'); }
  };

  const handleDeleteEvent = (ev) => {
    showModal('Terminate Event?', `Permanently remove "${ev.eventName}"?`, async () => {
      closeModal();
      await api.event.delete(`/${ev.id}`);
      showToast('Event purged.');
      fetchAll();
    });
  };

  const handlePurgeUser = (u) => {
    showModal('Purge Member?', `Remove "${u.name}" from registry?`, async () => {
      closeModal();
      await api.user.delete(`/${u.id}`);
      showToast('Member record liquidated.');
      fetchAll();
    });
  };

  const handleUpdateStatus = async (b, status) => {
    console.log(`[Admin Nexus]: Updating TF-${b.id} to ${status}`);
    try {
      await api.booking.put(`/${b.id}/status`, { status });
      showToast(`Status TF-${b.id} updated to ${status}`);
      fetchAll();
    } catch (err) { 
      console.error("Status Update Failed:", err);
      showToast(err.response?.data?.message || err.response?.data || 'Update failed.', false); 
    }
  };

  const handleUpdateRefund = async (b, refundStatus) => {
    console.log(`[Admin Nexus]: Updating Refund for TF-${b.id} to ${refundStatus}`);
    try {
      await api.booking.put(`/${b.id}/refund`, { refundStatus });
      showToast(`Refund for TF-${b.id} is now ${refundStatus}`);
      fetchAll();
    } catch (err) {
      console.error("Refund Update Failed:", err);
      showToast('Refund update failed.', false);
    }
  };

  const handleCancelRequest = (b) => {
    showModal('Revoke Booking?', `Are you sure you want to CANCEL ticket TF-${b.id}? This will trigger a refund request.`, () => {
        closeModal();
        handleUpdateStatus(b, 'CANCELLED');
    }, true);
  };

  const handlePromote = async (userId, role) => {
    try {
        await api.user.put(`/${userId}/role`, { role });
        showToast(`User promoted to ${role}`);
        fetchAll();
    } catch { showToast('Promotion failed.'); }
  };

   const handleReply = async () => {
    if (!replyText.trim() || !selectedUserId) return;
    try {
        await api.support.post('/send', { userId: selectedUserId, senderName: 'Admin', message: replyText, type: 'ADMIN' });
        setReplyText('');
        fetchSupport(); // Instant local refresh
        showToast('Reply dispatched instantly.');
    } catch (err) { 
        showToast('Message delivery failed.'); 
    }
  };

  const handleVerify = (id) => {
    if (!id) return;
    const idStr = id.toString().replace('TF-', '').trim();
    const b = (bookings || []).find(bk => bk.id.toString() === idStr);
    if (b) {
        if (b.status === 'CANCELLED' || b.status === 'REFUNDED' || b.status === 'VOID') {
            showToast('ACCESS DENIED: Pass is Cancelled/Void', false);
            return;
        }
        if (b.status === 'ADMITTED') {
            showToast('ACCESS DENIED: Already Entered', false);
            return;
        }
        console.log("[Gate Nexus]: Pass Authenticated -", b.id);
        const uName = (users || []).find(u => u.id.toString() === b.userId.toString())?.name || `Participant #${b.userId}`;
        const ev = (events || []).find(e => e.id.toString() === b.eventId.toString());
        
        showModal('Gate Entry Verified', (
            <div style={{ textAlign: 'left' }}>
                <p>Pass TF-{b.id} for <strong>"{uName}"</strong> found. Admit participant?</p>
                {ev && (
                    <div style={{ marginTop: '1.5rem' }}>
                        <div style={{ fontSize: '0.6rem', opacity: 0.5, fontWeight: 900, marginBottom: '0.5rem' }}>VENUE LOCATION</div>
                        <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                            <iframe
                                title="Admin Verify Map"
                                width="100%"
                                height="150"
                                style={{ border: 'none', display: 'block' }}
                                src={`https://maps.google.com/maps?q=${encodeURIComponent(ev.venue)}&output=embed&z=14`}
                            />
                        </div>
                    </div>
                )}
            </div>
        ), () => {
            closeModal();
            handleUpdateStatus(b, 'ADMITTED');
        }, false);
    } else {
        console.warn("[Gate Nexus]: Invalid Pass detected:", id);
        showToast('ACCESS DENIED: Invalid ID', false);
    }
  };

  const handleShiftDates = async () => {
    try {
        await api.event.put('/shift-dates');
        showToast('All event dates shifted to next month!');
        fetchAll();
    } catch { showToast('Shift failed.'); }
  };

  const totalRevenue = useMemo(() => {
    return (bookings || []).reduce((s, b) => {
      const status = (b.status || '').toUpperCase();
      // 🛡️ INCLUSIVE REVENUE: Count everything that isn't cancelled or rejected
      const isInvalid = ['CANCELLED', 'REFUNDED', 'REJECTED', 'VOID'].includes(status);
      if (!isInvalid) {
        const amt = parseFloat(b.totalAmount?.toString().replace(/[^0-9.]/g, '')) || 0;
        return s + amt;
      }
      return s;
    }, 0);
  }, [bookings]);

  const analyticsData = useMemo(() => {
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toLocaleDateString('en-US', { weekday: 'short' });
    });

    const parseNexusDate = (raw) => {
        try {
            if (!raw) return new Date(NaN);
            if (Array.isArray(raw)) return new Date(raw[0], raw[1] - 1, raw[2], raw[3] || 0, raw[4] || 0);
            const d = new Date(raw);
            if (!isNaN(d.getTime())) return d;
            return new Date(NaN);
        } catch { return new Date(NaN); }
    };

    const bookingsByDay = last7Days.map((_, i) => (bookings.filter(b => {
        const rawDate = b.bookingDate || b.timestamp || b.createdAt || b.dateTime;
        const d = parseNexusDate(rawDate);
        if (isNaN(d.getTime())) return false;
        return d.getDay() === (new Date().getDay() - (6 - i) + 7) % 7;
    }).length)); 

    const revenueByDay = last7Days.map((_, i) => {
      return bookings.filter(b => {
          const rawDate = b.bookingDate || b.timestamp || b.createdAt || b.dateTime;
          const d = parseNexusDate(rawDate);
          const status = (b.status || '').toUpperCase();
          const isInvalid = ['CANCELLED', 'REFUNDED', 'REJECTED', 'VOID'].includes(status);
          const matchesDay = !isNaN(d.getTime()) && d.getDay() === (new Date().getDay() - (6 - i) + 7) % 7;
          return matchesDay && !isInvalid;
      }).reduce((s, b) => s + (parseFloat(b.totalAmount) || 0), 0);
    });

    return {
      bookings: {
        labels: last7Days,
        datasets: [{
          label: 'Daily Bookings',
          data: bookingsByDay,
          borderColor: '#8b5cf6',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      revenue: {
        labels: last7Days,
        datasets: [{
          label: 'Revenue Stream (₹)',
          data: revenueByDay,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      }
    };
  }, [bookings]);

  const ALL_TABS = [
    ['analytics', 'ANALYTICS HUD'], 
    ['events', 'EVENT REGISTRY'], 
    ['verify', 'GATE TERMINAL 🛡️'],
    ['audit', 'ENTRY LEDGER'], 
    ['transactions', 'FINANCIAL LEDGER 💰'],
    ['participants', 'CITIZEN DIRECTORY'], 
    ['support', 'SUPPORT INTEL'],
    ['waitlist', 'WAITLIST HUB'],
  ];
  const TABS = isAdmin ? ALL_TABS : ALL_TABS.filter(t => ['support', 'waitlist'].includes(t[0]));

  const departmentData = useMemo(() => {
    const deptCounts = users.reduce((acc, u) => {
      acc[u.department || 'Other'] = (acc[u.department || 'Other'] || 0) + 1;
      return acc;
    }, {});
    return {
      labels: Object.keys(deptCounts),
      datasets: [{
        data: Object.values(deptCounts),
        backgroundColor: ['#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e']
      }]
    };
  }, [users]);

  if (!currentUser) return null;

  return (
    <div className="app-container page-transition" style={{ minHeight: '100vh', paddingBottom: '5rem' }}>
      <Modal {...modal} onCancel={closeModal} />

      {toast.show && (
        <div className="bounce-in" style={{ position: 'fixed', top: '30px', left: '50%', transform: 'translateX(-50%)', zIndex: 5000, padding: '1rem 2.5rem', background: 'var(--primary)', borderRadius: '2rem', boxShadow: '0 0 30px var(--primary-bright)', fontWeight: 900 }}>
          {toast.message}
        </div>
      )}

      {/* Header Metrics */}
      <div style={{ textAlign: 'center', margin: '4rem 0' }}>
        <h1 className="gradient-text" style={{ fontSize: '3.8rem', fontWeight: 950, letterSpacing: '-3px', marginBottom: '3.5rem' }}>Admin Nexus</h1>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
            {[
                { label: 'TOTAL AMOUNT EARNED', value: `₹${totalRevenue.toLocaleString()}`, color: 'var(--success)', glow: 'rgba(16,185,129,0.2)' },
                { label: 'TOTAL USERS', value: users.length, color: 'var(--primary)', glow: 'rgba(139,92,246,0.2)' },
                { label: 'LIVE EVENTS', value: events.length, color: '#fbbf24', glow: 'rgba(251,191,36,0.2)' }
            ].map((m, i) => (
                <div key={i} className="glass-panel" style={{ 
                    padding: '2.5rem 3rem', minWidth: '320px', borderRadius: '2.5rem', 
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
                }}>
                    <div style={{ fontSize: '0.65rem', opacity: 0.5, fontWeight: 950, letterSpacing: '2px', marginBottom: '1rem', color: m.color }}>{m.label}</div>
                    <div style={{ fontSize: '3.8rem', fontWeight: 950, color: m.color, textShadow: `0 0 30px ${m.glow}`, lineHeight: 1 }}>{m.value}</div>
                </div>
            ))}
        </div>
      </div>

      <div className="nav-sticky" style={{ marginBottom: '3.5rem' }}>
        <div className="app-container" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
          gap: '1rem', 
          justifyContent: 'center' 
        }}>
          {TABS.map(([id, label]) => (
            <button key={id} onClick={(e) => { 
                e.stopPropagation();
                setActiveTab(id); 
              }}
              style={{ 
                background: activeTab === id ? 'var(--primary)' : 'rgba(255,255,255,0.05)', 
                border: `2px solid ${activeTab === id ? 'var(--primary)' : 'var(--glass-border)'}`, 
                color: 'white', padding: '1rem', borderRadius: '16px', cursor: 'pointer', 
                fontWeight: 900, fontSize: '0.8rem', transition: '0.3s', pointerEvents: 'auto',
                boxShadow: activeTab === id ? '0 10px 20px rgba(139,92,246,0.2)' : 'none',
                gridColumn: id === 'transactions' ? '1' : 'auto'
              }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-panel" style={{ minHeight: '600px', padding: '3.5rem' }}>
        
        {/* 📊 ANALYTICS */}
          {activeTab === 'analytics' && (
          <div className="page-transition">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem', marginBottom: '3rem' }}>
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h3 style={{ fontSize: '0.9rem', marginBottom: '1.5rem', opacity: 0.6 }}>REVENUE TREND (7D)</h3>
                    <Line data={analyticsData.revenue} options={{ responsive: true, plugins: { legend: { display: false } } }} />
                </div>
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h3 style={{ fontSize: '0.9rem', marginBottom: '1.5rem', opacity: 0.6 }}>BOOKING ACTIVITY (7D)</h3>
                    <Line data={analyticsData.bookings} options={{ responsive: true, plugins: { legend: { display: false } } }} />
                </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2.5rem' }}>
                <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
                    <h3 style={{ fontSize: '0.9rem', marginBottom: '1.5rem', opacity: 0.6 }}>DEPT DISTRIBUTION</h3>
                    <div style={{ maxWidth: '250px', margin: '0 auto' }}>
                        <Doughnut data={departmentData} options={{ plugins: { legend: { position: 'bottom' } } }} />
                    </div>
                </div>
                    <div className="glass-panel" style={{ padding: '2rem' }}>
                        <h3 style={{ fontSize: '0.9rem', marginBottom: '1.5rem', opacity: 0.6 }}>NEXUS TACTICAL OPERATIONS</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div style={{ padding: '1.5rem', background: 'rgba(236,72,153,0.05)', borderRadius: '1rem', border: '1px solid rgba(236,72,153,0.2)' }}>
                                <div style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--secondary)', letterSpacing: '1px' }}>TRIGGER FLASH SALE</div>
                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                    <input id="flashDiscount" type="number" placeholder="%" className="form-control" style={{ width: '80px', fontSize: '0.8rem' }} />
                                    <button className="btn-primary" onClick={async () => {
                                        const disc = document.getElementById('flashDiscount').value;
                                        if (!disc) return;
                                        try {
                                            await api.booking.post('/flash-coupon', { discount: disc });
                                            showToast(`FLASH SALE TRIGGERED: ${disc}% OFF!`);
                                        } catch { showToast('Operation failed.'); }
                                    }} style={{ flex: 1, fontSize: '0.7rem', background: 'var(--secondary)' }}>BROADCAST ⚡</button>
                                </div>
                            </div>
                            <div style={{ padding: '1.5rem', background: 'rgba(59,130,246,0.05)', borderRadius: '1rem', border: '1px solid rgba(59,130,246,0.2)' }}>
                                <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#3b82f6', letterSpacing: '1px' }}>SYSTEM HEALTH</div>
                                <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{ width: '10px', height: '10px', background: 'var(--success)', borderRadius: '50%', boxShadow: '0 0 10px var(--success)' }}></div>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 800 }}>ALL SERVICES ONLINE</div>
                                </div>
                            </div>
                    </div>
                </div>
            </div>
          </div>
        )}

        {/* 📅 EVENTS */}
        {activeTab === 'events' && (
          <div className="page-transition">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <h2 className="gradient-text">Event Hub</h2>
                <button onClick={handleShiftDates} className="btn-elite" style={{ background: 'var(--accent)', border: 'none', fontSize: '0.7rem' }}>SHIFT ALL DATES +1 MONTH</button>
            </div>
            
            <form onSubmit={editingEvent ? handleUpdateEvent : handleCreateEvent} className="glass-panel" style={{ padding: '2rem', marginBottom: '3rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }}>
                <h3 style={{ gridColumn: 'span 2', fontSize: '1rem' }}>{editingEvent ? 'Edit Event' : 'Create New Event'}</h3>
                <input className="form-control" value={editingEvent ? editingEvent.eventName : newEvent.eventName} onChange={e => editingEvent ? setEditingEvent({...editingEvent, eventName: e.target.value}) : setNewEvent({...newEvent, eventName: e.target.value})} placeholder="Event Name" required />
                <div style={{ gridColumn: 'span 1' }}>
                  <input className="form-control" value={editingEvent ? editingEvent.venue : newEvent.venue} onChange={e => editingEvent ? setEditingEvent({...editingEvent, venue: e.target.value}) : setNewEvent({...newEvent, venue: e.target.value})} placeholder="Venue" />
                  {(editingEvent?.venue || newEvent?.venue) && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.6rem', color: 'var(--primary)' }}>
                      <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(editingEvent ? editingEvent.venue : newEvent.venue)}`} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
                        👁️ Verify Venue Location ↗
                      </a>
                    </div>
                  )}
                </div>
                <input className="form-control" value={editingEvent ? editingEvent.department : newEvent.department} onChange={e => editingEvent ? setEditingEvent({...editingEvent, department: e.target.value}) : setNewEvent({...newEvent, department: e.target.value})} placeholder="Department" />
                <input type="number" className="form-control" value={editingEvent ? editingEvent.price : newEvent.price} onChange={e => editingEvent ? setEditingEvent({...editingEvent, price: parseFloat(e.target.value)}) : setNewEvent({...newEvent, price: parseFloat(e.target.value)})} placeholder="Price (₹)" />
                <input type="datetime-local" className="form-control" value={editingEvent ? editingEvent.dateTime : newEvent.dateTime} onChange={e => editingEvent ? setEditingEvent({...editingEvent, dateTime: e.target.value}) : setNewEvent({...newEvent, dateTime: e.target.value})} />
                <input type="number" className="form-control" value={editingEvent ? editingEvent.totalTickets : newEvent.totalTickets} onChange={e => editingEvent ? setEditingEvent({...editingEvent, totalTickets: parseInt(e.target.value)}) : setNewEvent({...newEvent, totalTickets: parseInt(e.target.value)})} placeholder="Total Capacity" />
                <textarea className="form-control" style={{ gridColumn: 'span 2', minHeight: '100px' }} value={editingEvent ? editingEvent.description : newEvent.description} onChange={e => editingEvent ? setEditingEvent({...editingEvent, description: e.target.value}) : setNewEvent({...newEvent, description: e.target.value})} placeholder="Event Description" required />
                <div style={{ gridColumn: 'span 2', display: 'flex', gap: '1rem' }}>
                    <button type="submit" className="btn-primary" style={{ flex: 1 }}>{editingEvent ? 'UPDATE ASSET' : 'DEPLOY EVENT'}</button>
                    {editingEvent && <button type="button" className="btn-elite" onClick={() => setEditingEvent(null)} style={{ flex: 1, background: 'transparent' }}>CANCEL</button>}
                </div>
            </form>

            <div style={{ display: 'grid', gap: '1rem' }}>
              {events.map(ev => (
                <div key={ev.id} className="glass-panel flex-stack-mobile" style={{ padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="mobile-text-center">
                    <div style={{ fontWeight: 900, fontSize: '1.1rem' }}>{ev.eventName}</div>
                    <div style={{ opacity: 0.5, fontSize: '0.75rem', marginTop: '0.3rem' }}>{ev.venue} • {new Date(ev.dateTime).toLocaleDateString()} • ₹{ev.price}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.8rem', width: '100%', justifyContent: 'center' }}>
                    <button className="btn-elite mobile-full-width" onClick={() => setEditingEvent(ev)} style={{ fontSize: '0.7rem', flex: 1 }}>EDIT</button>
                    <button className="btn-elite mobile-full-width" onClick={() => handleDeleteEvent(ev)} style={{ background: 'var(--accent)', border: 'none', fontSize: '0.7rem', flex: 1 }}>DELETE</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 👤 USERS */}
        {activeTab === 'participants' && (
          <div className="page-transition">
            <h2 className="gradient-text" style={{ marginBottom: '2.5rem' }}>Participant Registry</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ borderBottom: '1px solid var(--glass-border)', opacity: 0.5, fontSize: '0.7rem' }}>
                  <tr>
                    <th style={{ padding: '1rem' }}>NAME</th>
                    <th style={{ padding: '1rem' }}>EMAIL</th>
                    <th style={{ padding: '1rem' }}>DEPT</th>
                    <th style={{ padding: '1rem' }}>COINS</th>
                    <th style={{ padding: '1rem' }}>ROLE</th>
                    <th style={{ padding: '1rem' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '1.5rem 1rem', fontWeight: 800 }}>{u.name}</td>
                      <td style={{ padding: '1.5rem 1rem', opacity: 0.6 }}>{u.email}</td>
                      <td style={{ padding: '1.5rem 1rem' }}>{u.department}</td>
                      <td style={{ padding: '1.5rem 1rem', color: '#fbbf24', fontWeight: 900 }}>🪙 {u.coins || 0}</td>
                      <td style={{ padding: '1.5rem 1rem' }}><span style={{ fontSize: '0.6rem', padding: '0.3rem 0.6rem', borderRadius: '4px', background: u.role === 'ADMIN' ? 'var(--vivid-pink)' : 'var(--primary)' }}>{u.role}</span></td>
                      <td style={{ padding: '1.5rem 1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn-elite" onClick={() => handlePromote(u.id, u.role === 'ADMIN' ? 'USER' : 'ADMIN')} style={{ fontSize: '0.6rem', padding: '0.4rem 0.8rem' }}>{u.role === 'ADMIN' ? 'DEMOTE' : 'PROMOTE'}</button>
                            {u.role !== 'ADMIN' && <button className="btn-elite" onClick={() => handlePurgeUser(u)} style={{ background: 'var(--accent)', border: 'none', fontSize: '0.6rem', padding: '0.4rem 0.8rem' }}>PURGE</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 📖 BOOKINGS */}
        {activeTab === 'audit' && (
          <div className="page-transition">
            <h2 className="gradient-text" style={{ marginBottom: '2.5rem' }}>Transaction & Entry Ledger</h2>
            <div className="glass-panel" style={{ padding: '0.5rem', borderRadius: '24px', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ opacity: 0.5, fontSize: '0.65rem', fontWeight: 900, letterSpacing: '2px' }}>
                      <th style={{ padding: '1rem 1.5rem' }}>PASS ID</th>
                      <th style={{ padding: '1rem' }}>EVENT / PARTICIPANT</th>
                      <th style={{ padding: '1rem' }}>GATE STATUS</th>
                      <th style={{ padding: '1rem' }}>TICKET STATUS</th>
                      <th style={{ padding: '1rem', textAlign: 'right' }}>OPERATIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.slice().reverse().map(b => {
                      const s = (b.status || 'CONFIRMED').toUpperCase();
                      const rowColor = s === 'CANCELLED' ? 'rgba(244,63,94,0.05)' : s === 'ADMITTED' ? 'rgba(16,185,129,0.05)' : 'rgba(255,255,255,0.02)';
                      const borderColor = s === 'CANCELLED' ? 'rgba(244,63,94,0.2)' : s === 'ADMITTED' ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)';
                      
                        return (
                          <tr key={b.id} style={{ background: rowColor, border: `1px solid ${borderColor}`, transition: '0.3s' }}>
                            <td style={{ padding: '1.5rem', borderRadius: '15px 0 0 15px' }}>
                              <div style={{ fontWeight: 950, fontSize: '1.1rem', color: 'var(--primary-bright)' }}>TF-{b.id}</div>
                              <div style={{ fontSize: '0.6rem', opacity: 0.5, marginTop: '0.2rem' }}>AMT: ₹{b.totalAmount}</div>
                            </td>
                            <td style={{ padding: '1.5rem' }}>
                              <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{events.find(e => e.id.toString() === b.eventId?.toString())?.eventName || 'Nexus Event'}</div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                                <div style={{ fontSize: '0.8rem', opacity: 0.7, color: 'var(--primary)' }}>{users.find(u => u.id.toString() === b.userId?.toString())?.name || 'Participant'}</div>
                                <div style={{ fontSize: '0.6rem', padding: '0.1rem 0.4rem', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', opacity: 0.5 }}>{b.seatNumber || 'GENERAL'}</div>
                              </div>
                            </td>
                            <td style={{ padding: '1.5rem' }}>
                              <GateStatusBadge booking={b} />
                            </td>
                            <td style={{ padding: '1.5rem' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                <StatusBadge status={b.status} />
                                {b.refundStatus && b.status === 'CANCELLED' && (
                                  <span style={{ fontSize: '0.6rem', fontWeight: 900, color: b.refundStatus === 'REFUNDED' ? '#10b981' : '#fbbf24', opacity: 0.8 }}>
                                    {b.refundStatus === 'REFUNDED' ? '💰 REFUNDED' : '🕒 REFUND PENDING'}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td style={{ padding: '1.5rem', textAlign: 'right', borderRadius: '0 15px 15px 0' }}>
                              <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'flex-end', position: 'relative', zIndex: 1000, pointerEvents: 'auto' }}>
                                 {b.status === 'CONFIRMED' && (
                                   <>
                                     <button className="btn-elite" onClick={() => handleUpdateStatus(b, 'ADMITTED')} style={{ background: '#10b981', border: 'none', padding: '0.6rem 1.2rem', fontSize: '0.7rem', fontWeight: 900 }}>ADMIT</button>
                                     <button className="btn-elite" onClick={() => handleCancelRequest(b)} style={{ background: 'transparent', border: '2px solid var(--accent)', color: 'var(--accent)', padding: '0.6rem 1.2rem', fontSize: '0.7rem', fontWeight: 900 }}>CANCEL</button>
                                   </>
                                 )}
                                 {b.status === 'CANCELLED' && b.refundStatus !== 'REFUNDED' && (
                                   <button className="btn-elite" onClick={() => handleUpdateRefund(b, 'REFUNDED')} style={{ background: '#fbbf24', border: 'none', color: '#000', padding: '0.6rem 1.2rem', fontSize: '0.7rem', fontWeight: 900 }}>FINALIZE REFUND</button>
                                 )}
                                 {(b.status === 'ADMITTED' || b.refundStatus === 'REFUNDED') && (
                                   <div style={{ fontSize: '0.6rem', opacity: 0.3, fontWeight: 900, letterSpacing: '1px' }}>AUDIT LOCKED</div>
                                 )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 💰 REFUNDS */}
        {activeTab === 'refunds' && (
          <div className="page-transition">
            <h2 className="gradient-text" style={{ marginBottom: '2.5rem' }}>Refund Management</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ borderBottom: '1px solid var(--glass-border)', opacity: 0.5, fontSize: '0.7rem' }}>
                  <tr>
                    <th style={{ padding: '1rem' }}>PASS ID</th>
                    <th style={{ padding: '1rem' }}>EVENT</th>
                    <th style={{ padding: '1rem' }}>AMOUNT</th>
                    <th style={{ padding: '1rem' }}>REFUND STATUS</th>
                    <th style={{ padding: '1rem' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.filter(b => b.status === 'CANCELLED' || b.status === 'REFUNDED').map(b => (
                    <tr key={b.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '1.5rem 1rem', fontWeight: 900 }}>TF-{b.id}</td>
                      <td style={{ padding: '1.5rem 1rem' }}>{events.find(e => e.id === b.eventId)?.eventName}</td>
                      <td style={{ padding: '1.5rem 1rem', color: 'var(--accent)', fontWeight: 900 }}>₹{b.totalAmount}</td>
                      <td style={{ padding: '1.5rem 1rem' }}><RefundBadge status={b.refundStatus || 'REQUESTED'} /></td>
                      <td style={{ padding: '1.5rem 1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {b.refundStatus !== 'REFUNDED' && <button className="btn-elite" onClick={() => handleUpdateRefund(b, 'APPROVED')} style={{ background: 'var(--success)', border: 'none', fontSize: '0.6rem' }}>APPROVE</button>}
                          {b.refundStatus !== 'REFUNDED' && <button className="btn-elite" onClick={() => handleUpdateRefund(b, 'REJECTED')} style={{ background: 'var(--accent)', border: 'none', fontSize: '0.6rem' }}>REJECT</button>}
                          {b.refundStatus === 'APPROVED' && <button className="btn-elite" onClick={() => handleUpdateRefund(b, 'REFUNDED')} style={{ background: '#fbbf24', border: 'none', fontSize: '0.6rem', color: '#000' }}>MARK REFUNDED</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {isLoaded && !bookings.filter(b => b.status === 'CANCELLED' || b.status === 'REFUNDED').length && <div style={{ textAlign: 'center', opacity: 0.3, padding: '5rem' }}>No pending refund requests.</div>}
            </div>
          </div>
        )}

        {/* 🛂 SMART GATE CONTROL */}
        {activeTab === 'verify' && (
          <div className="page-transition">
            <GateControl />
          </div>
        )}

        {/* 💬 SUPPORT INTEL */}
        {activeTab === 'support' && (
          <div className="page-transition">
            {/* Global Broadcast Tool */}
            <div className="glass-panel" style={{ padding: '2.5rem', marginBottom: '3rem', background: 'rgba(236,72,153,0.05)', border: '1px solid rgba(236,72,153,0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div>
                        <h3 style={{ margin: 0, color: 'var(--secondary)' }}>📢 GLOBAL BROADCAST</h3>
                        <p style={{ margin: 0, opacity: 0.6, fontSize: '0.8rem' }}>Send real-time alerts to every registered participant.</p>
                    </div>
                    <button className="btn-elite" onClick={async () => {
                        const msg = document.getElementById('globalMsg').value;
                        if (!msg.trim()) return;
                        await api.user.post('/notifications/global', { message: `📢 ADMIN ALERT: ${msg}` });
                        showToast('Broadcast sent successfully!');
                        document.getElementById('globalMsg').value = '';
                    }} style={{ background: 'var(--secondary)', border: 'none', padding: '0.8rem 2rem' }}>SEND BROADCAST</button>
                </div>
                <textarea id="globalMsg" className="form-control" placeholder="Type your announcement here..." style={{ width: '100%', minHeight: '80px', background: 'rgba(0,0,0,0.2)' }}></textarea>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '3rem', minHeight: '500px' }}>
              <div style={{ borderRight: '1px solid var(--glass-border)', paddingRight: '2rem' }}>
                <h3 style={{ fontSize: '0.8rem', opacity: 0.5, letterSpacing: '1px', marginBottom: '1.5rem' }}>DIRECT THREADS</h3>
              {Object.keys(supportByUser || {}).map(uId => {
                const msgs = supportByUser[uId] || [];
                const sender = msgs[0]?.senderName || `User #${uId}`;
                return (
                  <div key={uId} onClick={() => setSelectedUserId(uId)} 
                    style={{ padding: '1.2rem', borderRadius: '12px', cursor: 'pointer', marginBottom: '0.8rem', background: selectedUserId === uId ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.02)', border: `1px solid ${selectedUserId === uId ? 'var(--primary)' : 'transparent'}`, transition: '0.2s' }}>
                    <div style={{ fontWeight: 900, fontSize: '0.85rem' }}>{sender}</div>
                    <div style={{ fontSize: '0.7rem', opacity: 0.4, marginTop: '0.3rem', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{msgs[msgs.length - 1]?.message}</div>
                  </div>
                );
              })}
            </div>
            
            {selectedUserId ? (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--glass-border)', fontWeight: 900, marginBottom: '2rem' }}>
                    Conversation with {supportByUser[selectedUserId]?.[0]?.senderName}
                </div>
                <div ref={chatScrollRef} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '400px', paddingRight: '1rem' }}>
                  {(supportByUser[selectedUserId] || []).map((m, i) => (
                    <div key={i} style={{ alignSelf: m.type === 'ADMIN' ? 'flex-end' : 'flex-start', background: m.type === 'ADMIN' ? 'var(--primary)' : 'rgba(255,255,255,0.06)', padding: '0.8rem 1.2rem', borderRadius: '14px', maxWidth: '80%', fontSize: '0.85rem' }}>
                      {m.message}
                      <div style={{ fontSize: '0.6rem', opacity: 0.4, marginTop: '0.3rem', textAlign: 'right' }}>{m.senderName}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                  <input className="form-control" value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Type reply..." onKeyPress={e => e.key === 'Enter' && handleReply()} />
                  <button className="btn-primary" onClick={handleReply} style={{ width: '100px' }}>REPLY</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.2 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem' }}>💬</div>
                  <div>SELECT A THREAD</div>
                </div>
              </div>
            )}
            </div>
          </div>
        )}

        {/* ⏳ WAITLIST HUB */}
        {activeTab === 'waitlist' && (
          <div className="page-transition">
            <h2 className="gradient-text" style={{ marginBottom: '2.5rem' }}>Waitlist Command Center</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ borderBottom: '1px solid var(--glass-border)', opacity: 0.5, fontSize: '0.7rem' }}>
                  <tr>
                    <th style={{ padding: '1rem' }}>POS</th>
                    <th style={{ padding: '1rem' }}>EVENT</th>
                    <th style={{ padding: '1rem' }}>USER</th>
                    <th style={{ padding: '1rem' }}>JOINED</th>
                    <th style={{ padding: '1rem' }}>STATUS</th>
                    <th style={{ padding: '1rem' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {(waitlistEntries || []).map(w => (
                    <tr key={w.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '1.2rem 1rem', fontWeight: 950, color: 'var(--primary)' }}>#{w.position}</td>
                      <td style={{ padding: '1.2rem 1rem' }}>{events.find(e => e.id.toString() === w.eventId.toString())?.eventName || 'System Event'}</td>
                      <td style={{ padding: '1.2rem 1rem' }}>{users.find(u => u.id.toString() === w.userId.toString())?.name || `User #${w.userId}`}</td>
                      <td style={{ padding: '1.2rem 1rem', opacity: 0.5 }}>{new Date(w.joinedAt).toLocaleString()}</td>
                      <td style={{ padding: '1.2rem 1rem' }}>
                         <span style={{ padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.6rem', background: w.status === 'WAITING' ? 'rgba(251,191,36,0.1)' : 'rgba(16,185,129,0.1)', color: w.status === 'WAITING' ? '#fbbf24' : '#10b981', fontWeight: 900 }}>{w.status}</span>
                      </td>
                      <td style={{ padding: '1.2rem 1rem' }}>
                        {w.status === 'WAITING' && (
                          <button className="btn-elite" onClick={async () => {
                            await api.booking.put(`/waitlist/${w.id}/confirm`);
                            showToast('User confirmed from waitlist!');
                            fetchAll();
                          }} style={{ background: 'var(--success)', border: 'none', fontSize: '0.6rem' }}>CONFIRM SLOT</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {isLoaded && !waitlistEntries.length && <div style={{ textAlign: 'center', opacity: 0.3, padding: '5rem' }}>No active waitlist queues.</div>}
            </div>
          </div>
        )}

        {/* 💳 TRANSACTION HISTORY */}
        {activeTab === 'transactions' && (
          <div className="page-transition">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <h2 className="gradient-text">Financial Intelligence</h2>
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                    <div className="glass-panel" style={{ padding: '1rem 2rem', border: '1px solid var(--success)', background: 'rgba(16,185,129,0.05)' }}>
                        <div style={{ fontSize: '0.6rem', opacity: 0.5, fontWeight: 900 }}>REALIZED REVENUE</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 950, color: '#10b981' }}>₹{bookings.filter(b => ['CONFIRMED', 'ADMITTED'].includes(b.status)).reduce((s, b) => s + (b.totalAmount || 0), 0).toLocaleString()}</div>
                    </div>
                    <div className="glass-panel" style={{ padding: '1rem 2rem', border: '1px solid #fbbf24', background: 'rgba(251,191,36,0.05)' }}>
                        <div style={{ fontSize: '0.6rem', opacity: 0.5, fontWeight: 900 }}>PENDING REFUNDS</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 950, color: '#fbbf24' }}>₹{bookings.filter(b => b.status === 'CANCELLED' && b.refundStatus !== 'REFUNDED').reduce((s, b) => s + (b.totalAmount || 0), 0).toLocaleString()}</div>
                    </div>
                    <div className="glass-panel" style={{ padding: '1rem 2rem', border: '1px solid var(--accent)', background: 'rgba(244,63,94,0.05)' }}>
                        <div style={{ fontSize: '0.6rem', opacity: 0.5, fontWeight: 900 }}>VOIDED CAPITAL</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 950, color: 'var(--accent)' }}>₹{bookings.filter(b => b.status === 'REFUNDED' || b.status === 'VOID').reduce((s, b) => s + (b.totalAmount || 0), 0).toLocaleString()}</div>
                    </div>
                </div>
            </div>

            <div className="glass-panel" style={{ padding: '2rem' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead style={{ borderBottom: '1px solid var(--glass-border)', opacity: 0.5, fontSize: '0.7rem' }}>
                    <tr>
                      <th style={{ padding: '1rem' }}>TXN ID</th>
                      <th style={{ padding: '1rem' }}>PARTICIPANT</th>
                      <th style={{ padding: '1rem' }}>AMOUNT</th>
                      <th style={{ padding: '1rem' }}>REVENUE STATUS</th>
                      <th style={{ padding: '1rem' }}>EVENT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.slice().reverse().map(b => (
                      <tr key={b.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '1.2rem 1rem', fontFamily: 'monospace', opacity: 0.8 }}>TXN-{b.id}</td>
                        <td style={{ padding: '1.2rem 1rem' }}>
                          <div style={{ fontWeight: 800 }}>{users.find(u => u.id.toString() === b.userId.toString())?.name || `User #${b.userId}`}</div>
                          <div style={{ fontSize: '0.65rem', opacity: 0.4 }}>{users.find(u => u.id.toString() === b.userId.toString())?.email}</div>
                        </td>
                        <td style={{ padding: '1.2rem 1rem', fontWeight: 950, color: (b.status === 'CONFIRMED' || b.status === 'ADMITTED') ? '#10b981' : '#f43f5e' }}>
                          ₹{b.totalAmount || 0}
                        </td>
                        <td style={{ padding: '1.2rem 1rem' }}>
                          <span style={{ 
                            padding: '0.3rem 0.8rem', borderRadius: '4px', fontSize: '0.6rem', fontWeight: 900,
                            background: (b.status === 'CONFIRMED' || b.status === 'ADMITTED') ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)',
                            color: (b.status === 'CONFIRMED' || b.status === 'ADMITTED') ? '#10b981' : '#f43f5e'
                          }}>
                            {(b.status === 'CONFIRMED' || b.status === 'ADMITTED') ? 'REALIZED' : 'VOID'}
                          </span>
                        </td>
                        <td style={{ padding: '1.2rem 1rem', opacity: 0.6, fontSize: '0.8rem' }}>{events.find(e => e.id.toString() === b.eventId.toString())?.eventName || 'System Event'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {isLoaded && !bookings.length && <div style={{ textAlign: 'center', opacity: 0.3, padding: '5rem' }}>No financial records available.</div>}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;
