import React, { useState, useEffect } from 'react';

const NexusPulseTicker = () => {
    const [activities, setActivities] = useState([
        "🚀 LIVE: 15 participants just checked into CodeSprint 2026",
        "💎 NEXUS: A user just redeemed 'VIP Front Row Seat' with 500 coins",
        "⏳ WAITLIST: AI Workshop just hit 100% capacity. Waitlist is active.",
        "🔥 TRENDING: Robotic Combat is the most booked event this hour",
        "🌐 GLOBAL: Welcome to our participants from over 50 universities!",
        "🏆 REWARDS: Total coins distributed today: 12,450 🪙"
    ]);

    useEffect(() => {
        const interval = setInterval(() => {
            setActivities(prev => {
                const next = [...prev];
                const first = next.shift();
                next.push(first);
                return next;
            });
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, 
            background: 'rgba(15, 23, 42, 0.95)', borderTop: '1px solid var(--primary)',
            backdropFilter: 'blur(10px)', height: '40px', zIndex: 9000,
            display: 'flex', alignItems: 'center', overflow: 'hidden'
        }}>
            <div style={{
                background: 'var(--primary)', height: '100%', padding: '0 1.5rem',
                display: 'flex', alignItems: 'center', fontWeight: 900, 
                fontSize: '0.65rem', letterSpacing: '2px', color: 'white',
                whiteSpace: 'nowrap', borderRight: '1px solid var(--primary-bright)'
            }}>
                NEXUS PULSE
            </div>
            <div className="ticker-container" style={{ flex: 1, position: 'relative' }}>
                <div className="ticker-track" style={{ 
                    display: 'flex', whiteSpace: 'nowrap', 
                    paddingLeft: '2rem', fontSize: '0.75rem', 
                    fontWeight: 600, color: 'var(--text-dim)',
                    animation: 'tickerMove 30s linear infinite'
                }}>
                    {activities.map((act, i) => (
                        <span key={i} style={{ marginRight: '4rem', display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ color: 'var(--accent)' }}>●</span> {act}
                        </span>
                    ))}
                    {/* Duplicate for seamless loop */}
                    {activities.map((act, i) => (
                        <span key={`dup-${i}`} style={{ marginRight: '4rem', display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ color: 'var(--accent)' }}>●</span> {act}
                        </span>
                    ))}
                </div>
            </div>
            <style>{`
                @keyframes tickerMove {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
            `}</style>
        </div>
    );
};

export default NexusPulseTicker;
