import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import TicketModal from '../components/TicketModal';
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';

/* ─── IN-APP MODAL ─────────────────────────────────────── */
const Modal = ({ show, title, message, onConfirm, onCancel, confirmLabel = 'CONFIRM' }) => {
  if (!show) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-panel bounce-in" style={{ maxWidth: '450px', width: '90%', padding: '3rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1.2rem' }}>⚠️</div>
        <h3 style={{ marginBottom: '0.8rem' }}>{title}</h3>
        <p style={{ color: 'var(--text-dim)', marginBottom: '2.5rem', lineHeight: 1.6 }}>{message}</p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button className="btn-elite" onClick={onCancel} style={{ padding: '0.8rem 2rem', background: 'transparent', border: '1px solid var(--glass-border)' }}>GO BACK</button>
          <button className="btn-elite" onClick={onConfirm} style={{ background: 'var(--accent)', border: 'none', padding: '0.8rem 2rem', fontWeight: 900 }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
};

/* ─── STATUS BADGE ─────────────────────────────────────── */
const StatusBadge = ({ status }) => {
  const map = {
    CONFIRMED: { bg: 'rgba(16,185,129,0.12)', color: '#10b981', border: '#10b981', label: '✅ CONFIRMED' },
    CANCELLED: { bg: 'rgba(244,63,94,0.12)', color: '#f43f5e', border: '#f43f5e', label: '🚫 CANCELLED' },
    REFUNDED:  { bg: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: '#fbbf24', label: '💰 REFUNDED' },
  };
  const s = map[status] || map.CONFIRMED;
  return (
    <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, padding: '0.3rem 0.9rem', borderRadius: '2rem', fontSize: '0.65rem', fontWeight: 900, letterSpacing: '1px' }}>
      {s.label}
    </span>
  );
};

/* ─── CHAT PANEL ───────────────────────────────────────── */
const ChatPanel = ({ user }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef();

  useEffect(() => {
    if (!user) return;
    const fetch = async () => { try { const r = await api.support.get(`/history/${user.id}`); setMessages(Array.isArray(r.data) ? r.data : []); } catch { } };
    fetch();
    const i = setInterval(fetch, 4000);
    return () => clearInterval(i);
  }, [user]);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  const send = async () => {
    if (!input.trim()) return;
    await api.support.post('/send', { userId: user.id, senderName: user.name, message: input, type: 'USER' });
    setInput('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '500px', background: 'rgba(0,0,0,0.2)', borderRadius: '1.5rem', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
      <div style={{ padding: '1.2rem 1.5rem', background: 'rgba(139,92,246,0.1)', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
        <div style={{ width: '8px', height: '8px', background: 'var(--success)', borderRadius: '50%', boxShadow: '0 0 8px var(--success)' }} />
        <div><strong style={{ fontSize: '0.85rem' }}>LIVE SUPPORT HUB</strong><br /><small style={{ opacity: 0.4, fontSize: '0.6rem', letterSpacing: '1px' }}>MANAGEMENT ONLINE</small></div>
      </div>
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {messages.length === 0 && <div style={{ textAlign: 'center', opacity: 0.2, marginTop: '4rem', fontSize: '0.85rem' }}>Send your first inquiry below.</div>}
        {messages.map((m, i) => (
          <div key={i} style={{ alignSelf: m.type === 'USER' ? 'flex-end' : 'flex-start', background: m.type === 'USER' ? 'var(--primary)' : 'rgba(255,255,255,0.06)', padding: '0.8rem 1.1rem', borderRadius: '14px', maxWidth: '78%', fontSize: '0.85rem', border: m.type !== 'USER' ? '1px solid var(--glass-border)' : 'none', borderBottomRightRadius: m.type === 'USER' ? '2px' : '14px', borderBottomLeftRadius: m.type === 'USER' ? '14px' : '2px' }}>
            {m.message}
            <div style={{ fontSize: '0.6rem', opacity: 0.4, marginTop: '0.3rem', fontWeight: 'bold' }}>{m.type === 'USER' ? 'You' : '🛡️ Management'}</div>
          </div>
        ))}
      </div>
      <div style={{ padding: '1rem', display: 'flex', gap: '0.8rem', background: 'rgba(0,0,0,0.2)' }}>
        <input type="text" placeholder="Type your inquiry..." value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && send()}
          style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'white', padding: '0.7rem 1rem', fontSize: '0.85rem', outline: 'none' }} />
        <button onClick={send} style={{ width: '45px', height: '45px', background: 'var(--primary)', border: 'none', borderRadius: '10px', color: 'white', cursor: 'pointer' }}>➔</button>
      </div>
    </div>
  );
};

