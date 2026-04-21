import React, { useState, useEffect } from 'react';
import api from '../services/api';

const ChatSupport = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [user, setUser] = useState(null);

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
            {isOpen ? (
                <div className="glass-panel page-transition" style={{ 
                    width: '350px', height: '480px', display: 'flex', flexDirection: 'column', 
                    padding: '1.2rem', background: '#020617', border: '1px solid var(--primary)',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                        <div><strong style={{color: 'var(--primary)'}}>HEAL DESK</strong><br/><small style={{opacity: 0.5}}>Response system active</small></div>
                        <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '1.2rem' }}>✖</button>
                    </div>
                    
                    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.8rem', paddingRight: '0.5rem' }}>
                        {messages.map((m, i) => (
                            <div key={i} style={{ 
                                alignSelf: m.type === 'USER' ? 'flex-end' : 'flex-start',
                                background: m.type === 'USER' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                padding: '0.8rem 1rem', borderRadius: '1rem', maxWidth: '80%', fontSize: '0.85rem'
                            }}>
                                {m.message}
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1rem' }}>
                        <input 
                            type="text" className="form-control" placeholder="Message support..." 
                            value={input} onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            style={{ background: 'rgba(255,255,255,0.03)' }}
                        />
                        <button className="btn-primary" onClick={handleSend} style={{ width: '80px', height: '45px' }}>SEND</button>
                    </div>
                </div>
            ) : (
                <button 
                    onClick={() => setIsOpen(true)}
                    className="btn-primary" 
                    style={{ 
                        width: '65px', height: '65px', borderRadius: '50%', fontSize: '1.8rem', 
                        boxShadow: '0 10px 30px var(--primary-glow)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                >
                    💬
                </button>
            )}
        </div>
    );
};

export default ChatSupport;
