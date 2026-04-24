import React, { useState, useEffect } from 'react';
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';

const LiveNotificationBar = () => {
    const [notifications, setNotifications] = useState([]);
    const user = (() => { try { const s = localStorage.getItem('currentUser'); return s ? JSON.parse(s) : null; } catch { return null; } })();

    useEffect(() => {
        if (!user) return;

        const socket = new SockJS('http://localhost:8081/ws-stomp');
        const stompClient = Stomp.over(socket);
        stompClient.debug = () => {};

        stompClient.connect({}, () => {
            // Subscribe to personal notifications
            stompClient.subscribe(`/topic/notifications/${user.id}`, (msg) => {
                const n = JSON.parse(msg.body);
                addNotification(n.message);
            });

            // Subscribe to global notifications (for everyone, especially admins)
            stompClient.subscribe(`/topic/global`, (msg) => {
                const n = JSON.parse(msg.body);
                addNotification(`🌐 GLOBAL: ${n.message}`);
            });
        });

        return () => { if (stompClient) stompClient.disconnect(); };
    }, [user?.id]);

    const addNotification = (msg) => {
        const id = Date.now();
        setNotifications(prev => [{ id, msg }, ...prev].slice(0, 3)); // Keep last 3
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 8000);
    };

    if (notifications.length === 0) return null;

    return (
        <div style={{
            position: 'fixed', top: '80px', right: '20px', zIndex: '9999',
            display: 'flex', flexDirection: 'column', gap: '10px',
            pointerEvents: 'none'
        }}>
            {notifications.map(n => (
                <div key={n.id} className="glass-panel bounce-in" style={{
                    padding: '1rem 1.5rem', background: 'rgba(139, 92, 246, 0.95)',
                    color: 'white', fontSize: '0.8rem', fontWeight: 700,
                    borderRadius: '12px', border: '1px solid var(--primary-bright)',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                    maxWidth: '300px', pointerEvents: 'auto'
                }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <span>🔔</span>
                        <span>{n.msg}</span>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default LiveNotificationBar;
