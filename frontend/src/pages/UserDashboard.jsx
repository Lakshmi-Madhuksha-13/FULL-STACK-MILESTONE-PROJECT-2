import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

/* ─── MODAL COMPONENT ─────────────────────────────────── */
const Modal = ({ show, title, message, onConfirm, onCancel, confirmLabel = 'CONFIRM', confirmColor = 'var(--accent)' }) => {
  if (!show) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-panel bounce-in" style={{ maxWidth: '450px', width: '90%', padding: '3rem', textAlign: 'center', border: '1px solid var(--glass-border)' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>⚠️</div>
        <h3 style={{ marginBottom: '1rem', color: 'var(--text-main)' }}>{title}</h3>
        <p style={{ color: 'var(--text-dim)', marginBottom: '2.5rem', lineHeight: '1.6' }}>{message}</p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button className="btn-elite" onClick={onCancel} style={{ padding: '0.8rem 2rem' }}>CANCEL</button>
          <button className="btn-elite" onClick={onConfirm} style={{ background: confirmColor, border: 'none', padding: '0.8rem 2rem', fontWeight: 900 }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
};

/* ─── CHAT SUPPORT PANEL (Embedded in Dashboard) ────────── */
const ChatPanel = ({ user }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef();

  useEffect(() => {
    if (!user) return;
    fetchMessages();
    const interval = setInterval(fetchMessages, 4000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const res = await api.support.get(`/history/${user.id}`);
      setMessages(Array.isArray(res.data) ? res.data : []);
    } catch (e) {}
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    await api.support.post('/send', { userId: user.id, senderName: user.name, message: input, type: 'USER' });
    setInput('');
    fetchMessages();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '520px', background: 'rgba(0,0,0,0.2)', borderRadius: '1.5rem', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
      {/* Header */}
      <div style={{ padding: '1.2rem 1.5rem', background: 'rgba(139,92,246,0.1)', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
        <div style={{ width: '8px', height: '8px', background: 'var(--success)', borderRadius: '50%', boxShadow: '0 0 8px var(--success)', animation: 'pulse 2s infinite' }}></div>
        <div><strong style={{ fontSize: '0.85rem' }}>LIVE SUPPORT HUB</strong><br /><small style={{ opacity: 0.4, fontSize: '0.6rem', letterSpacing: '1px' }}>MANAGEMENT RESPONSE ACTIVE</small></div>
      </div>
      {/* Messages */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ textAlign: 'center', fontSize: '0.65rem', opacity: 0.3, letterSpacing: '1px', marginBottom: '0.5rem' }}>SESSION OPENED. MANAGEMENT WILL RESPOND SHORTLY.</div>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', opacity: 0.2, marginTop: '4rem', fontSize: '0.85rem' }}>No messages yet. Send your first inquiry below.</div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{
            alignSelf: m.type === 'USER' ? 'flex-end' : 'flex-start',
            background: m.type === 'USER' ? 'var(--primary)' : 'rgba(255,255,255,0.06)',
            padding: '0.8rem 1.1rem', borderRadius: '14px', maxWidth: '78%', fontSize: '0.85rem', lineHeight: '1.4',
            borderBottomRightRadius: m.type === 'USER' ? '2px' : '14px',
            borderBottomLeftRadius: m.type === 'USER' ? '14px' : '2px',
            border: m.type !== 'USER' ? '1px solid var(--glass-border)' : 'none'
          }}>
            {m.message}
            <div style={{ fontSize: '0.6rem', opacity: 0.4, marginTop: '0.3rem', fontWeight: 'bold' }}>{m.type === 'USER' ? 'You' : '🛡️ Management'}</div>
          </div>
        ))}
      </div>
      {/* Input */}
      <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', display: 'flex', gap: '0.8rem' }}>
        <input
          type="text" placeholder="Type your inquiry..."
          value={input} onChange={e => setInput(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleSend()}
          style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'white', padding: '0.7rem 1rem', fontSize: '0.85rem', outline: 'none' }}
        />
        <button onClick={handleSend} style={{ width: '45px', height: '45px', background: 'var(--primary)', border: 'none', borderRadius: '10px', color: 'white', cursor: 'pointer', fontSize: '1rem', transition: '0.3s' }}>➔</button>
      </div>
    </div>
  );
};

