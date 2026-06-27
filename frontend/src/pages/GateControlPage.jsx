import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const GateControlPage = () => {
    const navigate = useNavigate();
    const [ticketId, setTicketId] = useState('');
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [staff, setStaff] = useState(null);

    useEffect(() => {
        const s = localStorage.getItem('currentUser');
        if (s) {
            const user = JSON.parse(s);
            const role = (user.role || '').toUpperCase();
            if (role !== 'ADMIN' && role !== 'VOLUNTEER') navigate('/');
            setStaff(user);
        } else {
            navigate('/login');
        }
    }, [navigate]);

    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        if (!ticketId) return;
        
        setLoading(true);
        setError('');
        setSuccess('');
        setPreview(null);

        // 🛠️ HIGH-FIDELITY EXTRACTION
        let cleanId = ticketId.trim();
        
        // 1. Check for JSON QR Data
        if (cleanId.startsWith('{')) {
            try {
                const qr = JSON.parse(cleanId);
                cleanId = qr.passId || cleanId;
            } catch(e) {}
        }

        // 2. Extract pure numeric ID (Supports TF-47, TF47, or just 47)
        const finalId = cleanId.replace(/[^0-9]/g, '');

        console.log(`[Gate Terminal]: Syncing with Registry for ID -> ${finalId}`);

        if (!finalId) {
            setError("PROTOCOL ERROR: No numeric ID detected in scan.");
            setLoading(false);
            return;
        }

        try {
            // 📡 ATTEMPT 1: DIRECT REGISTRY SYNC
            console.log(`[Gate Terminal]: Initializing Direct Sync for TF-${finalId}...`);
            const res = await api.booking.get(`/preview-ticket/${finalId}`);
            setPreview(res.data);
            handlePreviewState(res.data);
            
        } catch (err) {
            console.warn(`[Gate Terminal]: Direct Sync failed for ID ${finalId}. Initiating Deep Registry Sweep...`);
            
            try {
                // 🔍 ATTEMPT 2: DEEP REGISTRY SWEEP (Fallback)
                const allRes = await api.booking.get('');
                const allBookings = Array.isArray(allRes.data) ? allRes.data : [];
                setRegistrySize(allBookings.length);
                
                const match = allBookings.find(b => b.id.toString() === finalId.toString());
                
                if (match) {
                    console.log("[Gate Terminal]: Identity Resolved via Registry Sweep:", match);
                    const resolvedPreview = {
                        ...match,
                        ticketId: match.id,
                        isActionable: !(['ADMITTED', 'CANCELLED', 'REFUNDED'].includes(match.status?.toUpperCase()))
                    };
                    setPreview(resolvedPreview);
                    handlePreviewState(resolvedPreview);
                } else {
                    throw new Error("NOT_IN_REGISTRY");
                }
            } catch (sweepErr) {
                console.error("[Gate Terminal]: Total Resolution Failure:", sweepErr);
                setError(`Pass TF-${finalId} not found. (Registry Size: ${registrySize !== null ? registrySize : 'Synchronizing...'})`);
            }
        } finally {
            setLoading(false);
        }
    };

    const handlePreviewState = (data) => {
        const bStatus = data.status?.toUpperCase() || '';
        if (bStatus.includes('ADMITTED')) setSuccess('PASS PRE-VERIFIED: Entry already recorded.');
        else if (bStatus.includes('REJECTED')) setError('SECURITY ALERT: This pass is blacklisted.');
        else if (bStatus.includes('INVALID') || bStatus.includes('CANCELLED')) setError('VOID PASS: Ticket has been revoked.');
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
        <div className="app-container page-transition" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
            {/* 🚀 HEADER HUD */}
            <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
                <h1 className="gradient-text" style={{ fontSize: '3rem', fontWeight: 950, marginBottom: '0.5rem', letterSpacing: '-1px' }}>Gate Admission Terminal</h1>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', alignItems: 'center' }}>
                    <div style={{ padding: '0.4rem 1rem', background: 'rgba(16,185,129,0.1)', border: '1px solid #10b981', borderRadius: '50px', fontSize: '0.65rem', fontWeight: 900, color: '#10b981' }}>SYSTEM ONLINE</div>
                    <div style={{ opacity: 0.5, fontSize: '0.8rem', fontWeight: 700 }}>OPERATOR: {staff?.name}</div>
                </div>
            </div>

            {/* 🔍 COMMAND BAR */}
            <div className="glass-panel" style={{ width: '100%', maxWidth: '900px', padding: '0.8rem', borderRadius: '35px', background: 'rgba(0,0,0,0.6)', border: loading ? '2px solid var(--primary)' : '1px solid var(--glass-border)', boxShadow: '0 30px 60px rgba(0,0,0,0.5)', marginBottom: '3rem' }}>
                <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ fontSize: '2rem', padding: '0 2rem', opacity: 0.4 }}>🆔</div>
                    <input 
                        type="text" 
                        placeholder="SCAN PASS OR TYPE ID (e.g. TF-101)" 
                        className="form-control"
                        value={ticketId}
                        onChange={e => setTicketId(e.target.value)}
                        disabled={loading}
                        style={{ 
                            background: 'transparent', 
                            border: 'none', 
                            fontSize: '2.2rem', 
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
                        style={{ padding: '1.5rem 5rem', borderRadius: '30px', width: 'auto', minWidth: '280px', fontSize: '1.3rem', background: 'linear-gradient(45deg, var(--primary), var(--secondary))' }}
                    >
                        {loading ? 'SYNCING...' : 'SYNC REGISTRY'}
                    </button>
                </form>
            </div>

            {/* 📡 STATUS FEEDBACK */}
            {(error || success) && (
                <div className="bounce-in" style={{ 
                    width: '100%', maxWidth: '900px',
                    padding: '2.5rem', 
                    background: error ? 'rgba(244,63,94,0.1)' : 'rgba(16,185,129,0.1)', 
                    border: `2px solid ${error ? '#f43f5e' : '#10b981'}`, 
                    borderRadius: '25px', 
                    color: error ? '#ff4d6d' : '#10b981', 
                    textAlign: 'center', 
                    fontWeight: 950, 
                    fontSize: '1.2rem',
                    marginBottom: '3rem'
                }}>
                    {error ? `❌ ${error}` : `✅ ${success}`}
                </div>
            )}

            {/* 🛡️ VERIFICATION HUD */}
            {preview && (
                <div className="bounce-in glass-panel" style={{ width: '100%', maxWidth: '900px', padding: '4.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '8px', height: '100%', background: preview.status?.includes('ADMITTED') ? '#10b981' : preview.status?.includes('REJECTED') ? '#f43f5e' : 'var(--primary)' }}></div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3.5rem' }}>
                        <div>
                            <div style={{ fontSize: '0.8rem', opacity: 0.5, fontWeight: 950, letterSpacing: '4px', marginBottom: '0.8rem', color: 'var(--primary-bright)' }}>PARTICIPANT IDENTITY</div>
                            <div style={{ fontSize: '4rem', fontWeight: 950, color: '#fff', textShadow: '0 0 30px rgba(255,255,255,0.2)', lineHeight: 1 }}>{preview.userName}</div>
                            <div style={{ fontSize: '1.3rem', opacity: 0.6, fontWeight: 700, marginTop: '1rem' }}>{preview.userEmail} • {preview.userDept}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.8rem', opacity: 0.5, fontWeight: 950, letterSpacing: '4px', marginBottom: '0.8rem', color: '#fbbf24' }}>REGISTRY STATE</div>
                            <div style={{ fontSize: '2.8rem', fontWeight: 950, color: '#fbbf24' }}>{preview.status}</div>
                            <div style={{ fontSize: '1.2rem', opacity: 0.5, fontWeight: 900, marginTop: '1.5rem', fontFamily: 'monospace' }}>PASS: TF-{preview.ticketId}</div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '3rem', marginBottom: '4.5rem' }}>
                        <div style={{ padding: '3rem', background: 'rgba(139,92,246,0.08)', borderRadius: '30px', border: '1px solid rgba(139,92,246,0.2)' }}>
                            <div style={{ fontSize: '0.8rem', opacity: 0.6, fontWeight: 950, letterSpacing: '3px', marginBottom: '1.5rem' }}>EVENT DATA</div>
                            <div style={{ fontSize: '2.8rem', fontWeight: 950, color: '#fff', marginBottom: '1.5rem', lineHeight: 1.1 }}>{preview.eventName}</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2.5rem', fontSize: '1.2rem', fontWeight: 700, opacity: 0.8 }}>
                                <span>📍 {preview.venue}</span>
                                <span>📅 {preview.dateTime}</span>
                            </div>
                        </div>
                        <div style={{ padding: '3rem', background: 'rgba(251,191,36,0.08)', borderRadius: '30px', border: '1px solid rgba(251,191,36,0.2)', display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.8rem', opacity: 0.6, fontWeight: 950, letterSpacing: '3px', marginBottom: '0.8rem' }}>ACCESS ZONE</div>
                            <div style={{ fontSize: '5rem', fontWeight: 950, color: '#fbbf24', textShadow: '0 0 40px rgba(251,191,36,0.3)' }}>{preview.seatNumber}</div>
                        </div>
                    </div>

                    {preview.isActionable && (
                        <div style={{ display: 'flex', gap: '2.5rem' }}>
                            <button 
                                onClick={handleAdmit} 
                                disabled={loading}
                                style={{ 
                                    flex: 1, 
                                    padding: '2.2rem', 
                                    background: '#10b981', 
                                    color: 'white', 
                                    border: 'none', 
                                    borderRadius: '30px', 
                                    fontWeight: 950, 
                                    fontSize: '1.8rem', 
                                    cursor: 'pointer', 
                                    transition: '0.4s',
                                    boxShadow: '0 25px 50px rgba(16,185,129,0.3)'
                                }}
                            >
                                AUTHORIZE ENTRY ✅
                            </button>
                            <button 
                                onClick={handleReject}
                                disabled={loading}
                                style={{ 
                                    flex: 0.4, 
                                    padding: '2.2rem', 
                                    background: 'transparent', 
                                    border: '3px solid #f43f5e', 
                                    color: '#f43f5e', 
                                    borderRadius: '30px', 
                                    fontWeight: 950, 
                                    fontSize: '1.6rem', 
                                    cursor: 'pointer',
                                    transition: '0.4s'
                                }}
                            >
                                REJECT
                            </button>
                        </div>
                    )}

                    {!preview.isActionable && (
                        <div style={{ 
                            padding: '3rem', 
                            background: 'rgba(255,255,255,0.03)', 
                            borderRadius: '30px', 
                            textAlign: 'center', 
                            fontSize: '1.4rem', 
                            fontWeight: 900, 
                            color: 'rgba(255,255,255,0.2)',
                            border: '1px dashed rgba(255,255,255,0.1)',
                            letterSpacing: '2px'
                        }}>
                            GATE PROTOCOL FINALIZED • SESSION LOCKED
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default GateControlPage;
