import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';

const ChatSupport = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [user, setUser] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef();

    useEffect(() => {
        const updateUser = () => {
            const stored = localStorage.getItem('currentUser');
            if (stored && stored !== "undefined") {
                try { 
                    const parsed = JSON.parse(stored);
                    setUser(prev => (JSON.stringify(prev) !== JSON.stringify(parsed) ? parsed : prev));
                } catch(e) { setUser(null); }
            } else {
                setUser(null);
            }
        };

        updateUser();
        window.addEventListener('storage', updateUser);
        // Check periodically in case storage event doesn't fire (same tab changes)
        const checkInterval = setInterval(updateUser, 2000);
        
        return () => {
            window.removeEventListener('storage', updateUser);
            clearInterval(checkInterval);
        };
    }, []);

    useEffect(() => {
        if (user && isOpen) {
            fetchMessages();
            const interval = setInterval(fetchMessages, 4000);
            return () => clearInterval(interval);
        }
    }, [user, isOpen]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages, isTyping]);

    const fetchMessages = async () => {
        if (!user || !isOpen) return;
        try {
            const res = await api.support.get(`/history/${user.id}`);
            const data = Array.isArray(res.data) ? res.data : [];
            setMessages(prev => {
                if (data.length === prev.length && data[data.length-1]?.id === prev[prev.length-1]?.id) return prev;
                return data;
            });
        } catch (e) {}
    };

    const handleSend = async (customMsg = null) => {
        const text = customMsg || input;
        if (!text.trim() || !user) return;
        
        const msg = { userId: user.id, senderName: user.name, message: text, type: 'USER' };
        setMessages(prev => [...prev, msg]);
        if (!customMsg) setInput('');
        
        try {
            await api.support.post('/send', msg);
            setIsTyping(true);
            
            setTimeout(async () => {
                let aiReply = "";
                const lower = text.toLowerCase();
                const currentUserName = user?.name || "Participant";
                
                if (lower.includes("hello") || lower.includes("hi")) {
                    aiReply = `Greetings ${currentUserName}! I am the Nexus Intelligence Bot. How can I assist your mission today?`;
                }
                else if (lower.includes("coin")) aiReply = `You currently have ${user?.coins || 0} Nexus Coins, ${currentUserName}. You can earn more by scanning hidden QR codes around the venue!`;
                else if (lower.includes("ticket")) aiReply = "Your digital passes are secured in your 'Ticket Inventory'. Have your QR ready at the gate!";
                else if (lower.includes("refund")) aiReply = "Refund requests are processed through the 'Refund Tracker'. It usually takes 3-5 standard cycles.";
                else aiReply = `I've transmitted your query to the human support squad, ${currentUserName}. Is there anything else I can optimize for you?`;

                const aiMsg = { userId: user.id, senderName: 'Nexus Intelligence', message: aiReply, type: 'ADMIN' };
                await api.support.post('/send', aiMsg);
                setIsTyping(false);
                setTimeout(fetchMessages, 500);
            }, 1200);
        } catch (e) {}
    };

    if (!user) return null;

    return (
        <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: '9999' }}>
            {/* 💬 TRIGGER BUBBLE (Visible only when closed) */}
            {!isOpen && (
                <button 
                    onClick={() => setIsOpen(true)}
                    className="chat-trigger-btn"
                    style={{
                        width: '60px', height: '60px', borderRadius: '50%',
                        background: '#8b5cf6', border: 'none', cursor: 'pointer',
                        boxShadow: '0 10px 30px rgba(139, 92, 246, 0.4)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem',
                        transition: '0.3s transform ease'
                    }}>
                    💬
                </button>
            )}

            <div className={`chat-super-app ${isOpen ? 'active' : ''}`}>
                {/* 🏷️ HEADER */}
                <div className="chat-super-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div className="avatar-pulse">
                            <img src="https://ui-avatars.com/api/?name=Nexus+Guide&background=8b5cf6&color=fff" alt="AI" />
                            <div className="online-dot"></div>
                        </div>
                        <div>
                            <div style={{ fontWeight: 900, fontSize: '0.95rem' }}>Nexus Support</div>
                            <div style={{ fontSize: '0.65rem', opacity: 0.6, fontWeight: 700 }}>Online • Replies in seconds</div>
                        </div>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="close-btn">✕</button>
                </div>

                {/* 💬 BODY */}
                <div className="chat-super-body" ref={scrollRef}>
                    <div className="chat-date">TODAY</div>
                    <div className="msg-row support">
                        <div className="bubble">Hi {user.name}! 👋 Welcome to Nexus Support. How can we help you today?</div>
                    </div>

                    {messages.map((m, i) => (
                        <div key={i} className={`msg-row ${m.type === 'USER' ? 'user' : 'support'}`}>
                            <div className="bubble">{m.message}</div>
                        </div>
                    ))}

                    {isTyping && (
                        <div className="msg-row support">
                            <div className="bubble typing">
                                <span></span><span></span><span></span>
                            </div>
                        </div>
                    )}
                </div>

                {/* ⚡ QUICK ACTIONS */}
                <div className="quick-actions">
                    {['Track Ticket', 'Refund Policy', 'Earn Coins'].map(q => (
                        <button key={q} onClick={() => handleSend(q)} className="action-chip">{q}</button>
                    ))}
                </div>

                {/* ⌨️ FOOTER */}
                <div className="chat-super-footer">
                    <input 
                        type="text" placeholder="Type a message..." 
                        value={input} onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <button onClick={() => handleSend()} disabled={!input.trim()} className="send-btn">➔</button>
                </div>
            </div>

            {/* 🔘 FAB */}
            {!isOpen && (
                <button className="chat-fab-premium" onClick={() => setIsOpen(true)}>
                    <div className="fab-icon">💬</div>
                    <div className="fab-badge">1</div>
                    <div className="fab-rings"></div>
                </button>
            )}

            <style>{`
                .chat-super-app {
                    width: 380px; height: 600px; background: #ffffff; border-radius: 24px;
                    display: flex; flex-direction: column; overflow: hidden;
                    box-shadow: 0 20px 50px rgba(0,0,0,0.3);
                    transform: translateY(20px) scale(0.95); opacity: 0; pointer-events: none;
                    transition: 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                .chat-super-app.active { transform: translateY(0) scale(1); opacity: 1; pointer-events: auto; }
                
                /* HEADER */
                .chat-super-header {
                    background: #1a1a1a; color: white; padding: 1.5rem;
                    display: flex; justify-content: space-between; align-items: center;
                }
                .avatar-pulse { position: relative; width: 40px; height: 40px; }
                .avatar-pulse img { width: 100%; height: 100%; border-radius: 50%; border: 2px solid #8b5cf6; }
                .online-dot { position: absolute; bottom: 0; right: 0; width: 10px; height: 10px; background: #10b981; border-radius: 50%; border: 2px solid #1a1a1a; }
                .close-btn { background: rgba(255,255,255,0.1); border: none; color: white; width: 30px; height: 30px; border-radius: 50%; cursor: pointer; }

                /* BODY */
                .chat-super-body { flex: 1; overflow-y: auto; padding: 1.5rem; background: #f8f9fa; display: flex; flex-direction: column; gap: 1rem; }
                .chat-date { text-align: center; font-size: 0.65rem; color: #999; font-weight: 800; letter-spacing: 1px; margin: 1rem 0; }
                
                .msg-row { display: flex; width: 100%; }
                .msg-row.user { justify-content: flex-end; }
                .msg-row.support { justify-content: flex-start; }
                
                .bubble {
                    max-width: 80%; padding: 0.8rem 1.2rem; font-size: 0.85rem; line-height: 1.5; font-weight: 500;
                    border-radius: 18px; position: relative;
                }
                .msg-row.user .bubble { background: #1a1a1a; color: white; border-bottom-right-radius: 4px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
                .msg-row.support .bubble { background: white; color: #333; border-bottom-left-radius: 4px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }

                /* TYPING */
                .bubble.typing { display: flex; gap: 4px; padding: 1rem 1.2rem; }
                .bubble.typing span { width: 6px; height: 6px; background: #8b5cf6; border-radius: 50%; animation: typing 1s infinite alternate; }
                .bubble.typing span:nth-child(2) { animation-delay: 0.2s; }
                .bubble.typing span:nth-child(3) { animation-delay: 0.4s; }
                @keyframes typing { from { transform: translateY(0); opacity: 0.3; } to { transform: translateY(-5px); opacity: 1; } }

                /* QUICK ACTIONS */
                .quick-actions { padding: 0 1.5rem 1rem 1.5rem; background: #f8f9fa; display: flex; gap: 0.5rem; overflow-x: auto; scrollbar-width: none; }
                .action-chip { 
                    white-space: nowrap; padding: 0.5rem 1rem; background: white; border: 1px solid #eee; 
                    border-radius: 20px; font-size: 0.75rem; font-weight: 700; color: #8b5cf6; cursor: pointer; transition: 0.2s;
                }
                .action-chip:hover { background: #8b5cf6; color: white; border-color: #8b5cf6; }

                /* FOOTER */
                .chat-super-footer { padding: 1.2rem; background: white; border-top: 1px solid #eee; display: flex; gap: 1rem; }
                .chat-super-footer input { flex: 1; border: none; background: #f1f3f5; padding: 0.8rem 1.2rem; border-radius: 12px; font-size: 0.85rem; font-weight: 500; }
                .chat-super-footer input:focus { outline: 2px solid #8b5cf6; }
                .send-btn { width: 45px; height: 45px; border-radius: 12px; border: none; background: #8b5cf6; color: white; cursor: pointer; font-size: 1.2rem; transition: 0.3s; }
                .send-btn:hover { background: #1a1a1a; transform: rotate(-10deg) scale(1.1); }
                .send-btn:disabled { opacity: 0.3; cursor: not-allowed; transform: none; }

                /* FAB */
                .chat-fab-premium {
                    width: 70px; height: 70px; border-radius: 50%; background: #1a1a1a; border: none; cursor: pointer;
                    position: relative; display: flex; align-items: center; justify-content: center;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3); transition: 0.3s;
                }
                .chat-fab-premium:hover { transform: translateY(-5px) rotate(5deg); box-shadow: 0 15px 40px rgba(0,0,0,0.4); }
                .fab-icon { font-size: 1.8rem; color: white; }
                .fab-badge { 
                    position: absolute; top: 0; right: 0; background: #f43f5e; color: white; 
                    width: 22px; height: 22px; border-radius: 50%; font-size: 0.7rem; font-weight: 900;
                    display: flex; align-items: center; justify-content: center; border: 3px solid #1a1a1a;
                }
                .fab-rings { position: absolute; inset: -5px; border: 2px solid #8b5cf6; border-radius: 50%; animation: fabRing 2s infinite; pointer-events: none; }
                @keyframes fabRing { 0% { transform: scale(0.9); opacity: 1; } 100% { transform: scale(1.5); opacity: 0; } }
            `}</style>
        </div>
    );
};

export default ChatSupport;