/* ─── STATUS BADGE ──────────────────────────────────────── */
const StatusBadge = ({ status }) => {
  const styles = {
    CONFIRMED: { bg: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid #10b981', label: '✅ CONFIRMED' },
    CANCELLED: { bg: 'rgba(244,63,94,0.1)', color: '#f43f5e', border: '1px solid #f43f5e', label: '🚫 CANCELLED' },
    REFUNDED:  { bg: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: '1px solid #fbbf24', label: '💰 REFUNDED' },
  };
  const s = styles[status] || styles.CONFIRMED;
  return <span style={{ ...s, padding: '0.3rem 0.9rem', borderRadius: '2rem', fontSize: '0.65rem', fontWeight: 900, letterSpacing: '1px' }}>{s.label}</span>;
};

/* ─── MAIN USER DASHBOARD ──────────────────────────────── */
const UserDashboard = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState('bookings');
  const [countdown, setCountdown] = useState({ text: 'Establishing Link...', target: null });
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [modal, setModal] = useState({ show: false, title: '', message: '', onConfirm: null });

  const user = (() => {
    try { const s = localStorage.getItem('currentUser'); return s && s !== 'undefined' ? JSON.parse(s) : null; } catch { return null; }
  })();

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  const showModal = (title, message, onConfirm) => setModal({ show: true, title, message, onConfirm });
  const closeModal = () => setModal({ show: false, title: '', message: '', onConfirm: null });

  const fetchAllData = useCallback(async () => {
    if (!user) return;
    try {
      const [bRes, eRes, nRes] = await Promise.all([
        api.booking.get(`/user/${user.id}`),
        api.event.get(''),
        api.user.get(`/${user.id}/notifications`)
      ]);
      setBookings(Array.isArray(bRes.data) ? bRes.data : []);
      setAllEvents(Array.isArray(eRes.data) ? eRes.data : []);
      setNotifications(Array.isArray(nRes.data) ? nRes.data : []);
      setIsDataLoaded(true);
    } catch (e) { console.warn('Sync active...'); }
  }, [user?.id]);

  useEffect(() => {
    if (user) { fetchAllData(); const i = setInterval(fetchAllData, 7000); return () => clearInterval(i); }
  }, [fetchAllData]);

  useEffect(() => {
    const t = setInterval(() => {
      const active = bookings.filter(b => b.status !== 'CANCELLED').map(b => {
        const ev = allEvents.find(e => e.id === b.eventId);
        if (!ev?.dateTime) return null;
        const d = new Date(ev.dateTime);
        return isNaN(d) || d < new Date() ? null : { date: d, name: ev.eventName };
      }).filter(Boolean);
      if (!active.length) { setCountdown({ text: 'No Upcoming Events', target: null }); return; }
      const closest = active.sort((a, b) => a.date - b.date)[0];
      const diff = closest.date - new Date();
      const d = Math.floor(diff / 86400000), h = Math.floor((diff / 3600000) % 24), m = Math.floor((diff / 60000) % 60), s = Math.floor((diff / 1000) % 60);
      setCountdown({ text: `${d}d ${h}h ${m}m ${s}s`, target: closest.name });
    }, 1000);
    return () => clearInterval(t);
  }, [bookings, allEvents]);

  const handleCancelBooking = (b) => {
    const evName = allEvents.find(e => e.id === b.eventId)?.eventName || `#${b.eventId}`;
    showModal(
      'Cancel & Request Refund?',
      `This will permanently cancel your entry pass for "${evName}" (TF-${b.id}) and initiate a refund request. This cannot be undone.`,
      async () => {
        closeModal();
        try {
          await api.booking.delete(`/${b.id}`);
          showToast('Entry pass cancelled. Refund request has been logged.', 'success');
          fetchAllData();
        } catch { showToast('Cancellation failed. Contact support.', 'error'); }
      }
    );
  };

  const cancelledBookings = bookings.filter(b => b.status === 'CANCELLED');
  const activeBookings = bookings.filter(b => b.status !== 'CANCELLED');

  if (!user) return (
    <div className="app-container" style={{ textAlign: 'center', padding: '10rem' }}>
      <h2>Access Denied</h2>
      <button className="btn-primary" onClick={() => navigate('/login')}>Return to Login</button>
    </div>
  );

  return (
    <div className="app-container page-transition" style={{ minHeight: '100vh' }}>
      {/* ── MODAL ── */}
      <Modal show={modal.show} title={modal.title} message={modal.message} onConfirm={modal.onConfirm} onCancel={closeModal} confirmLabel="YES, CANCEL" />

      {/* ── TOAST ── */}
      {toast.show && (
        <div className="bounce-in" style={{ position: 'fixed', top: '100px', left: '50%', transform: 'translateX(-50%)', zIndex: 5000, padding: '1rem 2.5rem', background: toast.type === 'error' ? 'var(--accent)' : 'var(--primary)', borderRadius: '2rem', boxShadow: '0 0 30px var(--primary-bright)', fontWeight: 900, whiteSpace: 'nowrap' }}>
          {toast.message}
        </div>
      )}

      {/* ── COUNTDOWN HEADER ── */}
      <div className="glass-panel" style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))', padding: '2.5rem', marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '0.7rem', opacity: 0.8, fontWeight: 900, letterSpacing: '2px', marginBottom: '0.5rem' }}>{countdown.target || 'SYNCING SCHEDULE'}</div>
          <div style={{ fontSize: '2.8rem', fontWeight: 950, letterSpacing: '-1px' }}>{countdown.text}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.65rem', opacity: 0.6, letterSpacing: '2px' }}>PARTICIPANT</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 900 }}>{user.name}</div>
        </div>
      </div>

      {/* ── TABS ── */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '3rem', flexWrap: 'wrap' }}>
        {[['bookings', 'Ticket Inventory'], ['refunds', 'Refund Tracker'], ['notifications', 'Inbox'], ['support', 'Live Support']].map(([id, label]) => (
          <button key={id} onClick={() => setActiveTab(id)}
            style={{ background: activeTab === id ? 'var(--primary)' : 'transparent', border: `1px solid ${activeTab === id ? 'var(--primary-bright)' : 'var(--glass-border)'}`, boxShadow: activeTab === id ? '0 0 25px var(--primary-bright)' : 'none', color: 'white', padding: '0.8rem 2rem', borderRadius: '12px', cursor: 'pointer', fontWeight: 900, fontSize: '0.8rem', transition: '0.3s' }}>
            {label}
          </button>
        ))}
      </div>

      <div className="glass-panel" style={{ minHeight: '550px', padding: '3rem' }}>

        {/* ── TICKET INVENTORY ── */}
        {activeTab === 'bookings' && (
          <div className="page-transition">
            <h2 className="gradient-text" style={{ marginBottom: '2rem' }}>Active Credentials</h2>
            {activeBookings.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                {activeBookings.map(b => {
                  const ev = allEvents.find(e => e.id === b.eventId);
                  return (
                    <div key={b.id} className="glass-panel" style={{ padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                      <div>
                        <div style={{ fontWeight: 900, fontSize: '1.2rem', color: 'var(--primary)' }}>{ev?.eventName || `Event #${b.eventId}`}</div>
                        <div style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: '0.4rem' }}>TF-{b.id} • {ev?.venue || 'Venue TBD'} • ₹{b.totalAmount}</div>
                        <div style={{ marginTop: '0.8rem' }}><StatusBadge status={b.status || 'CONFIRMED'} /></div>
                      </div>
                      <button className="btn-elite" onClick={() => handleCancelBooking(b)}
                        style={{ background: 'var(--accent)', border: 'none', padding: '0.6rem 1.5rem', fontSize: '0.75rem' }}>
                        CANCEL & REFUND
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : isDataLoaded ? (
              <div style={{ textAlign: 'center', opacity: 0.3, padding: '5rem' }}>No active credentials. <span style={{ color: 'var(--primary)', cursor: 'pointer' }} onClick={() => navigate('/events')}>Browse Events →</span></div>
            ) : <div style={{ opacity: 0.3, padding: '3rem' }}>Syncing Credential Vault...</div>}
          </div>
        )}

        {/* ── REFUND TRACKER ── */}
        {activeTab === 'refunds' && (
          <div className="page-transition">
            <h2 className="gradient-text" style={{ marginBottom: '0.5rem' }}>Refund & Cancellation Ledger</h2>
            <p style={{ color: 'var(--text-dim)', marginBottom: '2.5rem', fontSize: '0.85rem' }}>Track status of all cancelled entry passes and refund requests.</p>
            {cancelledBookings.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                {cancelledBookings.map(b => {
                  const ev = allEvents.find(e => e.id === b.eventId);
                  return (
                    <div key={b.id} className="glass-panel" style={{ padding: '2rem', background: 'rgba(244,63,94,0.03)', borderLeft: '4px solid var(--accent)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 900, fontSize: '1.1rem', marginBottom: '0.4rem' }}>{ev?.eventName || `Event #${b.eventId}`}</div>
                          <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>TF-{b.id} • ₹{b.totalAmount} • {b.ticketsBooked} slot(s)</div>
                        </div>
                        <StatusBadge status={b.status || 'CANCELLED'} />
                      </div>
                      <div className="glass-panel" style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(251,191,36,0.05)', border: '1px dashed rgba(251,191,36,0.3)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', fontSize: '0.8rem' }}>
                          <span style={{ fontSize: '1.2rem' }}>💰</span>
                          <div>
                            <div style={{ fontWeight: 900, color: '#fbbf24' }}>REFUND STATUS: PROCESSING</div>
                            <div style={{ opacity: 0.5, fontSize: '0.7rem', marginTop: '0.2rem' }}>Refund of ₹{b.totalAmount} will be credited within 5–7 business days. Contact support for escalation.</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', opacity: 0.3, padding: '5rem' }}>No cancelled bookings found. All your credentials are active.</div>
            )}
          </div>
        )}

        {/* ── INBOX ── */}
        {activeTab === 'notifications' && (
          <div className="page-transition">
            <h2 className="gradient-text" style={{ marginBottom: '2rem' }}>System Inbox</h2>
            {notifications.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {notifications.map(n => (
                  <div key={n.id} className="glass-panel" style={{ padding: '1.5rem', borderLeft: n.read ? 'none' : '4px solid var(--vivid-pink)', background: n.read ? 'transparent' : 'rgba(139,92,246,0.04)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', opacity: 0.4, marginBottom: '0.6rem' }}>
                      <span>#{n.id}</span><span>{new Date(n.timestamp).toLocaleString()}</span>
                    </div>
                    <div style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>{n.message}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', opacity: 0.3, padding: '5rem' }}>Inbox is clear. No official correspondence.</div>
            )}
          </div>
        )}

        {/* ── LIVE SUPPORT ── */}
        {activeTab === 'support' && (
          <div className="page-transition">
            <h2 className="gradient-text" style={{ marginBottom: '0.5rem' }}>Live Support Hub</h2>
            <p style={{ color: 'var(--text-dim)', marginBottom: '2rem', fontSize: '0.85rem' }}>Connect directly with festival management. Use this for refund escalations, booking issues, or official inquiries.</p>
            <ChatPanel user={user} />
          </div>
        )}
      </div>

      <style>{`@keyframes pulse { 0%,100% { opacity:0.4; } 50% { opacity:1; } }`}</style>
    </div>
  );
};

export default UserDashboard;
