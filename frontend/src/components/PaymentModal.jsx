import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

const PaymentModal = ({ amount, eventName, onSuccess, onCancel }) => {
  const [method, setMethod] = useState('card'); // 'card' | 'upi' | 'netbanking'
  const [step, setStep] = useState('form');     // 'form' | 'processing' | 'success'
  const [card, setCard] = useState({ number: '', name: '', expiry: '', cvv: '' });
  const [upi, setUpi] = useState('');
  const [error, setError] = useState('');

  /* ── CARD FORMATTERS ── */
  const fmtCardNum = v => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  const fmtExpiry  = v => { const d = v.replace(/\D/g, '').slice(0, 4); return d.length > 2 ? d.slice(0,2) + '/' + d.slice(2) : d; };
  const getCardBrand = n => {
    const d = n.replace(/\s/g, '');
    if (d.startsWith('4')) return { label: 'VISA', color: '#1a1f71' };
    if (/^5[1-5]/.test(d)) return { label: 'MC', color: '#eb001b' };
    if (d.startsWith('6')) return { label: 'RUPAY', color: '#f47721' };
    return null;
  };
  const brand = getCardBrand(card.number);

  /* ── VALIDATE ── */
  const validate = () => {
    if (method === 'card') {
      if (card.number.replace(/\s/g,'').length < 16) return 'Enter a valid 16-digit card number.';
      if (!card.name.trim()) return 'Cardholder name is required.';
      if (card.expiry.length < 5) return 'Enter a valid expiry (MM/YY).';
      const [mm, yy] = card.expiry.split('/');
      const exp = new Date(2000 + parseInt(yy), parseInt(mm) - 1);
      if (exp < new Date()) return 'This card has expired.';
      if (card.cvv.length < 3) return 'Enter a valid CVV.';
    }
    if (method === 'upi') {
      if (upi.length > 0 && !upi.includes('@')) return 'Enter a valid UPI ID (e.g. name@upi).';
    }
    return null;
  };

  const handlePay = () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    setStep('processing');
    // Simulate payment gateway processing (2s)
    setTimeout(() => { setStep('success'); setTimeout(onSuccess, 1800); }, 2200);
  };

  /* ── PROCESSING SCREEN ── */
  if (step === 'processing') return (
    <div style={overlay}>
      <div style={box}>
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ width: '60px', height: '60px', border: '4px solid var(--glass-border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 2rem auto' }} />
          <h3 style={{ margin: '0 0 0.5rem 0' }}>Processing Payment</h3>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Communicating with payment gateway...</p>
          <div style={{ marginTop: '1.5rem', fontSize: '1.5rem', fontWeight: 900, color: 'var(--primary)' }}>₹{amount}</div>
        </div>
      </div>
    </div>
  );

  /* ── SUCCESS SCREEN ── */
  if (step === 'success') return (
    <div style={overlay}>
      <div style={box}>
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem', animation: 'bounceIn 0.6s ease' }}>✅</div>
          <h3 className="gradient-text" style={{ fontSize: '1.8rem', margin: '0 0 0.5rem 0' }}>Payment Authorized!</h3>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>₹{amount} debited. Booking confirmed.</p>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.75rem', marginTop: '0.5rem' }}>Generating your pass...</p>
        </div>
      </div>
    </div>
  );

  /* ── PAYMENT FORM ── */
  return (
    <div style={overlay}>
      <div style={{ ...box, maxWidth: '500px', padding: '2.5rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.3rem' }}>Secure Checkout</h3>
            <p style={{ margin: 0, color: 'var(--text-dim)', fontSize: '0.8rem' }}>{eventName}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.65rem', opacity: 0.4, letterSpacing: '1px' }}>TOTAL DUE</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 950, color: 'var(--success)' }}>₹{amount}</div>
          </div>
        </div>

        {/* Security badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.72rem', color: 'var(--success)' }}>
          🔒 256-bit SSL Encrypted • PCI DSS Compliant
        </div>

        {/* Method Tabs */}
        <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.8rem' }}>
          {[['card','💳 Card'], ['upi','📱 UPI'], ['netbanking','🏦 Net Banking']].map(([id, label]) => (
            <button key={id} onClick={() => { setMethod(id); setError(''); }}
              style={{ flex: 1, padding: '0.7rem', borderRadius: '10px', border: `1px solid ${method === id ? 'var(--primary)' : 'var(--glass-border)'}`, background: method === id ? 'rgba(139,92,246,0.15)' : 'transparent', color: 'white', cursor: 'pointer', fontWeight: method === id ? 900 : 500, fontSize: '0.72rem', transition: '0.2s' }}>
              {label}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && <div style={{ padding: '0.8rem 1rem', background: 'rgba(244,63,94,0.08)', borderLeft: '3px solid var(--accent)', borderRadius: '6px', color: 'var(--vivid-pink)', fontSize: '0.82rem', marginBottom: '1.2rem' }}>{error}</div>}

        {/* ── CARD FORM ── */}
        {method === 'card' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ position: 'relative' }}>
              <label style={lbl}>CARD NUMBER</label>
              <input className="form-control" placeholder="1234 5678 9012 3456" value={card.number}
                onChange={e => setCard({ ...card, number: fmtCardNum(e.target.value) })}
                style={{ fontFamily: 'monospace', letterSpacing: '2px', paddingRight: '4rem' }} />
              {brand && <div style={{ position: 'absolute', right: '1rem', top: '2.4rem', fontSize: '0.65rem', fontWeight: 900, color: brand.color, background: 'white', padding: '2px 6px', borderRadius: '4px' }}>{brand.label}</div>}
            </div>
            <div>
              <label style={lbl}>CARDHOLDER NAME</label>
              <input className="form-control" placeholder="Name as on card" value={card.name}
                onChange={e => setCard({ ...card, name: e.target.value.toUpperCase() })} style={{ textTransform: 'uppercase' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={lbl}>EXPIRY</label>
                <input className="form-control" placeholder="MM/YY" value={card.expiry} maxLength={5}
                  onChange={e => setCard({ ...card, expiry: fmtExpiry(e.target.value) })} style={{ fontFamily: 'monospace' }} />
              </div>
              <div>
                <label style={lbl}>CVV</label>
                <input className="form-control" placeholder="•••" type="password" maxLength={4} value={card.cvv}
                  onChange={e => setCard({ ...card, cvv: e.target.value.replace(/\D/,'').slice(0,4) })} style={{ fontFamily: 'monospace' }} />
              </div>
            </div>
          </div>
        )}

        {/* ── UPI FORM ── */}
        {method === 'upi' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              <QRCodeSVG value={`upi://pay?pa=techfest@ybl&pn=TechFest&am=${amount}&cu=INR`} size={140} level="H" />
            </div>
            <div style={{ width: '100%', textAlign: 'center', marginBottom: '1rem', opacity: 0.5, fontSize: '0.8rem', fontWeight: 900 }}>OR ENTER UPI ID</div>
            <div style={{ width: '100%' }}>
              <label style={lbl}>UPI ID</label>
              <input className="form-control" placeholder="yourname@upi or @okaxis or @ybl"
                value={upi} onChange={e => setUpi(e.target.value)} />
              <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1.2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                {['GPay', 'PhonePe', 'Paytm', 'BHIM'].map(app => (
                  <div key={app} onClick={() => setUpi(`user@${app.toLowerCase()}`)} style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', transition: '0.2s' }}>{app}</div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── NET BANKING ── */}
        {method === 'netbanking' && (
          <div>
            <label style={lbl}>SELECT BANK</label>
            <select className="form-control" defaultValue="">
              <option value="" disabled>Choose your bank...</option>
              {['SBI', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Bank', 'PNB', 'Bank of Baroda', 'Canara Bank'].map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        )}

        {/* PAY BUTTON */}
        <button onClick={handlePay} className="btn-primary" style={{ marginTop: '2rem', height: '58px', fontSize: '1rem', fontWeight: 900, background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
          🔒 PAY ₹{amount} SECURELY
        </button>
        <button onClick={onCancel} style={{ width: '100%', marginTop: '0.8rem', background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '0.8rem', padding: '0.5rem' }}>
          Cancel & Go Back
        </button>
      </div>
    </div>
  );
};

const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(12px)' };
const box = { background: '#0b0e17', border: '1px solid var(--glass-border)', borderRadius: '20px', width: '100%', maxWidth: '500px', boxShadow: '0 40px 80px rgba(0,0,0,0.6)' };
const lbl = { display: 'block', fontSize: '0.65rem', fontWeight: 900, color: 'var(--text-dim)', marginBottom: '0.4rem', letterSpacing: '1px' };

export default PaymentModal;
