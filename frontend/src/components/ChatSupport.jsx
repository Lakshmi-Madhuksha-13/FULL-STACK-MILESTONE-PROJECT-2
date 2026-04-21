import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';

const ChatSupport = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [user, setUser] = useState(null);
    const scrollRef = useRef();

    useEffect(() => {
        const stored = localStorage.getItem('currentUser');
        if (stored && stored !== "undefined") {
            try { setUser(JSON.parse(stored)); } catch(e) {}
        }
    }, []);

    useEffect(() => {
        if (user && isOpen) {
            fetchMessages();
            const interval = setInterval(fetchMessages, 4000);
            return () => clearInterval(interval);
        }
    }, [user, isOpen]);

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
        const msg = { userId: user.id, senderName: user.name, message: input, type: 'USER' };
        await api.support.post('/send', msg);
        setInput('');
        fetchMessages();
    };

    if (!user) return null;

    return (
        <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: '5000' }}>
            <div className={`pop-chat-container ${isOpen ? 'active' : ''}`}>
                <div className="pop-chat-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <div className="status-pulse"></div>
                        <div><strong style={{fontSize: '0.9rem'}}>HEAL INTEL HUB</strong><br/><small style={{opacity: 0.5, fontSize: '0.6rem'}}>OFFICIAL SUPPORT</small></div>
                    </div>
                    <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>✕</button>
                </div>
                
                <div className="pop-chat-body" ref={scrollRef}>
                    <div className="intel-intro">Syncing with Technical Command...</div>
                    {messages.map((m, i) => (
                        <div key={i} className={`msg-bubble ${m.type === 'USER' ? 'user' : 'support'}`}>
                            {m.message}
                            <div className="msg-time">{m.type === 'USER' ? 'You' : 'Management'}</div>
                        </div>
                    ))}
                </div>

                <div className="pop-chat-footer">
                    <input 
                        type="text" placeholder="Mission inquiry..." 
                        value={input} onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <button onClick={handleSend}>➔</button>
                </div>
            </div>

            {!isOpen && (
                <button className="chat-launcher-pulse" onClick={() => setIsOpen(true)}>
                    <span>💬</span>
                    <div className="pulse-ring"></div>
                </button>
            )}

            <style>{`
                .pop-chat-container {
                    width: 360px; height: 500px; background: #0b0e14; border: 1px solid var(--primary);
                    border-radius: 20px; box-shadow: 0 25px 60px rgba(0,0,0,0.8);
                    display: flex; flexDirection: column; overflow: hidden;
                    transform: translateY(120%) scale(0.8); transition: 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); opacity: 0;
                }
                .pop-chat-container.active { transform: translateY(0) scale(1); opacity: 1; }
                .pop-chat-header { background: rgba(139, 92, 246, 0.1); padding: 1.2rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--glass-border); }
                .status-pulse { width: 8px; height: 8px; background: var(--success); border-radius: 50%; box-shadow: 0 0 10px var(--success); animation: pulse 2s infinite; }
                .pop-chat-body { flex: 1; overflow-y: auto; padding: 1.2rem; display: flex; flex-direction: column; gap: 1rem; }
                .intel-intro { text-align: center; font-size: 0.65rem; opacity: 0.3; letter-spacing: 1px; margin-bottom: 1rem; }
                .msg-bubble { padding: 0.8rem 1rem; border-radius: 12px; max-width: 80%; position: relative; font-size: 0.85rem; line-height: 1.4; }
                .msg-bubble.user { align-self: flex-end; background: var(--primary); color: white; border-bottom-right-radius: 2px; }
                .msg-bubble.support { align-self: flex-start; background: rgba(255,255,255,0.05); color: var(--text-main); border-bottom-left-radius: 2px; border: 1px solid var(--glass-border); }
                .msg-time { font-size: 0.6rem; opacity: 0.4; margin-top: 0.4rem; font-weight: bold; }
                .pop-chat-footer { padding: 1rem; display: flex; gap: 0.8rem; background: rgba(0,0,0,0.2); }
                .pop-chat-footer input { flex: 1; background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); border-radius: 10px; color: white; padding: 0.6rem 1rem; font-size: 0.8rem; }
                .pop-chat-footer button { width: 45px; height: 45px; background: var(--primary); border: none; border-radius: 10px; color: white; cursor: pointer; transition: 0.3s; }
                .pop-chat-footer button:hover { transform: translateX(3px); box-shadow: 0 0 15px var(--primary); }
                
                .chat-launcher-pulse { 
                    width: 65px; height: 65px; border-radius: 50%; background: var(--primary); border: none; cursor: pointer;
                    display: flex; align-items: center; justify-content: center; font-size: 1.8rem; color: white; position: relative;
                }
                .pulse-ring { 
                    position: absolute; width: 100%; height: 100%; border: 2px solid var(--primary); border-radius: 50%;
                    animation: ringPulse 2s infinite; 
                }
                @keyframes pulse { 0% { opacity: 0.4; } 50% { opacity: 1; } 100% { opacity: 0.4; } }
                @keyframes ringPulse { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(1.6); opacity: 0; } }
            `}</style>
        </div>
    );
};

export default ChatSupport;
