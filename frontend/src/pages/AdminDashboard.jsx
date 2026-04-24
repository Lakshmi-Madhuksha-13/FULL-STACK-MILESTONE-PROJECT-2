import React, { useState, useEffect, useRef, useMemo } from 'react';
import api from '../services/api';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, BarElement } from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement);

/* ─── MODAL ─────────────────────────────────────────────── */
const Modal = ({ show, title, message, onConfirm, onCancel, confirmLabel = 'CONFIRM', danger = true }) => {
  if (!show) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-panel bounce-in" style={{ maxWidth: '440px', width: '90%', padding: '3rem', textAlign: 'center', border: '1px solid var(--glass-border)' }}>
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
  };
  const s = map[status] || map.CONFIRMED;
  return <span style={{ ...s, padding: '0.25rem 0.8rem', borderRadius: '2rem', fontSize: '0.65rem', fontWeight: 900, border: `1px solid ${s.color}` }}>{s.label}</span>;
};

/* ─── ADMIN DASHBOARD ───────────────────────────────────── */
const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('events');
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '' });
  const [modal, setModal] = useState({ show: false });
  const [editingEvent, setEditingEvent] = useState(null);
  const [newEvent, setNewEvent] = useState({ eventName: '', venue: '', department: '', dateTime: '', price: 0, totalTickets: 100, availableTickets: 100 });

  // Support
  const [supportMsgs, setSupportMsgs] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const chatScrollRef = useRef();

  const currentUser = (() => {
    try { const s = localStorage.getItem('currentUser'); return s && s !== 'undefined' ? JSON.parse(s) : null; } catch { return null; }
  })();

  const showToast = (msg) => { setToast({ show: true, message: msg }); setTimeout(() => setToast({ show: false, message: '' }), 4000); };
  const showModal = (title, message, onConfirm, danger = true) => setModal({ show: true, title, message, onConfirm, danger });
  const closeModal = () => setModal({ show: false });

  const fetchAll = async () => {
    try {
      const [eRes, uRes, bRes] = await Promise.all([api.event.get(''), api.user.get(''), api.booking.get('')]);
      setEvents(Array.isArray(eRes.data) ? eRes.data : []);
      setUsers(Array.isArray(uRes.data) ? uRes.data : []);
      setBookings(Array.isArray(bRes.data) ? bRes.data : []);
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
    if (!currentUser || currentUser.role !== 'ADMIN') return;
    fetchAll();
    const i = setInterval(fetchAll, 8000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    if (activeTab !== 'support') return;
    fetchSupport();
    const i = setInterval(fetchSupport, 4000);
    return () => clearInterval(i);
  }, [activeTab]);

  useEffect(() => {
    if (chatScrollRef.current) chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
  }, [supportMsgs, selectedUserId]);

  // Grouped support by user
  const supportByUser = supportMsgs.reduce((acc, m) => {
    if (!m?.userId) return acc;
    if (!acc[m.userId]) acc[m.userId] = [];
    acc[m.userId].push(m);
    return acc;
  }, {});

  const totalRevenue = bookings.reduce((s, b) => b?.status !== 'CANCELLED' ? s + (b?.totalAmount || 0) : s, 0);
  const totalTickets = bookings.filter(b => b?.status !== 'CANCELLED').reduce((s, b) => s + (b?.ticketsBooked || 0), 0);

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      await api.event.post('', { ...newEvent, availableTickets: newEvent.totalTickets });
      setNewEvent({ eventName: '', venue: '', department: '', dateTime: '', price: 0, totalTickets: 100, availableTickets: 100 });
      showToast('Event deployed to network!');
      fetchAll();
    } catch { showToast('Deployment error. Try again.'); }
  };

  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    try {
      await api.event.put(`/${editingEvent.id}`, editingEvent);
      setEditingEvent(null);
      showToast('Event reconfigured successfully!');
      fetchAll();
    } catch { showToast('Reconfiguration failed.'); }
  };

  const handleDeleteEvent = (ev) => {
    showModal('Terminate Event?', `Permanently remove "${ev.eventName}"? All bookings will remain in archive.`, async () => {
      closeModal();
      await api.event.delete(`/${ev.id}`);
      showToast('Event asset purged.');
      fetchAll();
    });
  };

  const handlePurgeUser = (u) => {
    showModal('Purge Member?', `Remove "${u.name}" (USR-${u.id}) from the registry?`, async () => {
      closeModal();
      await api.user.delete(`/${u.id}`);
      showToast('Member record liquidated.');
      fetchAll();
    });
  };

  const handleUpdateBookingStatus = (b, status) => {
    showModal(`Mark as ${status}?`, `Update entry pass TF-${b.id} status to "${status}"?`, async () => {
      closeModal();
      await api.booking.put(`/${b.id}/status`, { status });
      showToast(`Status updated to ${status}`);
      fetchAll();
    }, status === 'CANCELLED');
  };

  const handleReply = async () => {
    if (!replyText.trim() || !selectedUserId) return;
    await api.support.post('/send', { userId: selectedUserId, senderName: 'Admin', message: replyText, type: 'ADMIN' });
    setReplyText('');
    fetchSupport();
  };

  if (!currentUser || currentUser.role !== 'ADMIN') return (
    <div className="app-container" style={{ textAlign: 'center', padding: '10rem' }}>
      <h2>Access Forbidden</h2>
    </div>
  );

  const TABS = [['analytics', 'Analytics Hub'], ['events', 'Event Hub'], ['users', 'Member Registry'], ['audit', 'Booking Audit'], ['support', 'Support Intel']];

  // Chart Data Preparation
  const revenueData = useMemo(() => {
    const sortedBookings = [...bookings].filter(b => b?.status !== 'CANCELLED').sort((a,b) => a.id - b.id);
    const labels = sortedBookings.map(b => `TF-${b.id}`);
    const data = sortedBookings.map(b => b.totalAmount);
    return {
      labels,
      datasets: [{ label: 'Revenue (₹)', data, borderColor: '#8b5cf6', backgroundColor: 'rgba(139,92,246,0.2)', tension: 0.4 }]
    };
  }, [bookings]);

  const departmentData = useMemo(() => {
    const deptCounts = users.reduce((acc, u) => {
      acc[u.department] = (acc[u.department] || 0) + 1;
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

  return (
    <div className="app-container page-transition" style={{ minHeight: '100vh' }}>
      <Modal {...modal} onCancel={closeModal} confirmLabel="PROCEED" />

      {/* TOAST */}
      {toast.show && (
        <div className="bounce-in" style={{ position: 'fixed', top: '28px', left: '50%', transform: 'translateX(-50%)', zIndex: 5000, padding: '1rem 2.5rem', background: 'var(--primary)', borderRadius: '2rem', boxShadow: '0 0 30px var(--primary-bright)', fontWeight: 900, whiteSpace: 'nowrap' }}>
          {toast.message}
        </div>
      )}

      {/* ── CENTERED HERO METRICS ── */}
      <div style={{ textAlign: 'center', margin: '4rem 0 5rem 0' }}>
        <h1 className="gradient-text" style={{ fontSize: '4rem', fontWeight: 950, letterSpacing: '-3px', margin: '0 0 0.5rem 0' }}>Command Center</h1>
        <p style={{ color: 'var(--success)', letterSpacing: '2px', fontSize: '0.65rem', fontWeight: 900, marginBottom: '4rem' }}>● OPERATIONAL PULSE: ALL SYSTEMS ONLINE</p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '5rem', flexWrap: 'wrap' }}>
          {[
            { label: 'GROSS REVENUE', val: `₹${totalRevenue.toLocaleString()}`, color: 'var(--success)' },
            { label: 'ACTIVE PASSES', val: totalTickets, color: 'var(--primary)' },
            { label: 'MEMBER BASE', val: users.length, color: 'var(--secondary)' },
            { label: 'LIVE EVENTS', val: events.length, color: '#fbbf24' },
          ].map(({ label, val, color }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 900, opacity: 0.4, letterSpacing: '3px', marginBottom: '0.5rem' }}>{label}</div>
              <div style={{ fontSize: '3.8rem', fontWeight: 950, letterSpacing: '-2px', color }}>{val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '3.5rem', flexWrap: 'wrap' }}>
        {TABS.map(([id, label]) => (
          <button key={id} onClick={() => { setActiveTab(id); setEditingEvent(null); }}
            style={{ background: activeTab === id ? 'var(--primary)' : 'transparent', border: `1px solid ${activeTab === id ? 'var(--primary-bright)' : 'var(--glass-border)'}`, boxShadow: activeTab === id ? '0 0 25px var(--primary-bright)' : 'none', color: 'white', padding: '0.9rem 2.5rem', borderRadius: '12px', cursor: 'pointer', fontWeight: 900, fontSize: '0.8rem', letterSpacing: '1px', transition: '0.3s' }}>
            {label}
          </button>
        ))}
      </div>

      <div className="glass-panel" style={{ minHeight: '600px', padding: '3.5rem' }}>

        {/* ── ANALYTICS HUB ── */}
        {activeTab === 'analytics' && (
          <div className="page-transition">
            <h2 className="gradient-text" style={{ marginBottom: '2.5rem' }}>Real-time Analytics Nerve Center</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '3rem' }}>
              <div className="glass-panel" style={{ padding: '2rem', background: 'rgba(255,255,255,0.02)' }}>
                <h3 style={{ marginBottom: '1.5rem', fontSize: '0.9rem', opacity: 0.5, letterSpacing: '1.5px' }}>REVENUE OVER TIME</h3>
                <Line data={revenueData} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }} />
              </div>
              <div className="glass-panel" style={{ padding: '2rem', background: 'rgba(255,255,255,0.02)' }}>
                <h3 style={{ marginBottom: '1.5rem', fontSize: '0.9rem', opacity: 0.5, letterSpacing: '1.5px', textAlign: 'center' }}>DEPARTMENT TURNOUT</h3>
                <Doughnut data={departmentData} options={{ responsive: true, plugins: { legend: { position: 'bottom', labels: { color: 'white' } } } }} />
              </div>
            </div>
          </div>
        )}

        {/* ── EVENT HUB ── */}
        {activeTab === 'events' && (
          <div className="page-transition" style={{ maxWidth: '800px', margin: '0 auto' }}>
            {editingEvent ? (
              <div style={{ marginBottom: '4rem', padding: '2.5rem', border: '2px solid var(--primary)', borderRadius: '1.5rem', background: 'rgba(139,92,246,0.04)' }}>
                <h2 className="gradient-text" style={{ marginBottom: '2rem' }}>Reconfigure Event</h2>
                <form onSubmit={handleUpdateEvent} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }}>
                  <input className="form-control" value={editingEvent.eventName} onChange={e => setEditingEvent({ ...editingEvent, eventName: e.target.value })} placeholder="Event Name" required />
                  <input className="form-control" value={editingEvent.venue || ''} onChange={e => setEditingEvent({ ...editingEvent, venue: e.target.value })} placeholder="Venue" />
                  <input className="form-control" value={editingEvent.department || ''} onChange={e => setEditingEvent({ ...editingEvent, department: e.target.value })} placeholder="Department" />
                  <input type="number" className="form-control" value={editingEvent.price || ''} onChange={e => setEditingEvent({ ...editingEvent, price: parseFloat(e.target.value) })} placeholder="Price (₹)" />
                  <button type="submit" className="btn-primary">SYNC CHANGES</button>
                  <button type="button" className="btn-elite" onClick={() => setEditingEvent(null)} style={{ background: 'transparent' }}>DISCARD</button>
                </form>
              </div>
            ) : (
              <div style={{ marginBottom: '4rem', padding: '2.5rem', border: '1px solid var(--glass-border)', borderRadius: '1.5rem' }}>
                <h2 className="gradient-text" style={{ marginBottom: '2rem' }}>Deploy New Event</h2>
                <form onSubmit={handleCreateEvent} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }}>
                  <input className="form-control" value={newEvent.eventName} onChange={e => setNewEvent({ ...newEvent, eventName: e.target.value })} placeholder="Event Name *" required />
                  <input className="form-control" value={newEvent.venue} onChange={e => setNewEvent({ ...newEvent, venue: e.target.value })} placeholder="Venue" />
                  <input className="form-control" value={newEvent.department} onChange={e => setNewEvent({ ...newEvent, department: e.target.value })} placeholder="Department" />
                  <input type="number" className="form-control" value={newEvent.price || ''} onChange={e => setNewEvent({ ...newEvent, price: parseFloat(e.target.value) })} placeholder="Entry Fee (₹)" />
                  <input type="datetime-local" className="form-control" value={newEvent.dateTime} onChange={e => setNewEvent({ ...newEvent, dateTime: e.target.value })} />
                  <input type="number" className="form-control" value={newEvent.totalTickets} onChange={e => setNewEvent({ ...newEvent, totalTickets: parseInt(e.target.value) })} placeholder="Total Slots" />
                  <button type="submit" className="btn-primary" style={{ gridColumn: 'span 2' }}>INITIATE DEPLOYMENT ➔</button>
                </form>
              </div>
            )}

            <h4 style={{ opacity: 0.4, letterSpacing: '2px', marginBottom: '1.5rem' }}>MANAGED ASSETS ({events.length})</h4>
            {events.map(ev => (
              <div key={ev.id} className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.8rem 2rem', marginBottom: '1rem', background: 'rgba(255,255,255,0.02)' }}>
                <div>
                  <div style={{ fontWeight: 900, fontSize: '1.15rem' }}>{ev.eventName}</div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.4, marginTop: '0.3rem' }}>{ev.venue || 'TBD'} • ₹{ev.price} • {ev.availableTickets} slots left</div>
                </div>
                <div style={{ display: 'flex', gap: '0.8rem' }}>
                  <button className="btn-elite" onClick={() => setEditingEvent({ ...ev })} style={{ fontSize: '0.75rem', padding: '0.5rem 1.2rem' }}>EDIT</button>
                  <button className="btn-elite" onClick={() => handleDeleteEvent(ev)} style={{ background: 'var(--accent)', border: 'none', fontSize: '0.75rem', padding: '0.5rem 1.2rem' }}>ERASE</button>
                </div>
              </div>
            ))}
            {isLoaded && !events.length && <p style={{ opacity: 0.3, textAlign: 'center', padding: '4rem' }}>No events deployed yet.</p>}
          </div>
        )}

        {/* ── MEMBER REGISTRY ── */}
        {activeTab === 'users' && (
          <div className="page-transition">
            <h2 className="gradient-text" style={{ marginBottom: '2.5rem' }}>Identity Registry</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ borderBottom: '1px solid var(--glass-border)', fontSize: '0.7rem', opacity: 0.5 }}>
                  <tr>{['ID', 'NAME', 'EMAIL', 'ROLE', 'ACTION'].map(h => <th key={h} style={{ padding: '1rem' }}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '1.5rem 1rem', fontWeight: 900, opacity: 0.5 }}>USR-{u.id}</td>
                      <td style={{ padding: '1.5rem 1rem', fontWeight: 700 }}>{u.name}</td>
                      <td style={{ padding: '1.5rem 1rem', opacity: 0.6, fontSize: '0.85rem' }}>{u.email}</td>
                      <td style={{ padding: '1.5rem 1rem' }}><span style={{ background: u.role === 'ADMIN' ? 'rgba(139,92,246,0.15)' : 'rgba(16,185,129,0.1)', color: u.role === 'ADMIN' ? 'var(--primary)' : 'var(--success)', border: `1px solid ${u.role === 'ADMIN' ? 'var(--primary)' : 'var(--success)'}`, padding: '0.2rem 0.8rem', borderRadius: '2rem', fontSize: '0.65rem', fontWeight: 900 }}>{u.role}</span></td>
                      <td style={{ padding: '1.5rem 1rem' }}>
                        {u.role !== 'ADMIN' && <button className="btn-elite" onClick={() => handlePurgeUser(u)} style={{ background: 'var(--accent)', border: 'none', fontSize: '0.7rem', padding: '0.5rem 1.2rem' }}>PURGE</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── BOOKING AUDIT ── */}
        {activeTab === 'audit' && (
          <div className="page-transition">
            <h2 className="gradient-text" style={{ marginBottom: '0.5rem' }}>Booking Audit & Status Control</h2>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginBottom: '2.5rem' }}>View all entry passes and manage their financial status.</p>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ borderBottom: '1px solid var(--glass-border)', fontSize: '0.7rem', opacity: 0.5 }}>
                  <tr>{['PASS ID', 'EVENT', 'AMOUNT', 'SLOTS', 'STATUS', 'ACTION'].map(h => <th key={h} style={{ padding: '1rem' }}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {bookings.map(b => {
                    const evName = events.find(e => e.id === b.eventId)?.eventName || `#${b.eventId}`;
                    return (
                      <tr key={b.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '1.5rem 1rem', fontWeight: 900 }}>TF-{b.id}</td>
                        <td style={{ padding: '1.5rem 1rem', color: 'var(--primary)', fontWeight: 700 }}>{evName}</td>
                        <td style={{ padding: '1.5rem 1rem', color: 'var(--success)', fontWeight: 700 }}>₹{b.totalAmount}</td>
                        <td style={{ padding: '1.5rem 1rem', opacity: 0.7 }}>{b.ticketsBooked}</td>
                        <td style={{ padding: '1.5rem 1rem' }}><StatusBadge status={b.status || 'CONFIRMED'} /></td>
                        <td style={{ padding: '1.5rem 1rem' }}>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {b.status !== 'CANCELLED' && <button className="btn-elite" onClick={() => handleUpdateBookingStatus(b, 'CANCELLED')} style={{ background: 'var(--accent)', border: 'none', fontSize: '0.65rem', padding: '0.4rem 0.9rem' }}>CANCEL</button>}
                            {b.status === 'CANCELLED' && <button className="btn-elite" onClick={() => handleUpdateBookingStatus(b, 'REFUNDED')} style={{ background: '#fbbf24', border: 'none', fontSize: '0.65rem', padding: '0.4rem 0.9rem', color: '#000' }}>MARK REFUNDED</button>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {isLoaded && !bookings.length && <p style={{ opacity: 0.3, textAlign: 'center', padding: '4rem' }}>No bookings in ledger.</p>}
            </div>
          </div>
        )}

        {/* ── SUPPORT INTEL ── */}
        {activeTab === 'support' && (
          <div className="page-transition" style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '3rem', minHeight: '500px' }}>
            {/* Sidebar — User threads */}
            <div style={{ borderRight: '1px solid var(--glass-border)', paddingRight: '2rem' }}>
              <h3 style={{ marginBottom: '1.5rem', fontSize: '0.85rem', opacity: 0.5, letterSpacing: '2px' }}>ACTIVE THREADS</h3>
              {Object.keys(supportByUser).length === 0 ? (
                <div style={{ opacity: 0.25, fontSize: '0.85rem', textAlign: 'center', paddingTop: '3rem' }}>No pending inquiries.</div>
              ) : Object.keys(supportByUser).map(uId => {
                const msgs = supportByUser[uId];
                const senderName = msgs[0]?.senderName || `User #${uId}`;
                const lastMsg = msgs[msgs.length - 1]?.message || '';
                return (
                  <div key={uId} onClick={() => setSelectedUserId(uId)}
                    style={{ padding: '1rem', borderRadius: '12px', cursor: 'pointer', marginBottom: '0.8rem', background: selectedUserId === uId ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.02)', border: `1px solid ${selectedUserId === uId ? 'var(--primary)' : 'transparent'}`, transition: '0.2s' }}>
                    <div style={{ fontWeight: 900, fontSize: '0.85rem' }}>{senderName}</div>
                    <div style={{ fontSize: '0.7rem', opacity: 0.4, marginTop: '0.3rem', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{lastMsg}</div>
                  </div>
                );
              })}
            </div>

            {/* Chat area */}
            {selectedUserId ? (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontWeight: 900, marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--glass-border)' }}>
                  Thread: {supportByUser[selectedUserId]?.[0]?.senderName || `USR-${selectedUserId}`}
                </div>
                <div ref={chatScrollRef} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '360px', paddingRight: '0.5rem' }}>
                  {(supportByUser[selectedUserId] || []).map((m, i) => (
                    <div key={i} style={{ alignSelf: m.type === 'ADMIN' ? 'flex-end' : 'flex-start', background: m.type === 'ADMIN' ? 'var(--primary)' : 'rgba(255,255,255,0.06)', padding: '0.8rem 1.1rem', borderRadius: '12px', maxWidth: '75%', fontSize: '0.85rem', border: m.type !== 'ADMIN' ? '1px solid var(--glass-border)' : 'none' }}>
                      {m.message}
                      <div style={{ fontSize: '0.6rem', opacity: 0.4, marginTop: '0.3rem', fontWeight: 'bold' }}>{m.type === 'ADMIN' ? 'You (Admin)' : m.senderName}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                  <input type="text" placeholder="Compose reply..." className="form-control" value={replyText} onChange={e => setReplyText(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleReply()} />
                  <button className="btn-primary" onClick={handleReply} style={{ width: '80px', height: '48px', flexShrink: 0 }}>SEND</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.2 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💬</div>
                  <div style={{ fontWeight: 900, letterSpacing: '2px' }}>SELECT A THREAD</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
