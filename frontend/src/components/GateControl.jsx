import React, { useState } from 'react';
import api from '../services/api';

const GateControl = () => {
    const [ticketId, setTicketId] = useState('');
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        if (!ticketId) return;
        
        setLoading(true);
        setError('');
        setSuccess('');
        setPreview(null);

        // 🛡️ AGGRESSIVE CLEANING: Strip EVERYTHING except the numeric ID
        const cleanId = ticketId.replace(/[^0-9]/g, '').trim();

        if (!cleanId) {
            setError("INVALID PASS ID: Numeric ID expected.");
            setLoading(false);
            return;
        }

        try {
            const res = await api.booking.get(`/preview-ticket/${cleanId}`);
            setPreview(res.data);
            if (res.data.status?.includes('ADMITTED')) {
                setSuccess('PREVIOUSLY VERIFIED: Entry already recorded.');
            } else if (res.data.status?.includes('REJECTED')) {
                setError('ENTRY DENIED: This pass is blacklisted.');
            }
        } catch (err) {
            console.error("Search Error:", err);
            setError(err.response?.data || 'Pass ID not found in registry.');
        } finally {
            setLoading(false);
        }
    };

    const handleAdmit = async () => {
        if (!preview) return;
        setLoading(true);
        setError('');
        try {
            await api.booking.get(`/admit-ticket/${preview.ticketId}`);
            setSuccess(`PROTOCOL CLEARED: TF-${preview.ticketId} is now verified!`);
            // 🛡️ INSTANT REFLECTION
            setPreview(prev => ({ ...prev, status: 'ADMITTED ✅', isActionable: false }));
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data || 'Admission sequence failed.');
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async () => {
        if (!preview) return;
        setLoading(true);
        setError('');
        try {
            await api.booking.get(`/reject-ticket/${preview.ticketId}`);
            setError(`ENTRY VOIDED: TF-${preview.ticketId} has been rejected.`);
            // 🛡️ INSTANT REFLECTION
            setPreview(prev => ({ ...prev, status: 'REJECTED ❌', isActionable: true }));
        } catch (err) {
            setError('Rejection persistence failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-transition" style={{ maxWidth: '1000px', margin: '0 auto' }}>
            {/* 🚀 COMMAND BAR */}
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <h1 className="gradient-text" style={{ fontSize: '2.5rem', fontWeight: 950, marginBottom: '0.5rem' }}>Nexus Gate Protocol</h1>
                <p style={{ opacity: 0.5, fontWeight: 700 }}>VERIFICATION UNIT: NEXUS-MAIN-01</p>
            </div>

            <div className="glass-panel" style={{ padding: '0.8rem', borderRadius: '30px', background: 'rgba(0,0,0,0.5)', border: loading ? '2px solid var(--primary)' : '1px solid var(--glass-border)', boxShadow: '0 25px 50px rgba(0,0,0,0.4)', marginBottom: '3rem' }}>
                <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ fontSize: '1.8rem', padding: '0 1.5rem', opacity: 0.5 }}>🛡️</div>
                    <input 
                        type="text" 
                        placeholder="ENTER PASS ID (e.g. TF-44)" 
                        className="form-control"
                        value={ticketId}
                        onChange={e => setTicketId(e.target.value)}
                        disabled={loading}
                        style={{ 
                            background: 'transparent', 
                            border: 'none', 
                            fontSize: '2rem', 
                            fontWeight: 950, 
                            textTransform: 'uppercase', 
                            flex: 1,
                            padding: '1.5rem 0',
                            color: 'white',
                            outline: 'none',
                            letterSpacing: '2px'
                        }}
                        autoFocus
                    />
                    <button 
                        type="submit"
                        className="btn-primary" 
                        disabled={loading || !ticketId}
                        style={{ padding: '1.5rem 4rem', borderRadius: '25px', width: 'auto', minWidth: '250px', fontSize: '1.2rem', background: 'linear-gradient(45deg, var(--primary), var(--secondary))' }}
                    >
                        {loading ? 'SYNCING...' : 'SYNC REGISTRY'}
                    </button>
                </form>
            </div>

            {/* 📡 STATUS FEEDBACK */}
            {(error || success) && (
                <div className="bounce-in" style={{ 
                    padding: '2rem', 
                    background: error ? 'rgba(244,63,94,0.1)' : 'rgba(16,185,129,0.1)', 
                    border: `2px solid ${error ? '#f43f5e' : '#10b981'}`, 
                    borderRadius: '20px', 
                    color: error ? '#ff4d6d' : '#10b981', 
                    textAlign: 'center', 
                    fontWeight: 950, 
                    fontSize: '1.1rem',
                    marginBottom: '3rem'
                }}>
                    {error ? `❌ ${error}` : `✅ ${success}`}
                </div>
            )}

            {/* 🛡️ VERIFICATION CARD */}
            {preview && (
                <div className="bounce-in glass-panel" style={{ padding: '4rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '6px', height: '100%', background: preview.status?.includes('ADMITTED') ? '#10b981' : preview.status?.includes('REJECTED') ? '#f43f5e' : 'var(--primary)' }}></div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem' }}>
                        <div>
                            <div style={{ fontSize: '0.8rem', opacity: 0.5, fontWeight: 950, letterSpacing: '4px', marginBottom: '0.5rem', color: 'var(--primary-bright)' }}>PARTICIPANT</div>
                            <div style={{ fontSize: '3.5rem', fontWeight: 950, color: '#fff', textShadow: '0 0 30px rgba(255,255,255,0.2)' }}>{preview.userName}</div>
                            <div style={{ fontSize: '1.2rem', opacity: 0.6, fontWeight: 700, marginTop: '0.5rem' }}>{preview.userEmail} • {preview.userDept}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.8rem', opacity: 0.5, fontWeight: 950, letterSpacing: '4px', marginBottom: '0.5rem', color: '#fbbf24' }}>PROTOCOL STATE</div>
                            <div style={{ fontSize: '2.5rem', fontWeight: 950, color: '#fbbf24' }}>{preview.status}</div>
                            <div style={{ fontSize: '1.2rem', opacity: 0.5, fontWeight: 900, marginTop: '1rem', fontFamily: 'monospace' }}>PASS: TF-{preview.ticketId}</div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '3rem', marginBottom: '4rem' }}>
                        <div style={{ padding: '3rem', background: 'rgba(139,92,246,0.08)', borderRadius: '25px', border: '1px solid rgba(139,92,246,0.2)' }}>
                            <div style={{ fontSize: '0.8rem', opacity: 0.6, fontWeight: 950, letterSpacing: '3px', marginBottom: '1.5rem' }}>EVENT REGISTRY</div>
                            <div style={{ fontSize: '2.5rem', fontWeight: 950, color: '#fff', marginBottom: '1.5rem', lineHeight: 1.1 }}>{preview.eventName}</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', fontSize: '1.1rem', fontWeight: 700, opacity: 0.8 }}>
                                <span>📍 {preview.venue}</span>
                                <span>📅 {preview.dateTime}</span>
                            </div>
                        </div>
                        <div style={{ padding: '3rem', background: 'rgba(251,191,36,0.08)', borderRadius: '25px', border: '1px solid rgba(251,191,36,0.2)', display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.8rem', opacity: 0.6, fontWeight: 950, letterSpacing: '3px', marginBottom: '0.5rem' }}>ACCESS ZONE</div>
                            <div style={{ fontSize: '4rem', fontWeight: 950, color: '#fbbf24', textShadow: '0 0 40px rgba(251,191,36,0.3)' }}>{preview.seatNumber}</div>
                        </div>
                    </div>

                    {preview.isActionable && (
                        <div style={{ display: 'flex', gap: '2rem' }}>
                            <button 
                                onClick={handleAdmit} 
                                disabled={loading}
                                style={{ 
                                    flex: 1, 
                                    padding: '2rem', 
                                    background: '#10b981', 
                                    color: 'white', 
                                    border: 'none', 
                                    borderRadius: '25px', 
                                    fontWeight: 950, 
                                    fontSize: '1.5rem', 
                                    cursor: 'pointer', 
                                    transition: '0.4s',
                                    boxShadow: '0 20px 40px rgba(16,185,129,0.3)'
                                }}
                                onMouseOver={e => e.currentTarget.style.transform = 'translateY(-5px)'}
                                onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                AUTHORIZE ENTRY ✅
                            </button>
                            <button 
                                onClick={handleReject}
                                disabled={loading}
                                style={{ 
                                    flex: 0.4, 
                                    padding: '2rem', 
                                    background: 'transparent', 
                                    border: '3px solid #f43f5e', 
                                    color: '#f43f5e', 
                                    borderRadius: '25px', 
                                    fontWeight: 950, 
                                    fontSize: '1.5rem', 
                                    cursor: 'pointer',
                                    transition: '0.4s'
                                }}
                                onMouseOver={e => e.currentTarget.style.background = 'rgba(244,63,94,0.05)'}
                                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                            >
                                REJECT
                            </button>
                        </div>
                    )}

                    {!preview.isActionable && (
                        <div style={{ 
                            padding: '2.5rem', 
                            background: 'rgba(255,255,255,0.03)', 
                            borderRadius: '25px', 
                            textAlign: 'center', 
                            fontSize: '1.2rem', 
                            fontWeight: 900, 
                            color: 'rgba(255,255,255,0.2)',
                            border: '1px dashed rgba(255,255,255,0.1)',
                            letterSpacing: '1px'
                        }}>
                            GATE PROTOCOL FINALIZED • SESSION LOCKED
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default GateControl;
