import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const Leaderboard = () => {
    const [topUsers, setTopUsers] = useState([]);
    const [myRank, setMyRank] = useState(0);
    const [loading, setLoading] = useState(true);

    const currentUser = (() => { try { const s = localStorage.getItem('currentUser'); return s ? JSON.parse(s) : null; } catch { return null; } })();

    useEffect(() => {
        const fetch = async () => {
            try {
                const r = await api.user.get('/leaderboard');
                const data = Array.isArray(r.data) ? r.data : [];
                setTopUsers(data);
                
                if (currentUser && currentUser.id) {
                    const r2 = await api.user.get(`/${currentUser.id}/rank`).catch(() => ({ data: 0 }));
                    setMyRank(r2.data || 0);
                }
            } catch (err) {
                console.error("Leaderboard synchronization failed.");
                setTopUsers([]);
            }
            setLoading(false);
        };
        fetch();
        const i = setInterval(fetch, 10000);
        return () => clearInterval(i);
    }, [currentUser?.id]);

    const deptData = useMemo(() => {
        if (!topUsers.length) return { labels: [], datasets: [] };
        const counts = topUsers.reduce((acc, u) => {
            const d = (u.department || 'General').toUpperCase();
            acc[d] = (acc[d] || 0) + (u.coins || 0);
            return acc;
        }, {});
        
        return {
            labels: Object.keys(counts),
            datasets: [{
                data: Object.values(counts),
                backgroundColor: ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
                borderWidth: 0,
                hoverOffset: 20
            }]
        };
    }, [topUsers]);

    const getTier = (coins) => {
        if (coins > 5000) return { label: 'NEXUS TITAN', color: '#f59e0b', icon: '💎' };
        if (coins > 2000) return { label: 'ELITE VOYAGER', color: '#8b5cf6', icon: '🌟' };
        if (coins > 500) return { label: 'TECH EXPLORER', color: '#10b981', icon: '⚙️' };
        return { label: 'ROOKIE', color: '#94a3b8', icon: '🌱' };
    };

    return (
        <div className="app-container page-transition" style={{ paddingBottom: '8rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🏆</div>
                <h1 className="gradient-text" style={{ fontSize: '3.5rem' }}>The Hall of Tech</h1>
                <p style={{ color: 'var(--text-dim)', fontSize: '1.1rem' }}>Recognizing the architects of the Technical Fest 2026.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '3rem', maxWidth: '1200px', margin: '0 auto' }}>
                {/* LIST SECTION */}
                <div>
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '0.8rem', opacity: 0.5, letterSpacing: '2px' }}>TOP CONTRIBUTORS</h3>
                    <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 150px', padding: '1.5rem 2.5rem', borderBottom: '1px solid var(--glass-border)', fontSize: '0.65rem', fontWeight: 900, opacity: 0.5, letterSpacing: '2px' }}>
                            <span>RANK</span>
                            <span>PARTICIPANT</span>
                            <span style={{ textAlign: 'right' }}>COINS</span>
                        </div>

                        {loading ? (
                            <div style={{ padding: '5rem', textAlign: 'center', opacity: 0.4 }}>SYNCING ELITE RANKS...</div>
                        ) : (
                            <>
                                {topUsers.map((u, i) => {
                                    const tier = getTier(u.coins || 0);
                                    return (
                                        <div key={u.id} className="leader-row" style={{ 
                                            display: 'grid', gridTemplateColumns: '80px 1fr 150px', 
                                            padding: '1.5rem 2.5rem', borderBottom: '1px solid rgba(255,255,255,0.03)',
                                            background: u.id === currentUser?.id ? 'rgba(139,92,246,0.1)' : 'transparent',
                                            alignItems: 'center', transition: '0.3s'
                                        }}>
                                            <span style={{ fontSize: '1.2rem', fontWeight: 950, color: i === 0 ? '#fbbf24' : i === 1 ? '#cbd5e1' : i === 2 ? '#cd7f32' : 'var(--text-dim)' }}>
                                                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                                            </span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{ width: '45px', height: '45px', background: 'var(--primary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.2rem' }}>{(u.name || 'U')[0]}</div>
                                                <div>
                                                    <div style={{ fontWeight: 800, fontSize: '1rem' }}>{u.name}</div>
                                                    <div style={{ fontSize: '0.65rem', opacity: 0.5 }}>{u.department} • <span style={{ color: tier.color, fontWeight: 900 }}>{tier.icon} {tier.label}</span></div>
                                                </div>
                                            </div>
                                            <span style={{ textAlign: 'right', fontSize: '1.3rem', fontWeight: 950, color: '#fbbf24' }}>{u.coins || 0}</span>
                                        </div>
                                    );
                                })}
                            </>
                        )}
                    </div>
                </div>

                {/* SIDE SECTION (ANALYTICS) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="glass-panel" style={{ padding: '2rem' }}>
                        <h3 style={{ marginBottom: '1.5rem', fontSize: '0.75rem', opacity: 0.5, letterSpacing: '2px' }}>DEPARTMENT RIVALRY</h3>
                        <div style={{ height: '250px', display: 'flex', justifyContent: 'center' }}>
                            <Doughnut data={deptData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: 'rgba(255,255,255,0.7)', font: { size: 10 } } } } }} />
                        </div>
                        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.65rem', opacity: 0.4 }}>MOST ACTIVE DEPT.</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 950, color: 'var(--primary)' }}>
                                {Object.keys(deptData.labels).length > 0 ? deptData.labels[deptData.datasets[0].data.indexOf(Math.max(...deptData.datasets[0].data))] : '---'}
                            </div>
                        </div>
                    </div>

                    <div className="glass-panel" style={{ padding: '2rem', background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}>
                         <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900 }}>Nexus Reward Pool</h3>
                         <p style={{ fontSize: '0.8rem', opacity: 0.8, margin: '1rem 0 2rem' }}>The top 3 participants on May 15th will receive the Golden Nexus Pass.</p>
                         <div style={{ display: 'flex', gap: '0.5rem' }}>
                             <div style={{ flex: 1, background: 'rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                                 <div style={{ fontSize: '0.6rem', fontWeight: 900, opacity: 0.6 }}>1ST PLACE</div>
                                 <div style={{ fontSize: '1rem', fontWeight: 900 }}>₹10,000</div>
                             </div>
                             <div style={{ flex: 1, background: 'rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                                 <div style={{ fontSize: '0.6rem', fontWeight: 900, opacity: 0.6 }}>2ND PLACE</div>
                                 <div style={{ fontSize: '1rem', fontWeight: 900 }}>₹5,000</div>
                             </div>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Leaderboard;
