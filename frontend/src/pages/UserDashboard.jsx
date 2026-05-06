import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import TicketModal from '../components/TicketModal';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
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

/* ─── CERTIFICATE MODAL ────────────────────────────────── */
const CertificateModal = ({ show, booking, event, user, onClose }) => {
  const certRef = useRef();
  if (!show || !booking || !event || !user) return null;
  
  const handleDownloadPDF = async () => {
    const canvas = await html2canvas(certRef.current, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width, canvas.height] });
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save(`Certificate-${user.name}-${booking.id}.pdf`);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', overflowY: 'auto' }}>
      <style>{`
        .btn-elite {
          position: relative;
          background: var(--primary);
          color: white;
          padding: 1rem 2rem;
          border-radius: 0.75rem;
          font-weight: 900;
          border: none;
          cursor: pointer;
          z-index: 100 !important;
          pointer-events: auto !important;
          transition: 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .btn-elite:hover {
          transform: translateY(-2px);
          filter: brightness(1.2);
          box-shadow: 0 10px 20px rgba(0,0,0,0.3);
        }

        /* Remove all click-blocking pseudo-elements */
        .btn-elite::before, .btn-elite::after {
          display: none !important;
        }
      `}</style>
      <div className="page-transition" style={{ maxWidth: '1000px', width: '100%', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', zIndex: 101, position: 'relative' }}>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '0.6rem 1.2rem', borderRadius: '50px', cursor: 'pointer', fontWeight: 600 }}>✕ CLOSE</button>
            <button onClick={handleDownloadPDF} style={{ background: 'var(--success)', border: 'none', color: 'white', padding: '0.6rem 2rem', borderRadius: '50px', cursor: 'pointer', fontWeight: 900, boxShadow: '0 10px 20px rgba(16,185,129,0.3)' }}>⬇ DOWNLOAD PDF</button>
        </div>
        
        <div ref={certRef} className="certificate-paper" style={{ 
          background: '#fff', color: '#1e293b', padding: '5rem', border: '20px solid #1e293b', 
          borderImage: 'linear-gradient(45deg, #8b5cf6, #ec4899) 1', textAlign: 'center', 
          position: 'relative', boxShadow: '0 50px 100px rgba(0,0,0,0.4)',
          fontFamily: "'Plus Jakarta Sans', sans-serif"
        }}>
          {/* Subtle Background Pattern */}
          <div style={{ position: 'absolute', inset: 0, opacity: 0.03, pointerEvents: 'none', backgroundImage: 'radial-gradient(#000 2px, transparent 2px)', backgroundSize: '30px 30px' }}></div>
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: '1rem', fontWeight: 900, letterSpacing: '5px', color: '#8b5cf6', marginBottom: '2rem' }}>CERTIFICATE OF PARTICIPATION</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.5, marginBottom: '3rem' }}>TF-GEN-{booking.id.toString().padStart(6, '0')}</div>
            
            <div style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>This is to certify that</div>
            <div style={{ fontSize: '3.5rem', fontWeight: 900, color: '#1e293b', marginBottom: '1rem', borderBottom: '2px solid #eee', display: 'inline-block', padding: '0 3rem' }}>{user.name}</div>
            
            <div style={{ fontSize: '1.2rem', marginTop: '2rem', lineHeight: 1.6 }}>
              has successfully participated in the event<br/>
              <strong style={{ fontSize: '1.8rem', color: '#ec4899' }}>{event.eventName}</strong><br/>
              held at <strong>{event.venue}</strong>
            </div>
            
            <div style={{ marginTop: '4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '0 4rem' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ borderBottom: '1px solid #000', width: '150px', marginBottom: '0.5rem' }}></div>
                <div style={{ fontSize: '0.7rem', fontWeight: 900 }}>EVENT COORDINATOR</div>
              </div>
              
              <div style={{ width: '100px', height: '100px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #8b5cf6' }}>
                <div style={{ fontSize: '2rem' }}>🏆</div>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{ borderBottom: '1px solid #000', width: '150px', marginBottom: '0.5rem' }}></div>
                <div style={{ fontSize: '0.7rem', fontWeight: 900 }}>TECHNICAL DIRECTOR</div>
              </div>
            </div>
            
            <div style={{ marginTop: '3rem', fontSize: '0.7rem', opacity: 0.4 }}>Issued on {new Date().toLocaleDateString()} • Verified by Nexus Protocol</div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── STATUS BADGE ─────────────────────────────────────── */
const StatusBadge = ({ status }) => {
  const map = {
    CONFIRMED: { bg: 'rgba(16,185,129,0.12)', color: '#10b981', border: '#10b981', label: '🎫 CONFIRMED' },
    CANCELLED: { bg: 'rgba(244,63,94,0.12)', color: '#f43f5e', border: '#f43f5e', label: '🚫 CANCELLED' },
    REFUNDED:  { bg: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: '#fbbf24', label: '💰 REFUNDED' },
    ADMITTED:  { bg: 'rgba(59,130,246,0.12)', color: '#3b82f6', border: '#3b82f6', label: '🎟️ ADMITTED' },
    REJECTED:  { bg: 'rgba(244,63,94,0.12)', color: '#f43f5e', border: '#f43f5e', label: '❌ REJECTED' },
  };
  const s = map[status?.toUpperCase()] || { bg: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '#94a3b8', label: status || 'PENDING' };
  return (
    <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, padding: '0.3rem 0.9rem', borderRadius: '2rem', fontSize: '0.65rem', fontWeight: 900, letterSpacing: '1px' }}>
      {s.label}
    </span>
  );
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
  return (
    <span style={{ background: s.bg, color: s.color, padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.6rem', fontWeight: 900 }}>
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
    const fetch = async () => { 
      try { 
        const r = await api.support.get(`/history/${user.id}`); 
        const data = Array.isArray(r.data) ? r.data : [];
        setMessages(prev => {
          if (data.length === prev.length) return prev;
          return data;
        });
      } catch { } 
    };
    fetch();
    const i = setInterval(fetch, 4000);
    return () => clearInterval(i);
  }, [user]);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  const send = async () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput('');
    
    // Add user message to UI
    const newUserMsg = { userId: user.id, senderName: user.name, message: userMsg, type: 'USER' };
    setMessages(prev => [...prev, newUserMsg]);

    try {
      await api.support.post('/send', newUserMsg);
      
      // 🤖 AI INTEL RESPONSE
      setTimeout(async () => {
        let aiResponse = "I've received your query. Our team is reviewing your ticket status. Is there anything else I can assist with?";
        const lowMsg = userMsg.toLowerCase();
        
        if (lowMsg.includes('ticket') || lowMsg.includes('show')) aiResponse = "Your tickets are located in the 'Ticket Inventory' tab. If it's blank, ensure your payment was successful or check 'Transaction History'.";
        else if (lowMsg.includes('refund')) aiResponse = "Refunds take 3-5 days. You can track yours in the 'Refund Tracker' tab.";
        else if (lowMsg.includes('coin') || lowMsg.includes('redeem')) aiResponse = "You earn coins by attending events. Redeem them for coupons in the 'Rewards Center'.";
        else if (lowMsg.includes('certificate')) aiResponse = "Certificates are unlocked AFTER you attend an event. Check the 'My Certificates' tab.";
        else if (lowMsg.includes('hello') || lowMsg.includes('hi')) aiResponse = "Greetings! I am Nexus AI. How can I help you with the technical fest today?";

        const aiMsg = { userId: user.id, senderName: 'NEXUS AI', message: aiResponse, type: 'ADMIN' };
        await api.support.post('/send', aiMsg);
      }, 1500);
    } catch { }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '550px', background: 'rgba(0,0,0,0.2)', borderRadius: '1.5rem', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
      <div style={{ padding: '1.2rem 1.5rem', background: 'rgba(139,92,246,0.1)', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <div style={{ width: '8px', height: '8px', background: 'var(--success)', borderRadius: '50%', boxShadow: '0 0 8px var(--success)' }} />
          <div><strong style={{ fontSize: '0.85rem' }}>SUPPORT CENTER</strong><br /><small style={{ opacity: 0.4, fontSize: '0.6rem', letterSpacing: '1px' }}>REAL-TIME ASSISTANCE</small></div>
        </div>
      </div>
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {messages.length === 0 && <div style={{ textAlign: 'center', opacity: 0.2, marginTop: '4rem', fontSize: '0.85rem' }}>Start a conversation with our support team.</div>}
        {messages.map((m, i) => (
          <div key={i} style={{ alignSelf: m.type === 'USER' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
             <div style={{ background: m.type === 'USER' ? 'var(--primary)' : 'rgba(255,255,255,0.06)', padding: '0.8rem 1.1rem', borderRadius: '14px', fontSize: '0.85rem', border: m.type !== 'USER' ? '1px solid var(--glass-border)' : 'none', borderBottomRightRadius: m.type === 'USER' ? '2px' : '14px', borderBottomLeftRadius: m.type === 'USER' ? '14px' : '2px' }}>
                {m.message}
             </div>
             <div style={{ fontSize: '0.55rem', opacity: 0.4, marginTop: '0.3rem', textAlign: m.type === 'USER' ? 'right' : 'left' }}>
                {m.senderName} • {new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
             </div>
          </div>
        ))}
      </div>
      <div style={{ padding: '1.2rem', display: 'flex', gap: '0.8rem', background: 'rgba(0,0,0,0.3)', borderTop: '1px solid var(--glass-border)' }}>
        <input type="text" placeholder="Explain your issue..." value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && send()}
          style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '12px', color: 'white', padding: '0.8rem 1.2rem', fontSize: '0.85rem', outline: 'none' }} />
        <button onClick={send} className="btn-primary" style={{ width: '50px', height: '50px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>➔</button>
      </div>
    </div>
  );
};

/* ─── MAIN DASHBOARD ───────────────────────────────────── */
const UserDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [waitlistEntries, setWaitlistEntries] = useState([]);
  const [activeTab, setActiveTab] = useState('bookings');
  const [countdown, setCountdown] = useState({ text: 'Syncing...', target: null });
  const [toast, setToast] = useState({ show: false, message: '', ok: true });
  const [modal, setModal] = useState({ show: false });
  const [ticketView, setTicketView] = useState(null);
  const [certView, setCertView] = useState(null);

  useEffect(() => {
    try {
      const s = localStorage.getItem('currentUser');
      if (s && s !== 'undefined') {
          const parsed = JSON.parse(s);
          setUser(parsed);
          // 🛡️ SECURITY: If staff accidentally lands here, redirect to console
          const role = (parsed.role || '').toUpperCase();
          if (role === 'ADMIN' || role === 'VOLUNTEER') navigate('/admin');
      }
      else navigate('/login');
    } catch { navigate('/login'); }
  }, [navigate]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!Array.isArray(allEvents) || !Array.isArray(bookings)) return;
      const upcoming = allEvents
        .filter(e => bookings.some(b => b && b.eventId && e && e.id && b.eventId.toString() === e.id.toString() && b.status === 'CONFIRMED'))
        .map(e => ({ ...e, time: new Date(e.dateTime).getTime() }))
        .filter(e => e.time > Date.now())
        .sort((a, b) => a.time - b.time)[0];

      if (upcoming) {
        const diff = upcoming.time - Date.now();
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        setCountdown({ text: `${d}d ${h}h ${m}m ${s}s`, target: upcoming.eventName });
      } else {
        setCountdown({ text: 'No upcoming events', target: null });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [allEvents, bookings]);

  const showToast = (message, ok = true) => { setToast({ show: true, message, ok }); setTimeout(() => setToast({ show: false }), 4000); };
  const showModal = (title, message, onConfirm) => setModal({ show: true, title, message, onConfirm });
  const closeModal = () => setModal({ show: false });

  const fetchAll = useCallback(async () => {
    if (!user?.id) return;
    try {
      console.log("[Portal Nexus]: Syncing data for User ID:", user.id);
      const [bRes, eRes, nRes, wRes] = await Promise.all([
        api.booking.get(`/user/${user.id}`).catch(err => { console.error("Booking Fetch Failed:", err); return { data: [] }; }),
        api.event.get('').catch(err => { console.error("Event Fetch Failed:", err); return { data: [] }; }),
        api.user.get(`/${user.id}/notifications`).catch(err => { console.error("Notif Fetch Failed:", err); return { data: [] }; }),
        api.booking.get(`/waitlist/user/${user.id}`).catch(err => { console.error("Waitlist Fetch Failed:", err); return { data: [] }; }),
      ]);
      
      console.log("[Portal Nexus]: Sync successful. Records found:", bRes.data?.length);
      
      if (Array.isArray(bRes.data)) setBookings(bRes.data);
      if (Array.isArray(eRes.data)) setAllEvents(eRes.data);
      if (Array.isArray(nRes.data)) setNotifications(nRes.data);
      if (Array.isArray(wRes.data)) setWaitlistEntries(wRes.data);
      setIsLoaded(true);
    } catch (err) {
      console.error("[Portal Nexus]: Critical Sync Failure:", err);
      setIsLoaded(true);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) { 
      fetchAll();
      const t = setInterval(fetchAll, 10000);
      return () => clearInterval(t);
    }
  }, [user?.id, fetchAll]);

  const handleRequestRefund = (b) => {
    const bEvId = b.eventId || b.event_id || b.event?.id;
    const ev = allEvents.find(e => (e.id || e.eventId || '').toString() === (bEvId || '').toString());
    const evName = ev?.eventName || `Ticket TF-${b.id}`;
    
    showModal('Cancel & Request Refund?', `Are you sure you want to cancel your pass for "${evName}"? This action will invalidate your ticket and initiate a refund.`, async () => {
      closeModal();
      try {
        console.log("[Portal Nexus]: Initiating revocation for TF-" + b.id);
        await api.booking.put(`/${b.id}/refund-request`);
        showToast('Booking cancelled. Refund in progress.');
        fetchAll();
      } catch (err) { 
        console.error("Revocation Failed:", err);
        showToast('Cancellation failed. Please try again.', false); 
      }
    });
  };

  const TABS = [
    ['bookings','Ticket Inventory'], 
    ['pathfinder', 'AI Pathfinder 🤖'],
    ['certificates','My Certificates'],
    ['quest', 'Nexus Quest 🎮'],
    ['refunds', 'Refund Tracker'],
    ['transactions','Purchase History'],
    ['rewards','Rewards Center'],
    ['waitlist','Waitlist Queue'], 
    ['notifications','System Inbox'], 
    ['support','AI Intel Hub']
  ];

  const REWARDS = [
    { id: 'R1', name: 'Premium Lunch Coupon', cost: 200, icon: '🍔' },
    { id: 'R2', name: 'VIP Front Row Seat', cost: 500, icon: '🌟' },
    { id: 'R3', name: 'Technical Workshop Pass', cost: 350, icon: '💻' },
    { id: 'R4', name: 'Fest Goodies Kit', cost: 1000, icon: '🎁' }
  ];

  const handleRedeem = (reward) => {
    if ((user?.coins || 0) < reward.cost) {
        showToast(`Insufficient coins! You need ${reward.cost - (user?.coins || 0)} more.`, false);
        return;
    }
    showModal('Redeem Reward?', `Exchange ${reward.cost} coins for ${reward.name}?`, async () => {
        closeModal();
        try {
            showToast(`Redemption Successful! Code: NEXUS-${Math.random().toString(36).substr(2,9).toUpperCase()}`);
        } catch { showToast('Redemption failed.', false); }
    });
  };

  return (
    <div className="app-container page-transition" style={{ minHeight: '100vh', paddingBottom: '5rem' }}>
      <Modal {...modal} onCancel={closeModal} confirmLabel="PROCEED" />
      {ticketView && <TicketModal booking={ticketView.booking} event={ticketView.event} user={user} onClose={() => setTicketView(null)} />}
      {certView && <CertificateModal show={true} booking={certView.booking} event={certView.event} user={user} onClose={() => setCertView(null)} />}
      
      {toast.show && (
        <div className="bounce-in" style={{ position: 'fixed', top: '100px', left: '50%', transform: 'translateX(-50%)', zIndex: 5000, padding: '1rem 2.5rem', background: toast.ok ? 'var(--primary)' : 'var(--accent)', borderRadius: '2rem', fontWeight: 900, boxShadow: '0 0 30px var(--primary-bright)' }}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="glass-panel" style={{ padding: '3rem', marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2.2rem', fontWeight: 950 }}>User Portal</h1>
          <p style={{ opacity: 0.7, fontSize: '0.9rem', marginTop: '0.5rem' }}>Manage your event participation and support requests.</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          {countdown.target && (
            <div style={{ marginBottom: '1rem', background: 'rgba(0,0,0,0.2)', padding: '0.8rem 1.2rem', borderRadius: '12px', textAlign: 'left' }}>
              <div style={{ fontSize: '0.6rem', fontWeight: 900, opacity: 0.6, letterSpacing: '1px' }}>NEXT MISSION IN:</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 950, color: 'white' }}>{countdown.text}</div>
              <div style={{ fontSize: '0.65rem', opacity: 0.8 }}>Target: {countdown.target}</div>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
              <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 900, fontSize: '1.2rem' }}>{user?.name}</div>
                  <div style={{ opacity: 0.6, fontSize: '0.8rem' }}>{user?.email}</div>
              </div>
              <button onClick={() => setActiveTab('rewards')} style={{ background: 'rgba(251,191,36,0.1)', border: '2px solid #fbbf24', padding: '0.8rem 1.2rem', borderRadius: '1rem', cursor: 'pointer', transition: '0.3s' }}>
                  <div style={{ fontSize: '0.6rem', fontWeight: 900, color: '#fbbf24', letterSpacing: '1px' }}>{user?.coins || 0} COINS</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 900, color: 'white' }}>REDEEM ➔</div>
              </button>
          </div>
        </div>
      </div>

      <div className="nav-sticky" style={{ marginBottom: '3rem' }}>
        <div className="app-container" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', 
          gap: '1rem', 
          justifyContent: 'center' 
        }}>
          {TABS.map(([id, label]) => (
            <button key={id} onClick={(e) => { 
                e.stopPropagation();
                console.log("[Portal UI]: Tab ->", id); 
                setActiveTab(id); 
              }}
              style={{ 
                background: activeTab === id ? 'var(--primary)' : 'rgba(255,255,255,0.05)', 
                border: `2px solid ${activeTab === id ? 'var(--primary)' : 'var(--glass-border)'}`, 
                color: 'white', padding: '1rem', borderRadius: '16px', cursor: 'pointer', 
                fontWeight: 900, fontSize: '0.8rem', transition: '0.3s', pointerEvents: 'auto',
                boxShadow: activeTab === id ? '0 10px 20px rgba(139,92,246,0.2)' : 'none'
              }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-panel" style={{ minHeight: '600px', padding: '3rem' }}>
        
        {/* 🎫 TICKET INVENTORY */}
        {activeTab === 'bookings' && (
          <div className="page-transition">
            <h2 className="gradient-text" style={{ marginBottom: '2.5rem' }}>Active Passports</h2>
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              {bookings.map(b => {
                const bEvId = b.eventId || b.event_id || b.event?.id;
                const ev = allEvents.find(e => (e.id || e.eventId || '').toString() === (bEvId || '').toString()) || { eventName: 'Nexus Event', venue: 'Venue Pending' };
                const s = (b.status || 'PENDING').toUpperCase();
                
                // 🚩 GATE STATUS CALCULATION
                const isAdmitted = s === 'ADMITTED' || b.usedFlag;
                const isRejected = s === 'REJECTED';
                const gateStatus = isAdmitted ? 'ENTERED ✅' : isRejected ? 'ENTRY DENIED ❌' : 'PENDING ENTRY ⏳';

                return (
                  <div key={b.id} className="glass-panel" style={{ padding: '2rem', background: 'rgba(255,255,255,0.02)', borderLeft: `4px solid ${isAdmitted ? 'var(--success)' : isRejected ? 'var(--accent)' : 'var(--primary)'}` }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '2rem', alignItems: 'center' }}>
                      <div className="mobile-text-center">
                        <div style={{ fontWeight: 900, fontSize: '1.2rem' }}>{ev.eventName}</div>
                        <div style={{ opacity: 0.5, fontSize: '0.8rem', marginTop: '0.4rem' }}>ID: TF-{b.id} • Seats: {b.ticketsBooked} • Venue: {ev.venue}</div>
                        <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                           <StatusBadge status={b.status} />
                           <span style={{ fontSize: '0.7rem', fontWeight: 900, color: isAdmitted ? '#10b981' : isRejected ? '#f43f5e' : '#94a3b8', opacity: 0.8 }}>● {gateStatus}</span>
                        </div>
                      </div>
                      <div className="flex-stack-mobile" style={{ display: 'flex', gap: '1rem', position: 'relative', zIndex: 9999 }}>
                        <button className="btn-elite" onClick={(e) => { 
                            e.stopPropagation();
                            console.log("[Portal Action]: Open Pass for TF-" + b.id); 
                            setTicketView({ booking: b, event: ev }); 
                          }} style={{ background: 'var(--primary)', border: 'none', padding: '0.7rem 1.5rem', pointerEvents: 'auto' }}>OPEN PASS</button>
                        
                        {isAdmitted && (
                          <button className="btn-elite" onClick={(e) => { 
                              e.stopPropagation();
                              setCertView({ booking: b, event: ev });
                            }} style={{ background: 'linear-gradient(45deg, #8b5cf6, #ec4899)', border: 'none', padding: '0.7rem 1.5rem', pointerEvents: 'auto' }}>🎓 GET CERTIFICATE</button>
                        )}

                        {(s === 'CONFIRMED' || s === 'PENDING') && (
                          <button className="btn-elite" onClick={(e) => { 
                              e.stopPropagation();
                              console.log("[Portal Action]: Cancel Request for TF-" + b.id);
                              handleRequestRefund(b); 
                            }} style={{ background: 'var(--accent)', border: 'none', padding: '0.7rem 1.5rem', pointerEvents: 'auto' }}>CANCEL PASS</button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {isLoaded && bookings.length === 0 && (
                <div style={{ textAlign: 'center', opacity: 0.3, padding: '5rem' }}>
                   <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎟️</div>
                   No active passports detected.
                   <div style={{ marginTop: '1rem', fontSize: '0.7rem' }}>
                      System Sync: {bookings.length} total records found. 
                      ({bookings.filter(b => (b.status||'').toUpperCase() === 'PENDING').length} Pending)
                   </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 🎓 MY CERTIFICATES */}
        {activeTab === 'certificates' && (
          <div className="page-transition">
            <h2 className="gradient-text" style={{ marginBottom: '2.5rem' }}>Merit Certificates</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {bookings.filter(b => (b.status || '').toUpperCase() === 'ADMITTED').map(b => {
                const ev = allEvents.find(e => e.id.toString() === b.eventId.toString());
                return (
                  <div key={b.id} className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(139,92,246,0.05)', border: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📜</div>
                            <div style={{ fontWeight: 900, marginBottom: '0.5rem' }}>{ev?.eventName || 'Technical Event'}</div>
                            <div style={{ fontSize: '0.7rem', opacity: 0.5, marginBottom: '1rem' }}>ID: TF-GEN-{b.id}</div>
                        </div>
                        {(!b.rating) && (
                            <button className="btn-elite" onClick={() => {
                                const rating = prompt("Rate this event (1-5):", "5");
                                const review = prompt("Write a short review:");
                                if (rating) {
                                    api.booking.post(`/${b.id}/review`, { rating: parseInt(rating), review }).then(() => {
                                        showToast("Thank you for your feedback!");
                                        fetchAll();
                                    });
                                }
                            }} style={{ padding: '0.5rem 1rem', fontSize: '0.6rem', background: 'var(--accent)' }}>RATE EVENT</button>
                        )}
                        {b.rating && <div style={{ fontSize: '0.8rem', color: '#fbbf24', fontWeight: 900 }}>⭐ {b.rating}/5</div>}
                    </div>
                    <button className="btn-primary" onClick={() => setCertView({ booking: b, event: ev })} style={{ fontSize: '0.8rem', width: '100%', marginTop: '1rem' }}>VIEW MERIT</button>
                  </div>
                );
              })}
              {isLoaded && !bookings.some(b => (b.status || '').toUpperCase() === 'ADMITTED') && (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', opacity: 0.3, padding: '5rem' }}>Certificates unlock after gate admission.</div>
              )}
            </div>
          </div>
        )}

        {/* 📊 REFUND TRACKER */}
        {activeTab === 'refunds' && (
          <div className="page-transition">
            <h2 className="gradient-text" style={{ marginBottom: '2.5rem' }}>Refund Management</h2>
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              {bookings.filter(b => b.status === 'CANCELLED' || b.status === 'REFUNDED' || b.refundStatus).map(b => {
                const ev = allEvents.find(e => (e.id || e.eventId || '').toString() === (b.eventId || '').toString()) || { eventName: 'Nexus Event' };
                return (
                  <div key={b.id} className="glass-panel" style={{ padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                    <div>
                      <div style={{ fontSize: '0.65rem', opacity: 0.5, fontWeight: 900, letterSpacing: '1px' }}>TICKET TF-{b.id}</div>
                      <div style={{ fontWeight: 800, fontSize: '1.1rem', margin: '0.4rem 0' }}>{ev.eventName}</div>
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 900 }}>REFUND: ₹{b.totalAmount}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                       <div style={{ fontSize: '0.6rem', opacity: 0.4, marginBottom: '0.4rem' }}>CURRENT STATUS</div>
                       <RefundBadge status={b.refundStatus || 'REQUESTED'} />
                    </div>
                  </div>
                );
              })}
              {isLoaded && !bookings.filter(b => b.status === 'CANCELLED' || b.status === 'REFUNDED' || b.refundStatus).length && (
                <div style={{ textAlign: 'center', opacity: 0.3, padding: '5rem' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💸</div>
                  No active refund requests found.
                </div>
              )}
            </div>
          </div>
        )}

        {/* 📊 TRANSACTIONS */}
        {activeTab === 'transactions' && (
          <div className="page-transition">
            <h2 className="gradient-text" style={{ marginBottom: '2.5rem' }}>Purchase History</h2>
            <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ background: 'rgba(255,255,255,0.03)', fontSize: '0.7rem', fontWeight: 900 }}>
                  <tr>
                    <th style={{ padding: '1.2rem' }}>TRANSACTION ID</th>
                    <th style={{ padding: '1.2rem' }}>EVENT</th>
                    <th style={{ padding: '1.2rem' }}>DATE</th>
                    <th style={{ padding: '1.2rem' }}>AMOUNT</th>
                    <th style={{ padding: '1.2rem' }}>STATUS</th>
                  </tr>
                </thead>
                <tbody style={{ fontSize: '0.85rem' }}>
                  {bookings.map(b => (
                    <tr key={b.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                      <td style={{ padding: '1.2rem', fontWeight: 'mono' }}>TXN-{b.id}</td>
                      <td style={{ padding: '1.2rem' }}>{allEvents.find(e => e.id.toString() === b.eventId.toString())?.eventName || 'Fest Booking'}</td>
                      <td style={{ padding: '1.2rem', opacity: 0.5 }}>{new Date().toLocaleDateString()}</td>
                      <td style={{ padding: '1.2rem', fontWeight: 900 }}>₹{b.totalAmount}</td>
                      <td style={{ padding: '1.2rem' }}><StatusBadge status={b.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {isLoaded && !bookings.length && <div style={{ padding: '4rem', textAlign: 'center', opacity: 0.3 }}>No transactions logged.</div>}
            </div>
          </div>
        )}

        {/* 🎁 REWARDS CENTER */}
        {activeTab === 'rewards' && (
          <div className="page-transition">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <h2 className="gradient-text" style={{ margin: 0 }}>Nexus Rewards</h2>
                <div style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid #fbbf24', padding: '0.6rem 1.2rem', borderRadius: '2rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>🪙</span>
                    <span style={{ color: '#fbbf24', fontWeight: 900 }}>{user.coins || 0} BALANCE</span>
                </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}>
                {REWARDS.map(r => (
                    <div key={r.id} className="glass-panel" style={{ padding: '2rem', textAlign: 'center', border: '1px solid var(--glass-border)', transition: '0.3s' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{r.icon}</div>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{r.name}</h3>
                        <p style={{ opacity: 0.5, fontSize: '0.8rem', marginBottom: '1.5rem' }}>Redeem for specialized fest access.</p>
                        <button className="btn-elite" onClick={() => handleRedeem(r)} style={{ width: '100%', background: (user.coins||0) >= r.cost ? 'var(--primary)' : 'rgba(255,255,255,0.05)' }}>
                            {r.cost} COINS
                        </button>
                    </div>
                ))}
            </div>
          </div>
        )}

        {/* 🎧 SUPPORT CHAT */}
        {activeTab === 'support' && (
          <div className="page-transition">
            <h2 className="gradient-text" style={{ marginBottom: '1.5rem' }}>Live Support</h2>
            <p style={{ opacity: 0.6, marginBottom: '2rem', fontSize: '0.9rem' }}>Contact our team for any assistance with bookings or platform features.</p>
            <ChatPanel user={user} />
          </div>
        )}

        {/* ⏳ WAITLIST */}
        {activeTab === 'waitlist' && (
          <div className="page-transition">
            <h2 className="gradient-text" style={{ marginBottom: '2.5rem' }}>Waitlist Queue</h2>
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              {waitlistEntries.map(w => {
                const ev = allEvents.find(e => e.id.toString() === w.eventId.toString());
                return (
                  <div key={w.id} className="glass-panel" style={{ padding: '2rem', background: 'rgba(139,92,246,0.03)', borderLeft: '4px solid var(--primary)' }}>
                    <div style={{ fontWeight: 900, fontSize: '1.2rem' }}>{ev?.eventName || 'Event'}</div>
                    <div style={{ opacity: 0.5, fontSize: '0.8rem', marginTop: '0.4rem' }}>Joined: {new Date(w.joinedAt).toLocaleDateString()} • Position: #{w.position}</div>
                    <div style={{ marginTop: '1rem' }}><span style={{ color: 'var(--primary)', fontWeight: 900 }}>{w.status}</span></div>
                  </div>
                );
              })}
              {isLoaded && !waitlistEntries.length && (
                <div style={{ textAlign: 'center', opacity: 0.3, padding: '5rem' }}>You are not in any waitlists.</div>
              )}
            </div>
          </div>
        )}

        {/* 📥 NOTIFICATIONS */}
        {activeTab === 'notifications' && (
          <div className="page-transition">
            <h2 className="gradient-text" style={{ marginBottom: '2.5rem' }}>System Inbox</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {notifications.map(n => (
                <div key={n.id} className="glass-panel" style={{ padding: '1.5rem', background: n.read ? 'transparent' : 'rgba(139,92,246,0.05)' }}>
                  <div style={{ fontSize: '0.7rem', opacity: 0.4, marginBottom: '0.5rem' }}>{new Date(n.timestamp).toLocaleString()}</div>
                  <div style={{ fontSize: '0.95rem' }}>{n.message}</div>
                </div>
              ))}
              {isLoaded && !notifications.length && (
                <div style={{ textAlign: 'center', opacity: 0.3, padding: '5rem' }}>Your inbox is empty.</div>
              )}
            </div>
          </div>
        )}

        {/* 🎮 NEXUS QUEST */}
        {activeTab === 'quest' && (
          <div className="page-transition">
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <h2 className="gradient-text" style={{ fontSize: '2.5rem' }}>Nexus Quest Terminal</h2>
              <p style={{ opacity: 0.6 }}>Found a physical QR code at the venue? Enter the code below to claim your XP!</p>
            </div>
            
            <div className="glass-panel" style={{ maxWidth: '600px', margin: '0 auto', padding: '3rem', textAlign: 'center' }}>
              <div style={{ fontSize: '4rem', marginBottom: '2rem' }}>📡</div>
              <input 
                id="questInput"
                className="form-control" 
                placeholder="ENTER QUEST CODE (e.g. S-NEXUS-01)" 
                style={{ fontSize: '1.5rem', textAlign: 'center', marginBottom: '2rem', textTransform: 'uppercase' }}
              />
              <button className="btn-primary" style={{ width: '100%', padding: '1.2rem' }} onClick={async () => {
                const code = document.getElementById('questInput').value;
                if (!code) return;
                try {
                  await api.user.post(`/${user.id}/quest`, { questCode: code });
                  showToast("QUEST REDEEMED! Check your notifications.");
                  fetchAll();
                  document.getElementById('questInput').value = '';
                } catch (err) {
                  showToast(err.response?.data || "Redemption failed.", false);
                }
              }}>CLAIM REWARD</button>
              
              <div style={{ marginTop: '3rem', padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', textAlign: 'left' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 900, marginBottom: '1rem', opacity: 0.5 }}>ACTIVE MISSIONS</div>
                <div style={{ display: 'grid', gap: '0.8rem' }}>
                  <div style={{ fontSize: '0.85rem' }}>🔹 Scan QR at Sponsor Booths (Code starts with S-)</div>
                  <div style={{ fontSize: '0.85rem' }}>🔹 Attend Masterclasses (Code starts with M-)</div>
                  <div style={{ fontSize: '0.85rem' }}>🔹 Social Media Share (Code: NEXUS-SHARE-2026)</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 🤖 AI PATHFINDER */}
        {activeTab === 'pathfinder' && (
          <div className="page-transition">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
              <div>
                <h2 className="gradient-text" style={{ fontSize: '2.5rem' }}>AI Pathfinder</h2>
                <p style={{ opacity: 0.6 }}>Our neural network has synthesized your ideal Technical Fest itinerary.</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.6rem', opacity: 0.5 }}>SYNTHESIS STATUS</div>
                <div style={{ color: 'var(--success)', fontWeight: 900 }}>OPTIMIZED ✅</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '3rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {allEvents
                  .filter(e => {
                    // Smart Recommendation Logic
                    const isBooked = bookings.some(b => b.eventId?.toString() === e.id?.toString());
                    if (isBooked) return false;
                    const isSameDept = (e.department || '').toUpperCase() === (user.department || '').toUpperCase();
                    const isUpcoming = new Date(e.dateTime).getTime() > Date.now();
                    return isUpcoming && isSameDept;
                  })
                  .slice(0, 3)
                  .map((e, idx) => (
                    <div key={e.id} className="glass-panel bounce-in" style={{ padding: '2rem', display: 'flex', gap: '2rem', animationDelay: `${idx * 0.1}s` }}>
                       <div style={{ fontSize: '2.5rem' }}>{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</div>
                       <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.65rem', color: 'var(--primary-bright)', fontWeight: 900 }}>RECOMMENDED MISSION</div>
                          <div style={{ fontSize: '1.4rem', fontWeight: 950, margin: '0.3rem 0' }}>{e.eventName}</div>
                          <div style={{ opacity: 0.5, fontSize: '0.85rem' }}>{e.venue} • {new Date(e.dateTime).toLocaleString()}</div>
                          <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                            <span style={{ fontSize: '0.7rem', padding: '0.3rem 0.8rem', background: 'rgba(139,92,246,0.1)', borderRadius: '4px', color: 'var(--primary-bright)', fontWeight: 900 }}>MATCH: 98%</span>
                            <span style={{ fontSize: '0.7rem', padding: '0.3rem 0.8rem', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', opacity: 0.6 }}>{e.department}</span>
                          </div>
                       </div>
                       <button className="btn-primary" onClick={() => navigate(`/book/${e.id}`)} style={{ height: 'fit-content' }}>ENROLL</button>
                    </div>
                  ))
                }
                {allEvents.filter(e => (e.department||'').toUpperCase() === (user.department||'').toUpperCase()).length === 0 && (
                  <div style={{ textAlign: 'center', padding: '5rem', opacity: 0.3 }}>Pathfinder scanning registry... No department matches found.</div>
                )}
              </div>

              <div className="glass-panel" style={{ padding: '2rem', height: 'fit-content' }}>
                <h3 style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>WHY THESE?</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: '0.8rem', color: 'var(--primary)' }}>DEPT ALIGNMENT</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: '0.3rem' }}>Events matching your {user.department} specialization.</div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: '0.8rem', color: 'var(--secondary)' }}>TEMPORAL SYNC</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: '0.3rem' }}>No time conflicts with your existing {bookings.length} passes.</div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: '0.8rem', color: '#fbbf24' }}>COIN POTENTIAL</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: '0.3rem' }}>High-value events with maximum participation rewards.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default UserDashboard;