/* ─── MAIN DASHBOARD ───────────────────────────────────── */
const UserDashboard = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState('bookings');
  const [countdown, setCountdown] = useState({ text: 'Syncing...', target: null });
  const [toast, setToast] = useState({ show: false, message: '', ok: true });
  const [modal, setModal] = useState({ show: false });
  const [ticketView, setTicketView] = useState(null); // { booking, event }

  const user = (() => { try { const s = localStorage.getItem('currentUser'); return s && s !== 'undefined' ? JSON.parse(s) : null; } catch { return null; } })();

  const showToast = (message, ok = true) => { setToast({ show: true, message, ok }); setTimeout(() => setToast({ show: false }), 4000); };
  const showModal = (title, message, onConfirm) => setModal({ show: true, title, message, onConfirm });
  const closeModal = () => setModal({ show: false });

  const fetchAll = useCallback(async () => {
    if (!user) return;
    try {
      const [bRes, eRes, nRes] = await Promise.all([
        api.booking.get(`/user/${user.id}`),
        api.event.get(''),
        api.user.get(`/${user.id}/notifications`).catch(() => ({ data: [] })),
      ]);
      setBookings(Array.isArray(bRes.data) ? bRes.data : []);
      setAllEvents(Array.isArray(eRes.data) ? eRes.data : []);
      setNotifications(Array.isArray(nRes.data) ? nRes.data : []);
      setIsLoaded(true);
    } catch { }
  }, [user?.id]);

  useEffect(() => {
    if (user) { 
      fetchAll();
      // Setup WebSocket
      const socket = new SockJS('http://localhost:8081/ws-stomp'); // Connect to User Service directly
      const stompClient = Stomp.over(socket);
      stompClient.debug = () => {}; // Disable debug logs
      stompClient.connect({}, (frame) => {
        stompClient.subscribe(`/topic/notifications/${user.id}`, (msg) => {
          if (msg.body) {
            const newNotif = JSON.parse(msg.body);
            setNotifications(prev => [newNotif, ...prev]);
            showToast(`🔔 ${newNotif.message}`);
          }
        });
      });

      const i = setInterval(fetchAll, 7000); 
      return () => { clearInterval(i); if (stompClient) stompClient.disconnect(); }; 
    } 
  }, [fetchAll]);

  useEffect(() => {
    const t = setInterval(() => {
      const upcoming = bookings.filter(b => b.status !== 'CANCELLED').map(b => {
        const ev = allEvents.find(e => e.id === b.eventId);
        if (!ev?.dateTime) return null;
        const d = new Date(ev.dateTime);
        return isNaN(d) || d < new Date() ? null : { date: d, name: ev.eventName };
      }).filter(Boolean).sort((a, b) => a.date - b.date);

      if (!upcoming.length) { setCountdown({ text: 'No Upcoming Events', target: null }); return; }
      const diff = upcoming[0].date - new Date();
      const d = Math.floor(diff/86400000), h = Math.floor((diff/3600000)%24), m = Math.floor((diff/60000)%60), s = Math.floor((diff/1000)%60);
      setCountdown({ text: `${d}d ${h}h ${m}m ${s}s`, target: upcoming[0].name });
    }, 1000);
    return () => clearInterval(t);
  }, [bookings, allEvents]);

  const handleCancelBooking = (b) => {
    const evName = allEvents.find(e => e.id === b.eventId)?.eventName || `Event #${b.eventId}`;
    showModal('Cancel & Request Refund?', `Cancel your entry pass for "${evName}" (TF-${b.id}) and initiate a refund? This cannot be undone.`, async () => {
      closeModal();
      try {
        await api.booking.delete(`/${b.id}`);
        // Optimistic UI update — immediately mark as CANCELLED
        setBookings(prev => prev.map(bk => bk.id === b.id ? { ...bk, status: 'CANCELLED' } : bk));
        showToast('Pass cancelled. Refund initiated.');
      } catch { showToast('Cancellation failed. Contact support.', false); }
    });
  };

  const generateCertificate = (user, event) => {
    import('jspdf').then(jspdf => {
      const doc = new jspdf.jsPDF('landscape');
      doc.setFillColor(11, 14, 23);
      doc.rect(0, 0, 297, 210, 'F');
      
      doc.setDrawColor(139, 92, 246);
      doc.setLineWidth(2);
      doc.rect(10, 10, 277, 190);
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(36);
      doc.text("CERTIFICATE OF PARTICIPATION", 148, 60, null, null, "center");
      
      doc.setFontSize(14);
      doc.setTextColor(150, 150, 150);
      doc.text("THIS PROUDLY CERTIFIES THAT", 148, 90, null, null, "center");
      
      doc.setFontSize(28);
      doc.setTextColor(255, 255, 255);
      doc.text(user.name.toUpperCase(), 148, 110, null, null, "center");
      
      doc.setFontSize(14);
      doc.setTextColor(150, 150, 150);
      doc.text(`Has successfully participated in the event:`, 148, 140, null, null, "center");
      
      doc.setFontSize(24);
      doc.setTextColor(139, 92, 246);
      doc.text(event.eventName, 148, 160, null, null, "center");
      
      doc.save(`${event.eventName.replace(/\s+/g,'_')}_Certificate.pdf`);
    });
  };

  const activeBookings    = bookings.filter(b => b.status !== 'CANCELLED' && b.status !== 'REFUNDED');
  const cancelledBookings = bookings.filter(b => b.status === 'CANCELLED' || b.status === 'REFUNDED');

  if (!user) return (
    <div className="app-container" style={{ textAlign: 'center', padding: '10rem' }}>
      <h2>Access Denied</h2>
      <button className="btn-primary" onClick={() => navigate('/login')} style={{ marginTop: '2rem' }}>Go to Login</button>
    </div>
  );

  const TABS = [['bookings','Ticket Inventory'], ['refunds','Refund Tracker'], ['notifications','Inbox'], ['support','Live Support']];

  return (
    <div className="app-container page-transition" style={{ minHeight: '100vh' }}>
      <Modal {...modal} onCancel={closeModal} confirmLabel="YES, CANCEL" />

      {/* Ticket Viewer */}
      {ticketView && (
        <TicketModal booking={ticketView.booking} event={ticketView.event} user={user} onClose={() => setTicketView(null)} />
      )}

      {/* Toast */}
      {toast.show && (
        <div className="bounce-in" style={{ position: 'fixed', top: '100px', left: '50%', transform: 'translateX(-50%)', zIndex: 5000, padding: '1rem 2.5rem', background: toast.ok ? 'var(--primary)' : 'var(--accent)', borderRadius: '2rem', fontWeight: 900, whiteSpace: 'nowrap', boxShadow: '0 0 30px var(--primary-bright)' }}>
          {toast.message}
        </div>
      )}

      {/* Countdown Header */}
      <div className="glass-panel" style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))', padding: '2.5rem', marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '0.65rem', opacity: 0.8, fontWeight: 900, letterSpacing: '2px', marginBottom: '0.4rem' }}>{countdown.target || 'NEXT EVENT COUNTDOWN'}</div>
          <div style={{ fontSize: '2.8rem', fontWeight: 950, letterSpacing: '-1px' }}>{countdown.text}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.6rem', opacity: 0.6, letterSpacing: '2px' }}>PARTICIPANT</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 900 }}>{user.name}</div>
          <div style={{ fontSize: '0.7rem', opacity: 0.5, marginTop: '0.2rem' }}>{user.email}</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '3rem', flexWrap: 'wrap' }}>
        {TABS.map(([id, label]) => (
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
                    <div key={b.id} className="glass-panel" style={{ padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', flexWrap: 'wrap', gap: '1rem' }}>
                      <div>
                        <div style={{ fontWeight: 900, fontSize: '1.15rem', color: 'var(--primary)' }}>{ev?.eventName || `Event #${b.eventId}`}</div>
                        <div style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: '0.3rem' }}>TF-{b.id} • {ev?.venue || 'Venue TBD'} • ₹{b.totalAmount}</div>
                        <div style={{ marginTop: '0.8rem' }}><StatusBadge status={b.status || 'CONFIRMED'} /></div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                        {ev?.dateTime && new Date(ev.dateTime) < new Date() ? (
                          <button className="btn-elite" onClick={() => generateCertificate(user, ev)}
                            style={{ fontSize: '0.75rem', padding: '0.6rem 1.4rem', background: '#fbbf24', border: 'none', color: 'black' }}>
                            🏆 CLAIM CERTIFICATE
                          </button>
                        ) : (
                          <>
                            <button className="btn-elite" onClick={() => ev && setTicketView({ booking: b, event: ev })}
                              style={{ fontSize: '0.75rem', padding: '0.6rem 1.4rem', background: 'rgba(139,92,246,0.15)', border: '1px solid var(--primary)' }}>
                              🎟 VIEW PASS
                            </button>
                            <button className="btn-elite" onClick={() => handleCancelBooking(b)}
                              style={{ background: 'var(--accent)', border: 'none', fontSize: '0.75rem', padding: '0.6rem 1.4rem' }}>
                              CANCEL
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : isLoaded ? (
              <div style={{ textAlign: 'center', opacity: 0.3, padding: '5rem' }}>
                No active credentials. <span style={{ color: 'var(--primary)', cursor: 'pointer' }} onClick={() => navigate('/events')}>Browse Events →</span>
              </div>
            ) : <div style={{ opacity: 0.3, padding: '3rem', textAlign: 'center' }}>Syncing Credential Vault...</div>}
          </div>
        )}

        {/* ── REFUND TRACKER ── */}
        {activeTab === 'refunds' && (
          <div className="page-transition">
            <h2 className="gradient-text" style={{ marginBottom: '0.5rem' }}>Refund & Cancellation Ledger</h2>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginBottom: '2.5rem' }}>Track status of all cancelled entry passes and refund requests.</p>
            {cancelledBookings.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                {cancelledBookings.map(b => {
                  const ev = allEvents.find(e => e.id === b.eventId);
                  return (
                    <div key={b.id} className="glass-panel" style={{ padding: '2rem', background: 'rgba(244,63,94,0.03)', borderLeft: '4px solid var(--accent)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                          <div style={{ fontWeight: 900, fontSize: '1.1rem', marginBottom: '0.3rem' }}>{ev?.eventName || `Event #${b.eventId}`}</div>
                          <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>TF-{b.id} • ₹{b.totalAmount} • {b.ticketsBooked} slot(s)</div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                          <StatusBadge status={b.status || 'CANCELLED'} />
                          <button className="btn-elite" onClick={() => ev && setTicketView({ booking: b, event: ev })}
                            style={{ fontSize: '0.7rem', padding: '0.5rem 1.2rem', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)' }}>
                            VIEW VOIDED PASS
                          </button>
                        </div>
                      </div>
                      <div style={{ marginTop: '1.5rem', padding: '1rem 1.2rem', background: 'rgba(251,191,36,0.05)', border: '1px dashed rgba(251,191,36,0.3)', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontSize: '1.5rem' }}>💰</span>
                        <div>
                          <div style={{ fontWeight: 900, color: '#fbbf24', fontSize: '0.85rem' }}>REFUND STATUS: {b.status === 'REFUNDED' ? 'COMPLETED' : 'PROCESSING'}</div>
                          <div style={{ opacity: 0.5, fontSize: '0.72rem', marginTop: '0.2rem' }}>
                            {b.status === 'REFUNDED' ? `₹${b.totalAmount} has been credited to your account.` : `Refund of ₹${b.totalAmount} will be credited within 5–7 business days.`}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', opacity: 0.3, padding: '5rem' }}>No cancelled bookings. All your credentials are active.</div>
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
                    <div style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>{n.message}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', opacity: 0.3, padding: '5rem' }}>Inbox is clear.</div>
            )}
          </div>
        )}

        {/* ── LIVE SUPPORT ── */}
        {activeTab === 'support' && (
          <div className="page-transition">
            <h2 className="gradient-text" style={{ marginBottom: '0.5rem' }}>Live Support Hub</h2>
            <p style={{ color: 'var(--text-dim)', marginBottom: '2rem', fontSize: '0.85rem' }}>Connect directly with festival management for refund escalations or booking issues.</p>
            <ChatPanel user={user} />
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
