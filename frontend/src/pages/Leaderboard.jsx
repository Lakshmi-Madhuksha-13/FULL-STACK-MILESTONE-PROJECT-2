import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Leaderboard = () => {
    const [topUsers, setTopUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const r = await api.user.get('/leaderboard');
                setTopUsers(Array.isArray(r.data) ? r.data : []);
            } catch (err) {}
            setLoading(false);
        };
        fetch();
    }, []);

    return (
        <div className="app-container page-transition">
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🏆</div>
                <h1 className="gradient-text" style={{ fontSize: '3.5rem' }}>Fest Leaderboard</h1>
                <p style={{ color: 'var(--text-dim)', fontSize: '1.1rem' }}>Recognizing the most active contributors of the Technical Fest.</p>
            </div>

            <div className="glass-panel" style={{ maxWidth: '800px', margin: '0 auto', padding: '0' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 150px', padding: '1.5rem 2.5rem', borderBottom: '1px solid var(--glass-border)', fontSize: '0.75rem', fontWeight: 900, opacity: 0.5, letterSpacing: '2px' }}>
                    <span>RANK</span>
                    <span>PARTICIPANT</span>
                    <span style={{ textAlign: 'right' }}>FEST COINS</span>
                </div>

                {loading ? (
                    <div style={{ padding: '5rem', textAlign: 'center', opacity: 0.4 }}>FETCHING ELITE RANKS...</div>
                ) : (
                    topUsers.map((u, i) => (
                        <div key={u.id} style={{ 
                            display: 'grid', gridTemplateColumns: '80px 1fr 150px', 
                            padding: '1.8rem 2.5rem', borderBottom: '1px solid rgba(255,255,255,0.03)',
                            background: i < 3 ? 'rgba(139,92,246,0.03)' : 'transparent',
                            alignItems: 'center'
                        }}>
                            <span style={{ fontSize: '1.2rem', fontWeight: 950, color: i === 0 ? '#fbbf24' : i === 1 ? '#cbd5e1' : i === 2 ? '#cd7f32' : 'var(--text-dim)' }}>
                                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ width: '40px', height: '40px', background: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>{u.name[0]}</div>
                                <div>
                                    <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{u.name}</div>
                                    <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>{u.department || 'Attendee'}</div>
                                </div>
                            </div>
                            <span style={{ textAlign: 'right', fontSize: '1.3rem', fontWeight: 950, color: '#fbbf24' }}>🪙 {u.coins || 0}</span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Leaderboard;
