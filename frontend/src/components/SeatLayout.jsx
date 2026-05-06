import React, { useState, useEffect } from 'react';

const SeatLayout = ({ eventId, basePrice = 0, onSeatsSelect, multiSelect = 1, existingBookings = [] }) => {
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
  const cols = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  
  const [selectedSeats, setSelectedSeats] = useState([]);

  const getSeatInfo = (seatId) => {
    const row = seatId.charAt(0);
    if (['A', 'B', 'C'].includes(row)) return { tier: 'DIAMOND', multiplier: 1.5, color: '#facc15', label: 'ELITE' };
    if (['D', 'E', 'F', 'G'].includes(row)) return { tier: 'GOLD', multiplier: 1.0, color: 'var(--primary)', label: 'PRO' };
    return { tier: 'SILVER', multiplier: 0.8, color: '#94a3b8', label: 'STD' };
  };

  const bookedSeats = existingBookings
    .filter(b => b.eventId?.toString() === eventId?.toString() && (b.status === 'CONFIRMED' || b.status === 'ADMITTED'))
    .map(b => b.seatNumber?.split(',').map(s => s.trim()))
    .flat()
    .filter(Boolean);

  const handleSeatClick = (seatId) => {
    if (bookedSeats.includes(seatId)) return;

    let newSelection = [...selectedSeats];
    if (newSelection.find(s => s.id === seatId)) {
        newSelection = newSelection.filter(s => s.id !== seatId);
    } else {
        const info = getSeatInfo(seatId);
        const seatObj = { id: seatId, price: basePrice * info.multiplier, tier: info.tier };
        if (newSelection.length < multiSelect) {
            newSelection.push(seatObj);
        } else if (multiSelect === 1) {
            newSelection = [seatObj];
        }
    }
    
    setSelectedSeats(newSelection);
    if (onSeatsSelect) onSeatsSelect(newSelection);
  };

  return (
    <div className="glass-panel" style={{ padding: '3.5rem', textAlign: 'center', background: 'rgba(0,0,0,0.3)', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 950, letterSpacing: '3px', color: 'var(--primary-bright)', margin: 0 }}>
              {multiSelect > 1 ? `SELECT ${multiSelect} NEXUS TERMINALS` : 'SELECT YOUR TERMINAL'}
          </h3>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
              <div style={{ fontSize: '0.65rem', color: '#facc15', fontWeight: 950 }}>ELITE DIAMOND (1.5x)</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 950 }}>PRO GOLD (1.0x)</div>
              <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 950 }}>STD SILVER (0.8x)</div>
          </div>
      </div>
      
      <div style={{ width: '90%', height: '12px', background: 'linear-gradient(90deg, transparent, var(--accent), transparent)', margin: '0 auto 4rem', borderRadius: '20px', boxShadow: '0 0 40px var(--accent)', opacity: 0.5 }}></div>
      <div style={{ fontSize: '0.7rem', opacity: 0.3, marginBottom: '4rem', letterSpacing: '8px', fontWeight: 900 }}>MAIN STAGE / PRESENTATION AREA</div>

      <div style={{ display: 'grid', gap: '1.2rem', justifyContent: 'center', overflowX: 'auto', padding: '1rem' }}>
        {rows.map(row => (
          <div key={row} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 950, opacity: 0.2, width: '30px' }}>{row}</span>
            <div style={{ display: 'flex', gap: '0.8rem' }}>
                {cols.map(col => {
                const seatId = `${row}${col}`;
                const isBooked = bookedSeats.includes(seatId);
                const selection = selectedSeats.find(s => s.id === seatId);
                const info = getSeatInfo(seatId);

                return (
                    <div 
                    key={seatId}
                    onClick={() => handleSeatClick(seatId)}
                    style={{
                        width: '38px', height: '38px', borderRadius: '10px',
                        cursor: isBooked ? 'not-allowed' : 'pointer',
                        background: isBooked ? '#f43f5e' : (selection ? info.color : 'rgba(255,255,255,0.03)'),
                        border: `1px solid ${isBooked ? '#f43f5e' : (selection ? info.color : 'rgba(255,255,255,0.1)')}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 950,
                        color: isBooked || selection ? 'white' : 'rgba(255,255,255,0.2)',
                        transition: '0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        transform: selection ? 'scale(1.25)' : 'scale(1)',
                        boxShadow: selection ? `0 0 30px ${info.color}` : 'none',
                        position: 'relative'
                    }}
                    >
                    {col}
                    {selection && <div style={{ position: 'absolute', top: '-15px', fontSize: '0.5rem', color: info.color, fontWeight: 900 }}>{info.label}</div>}
                    </div>
                );
                })}
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: 950, opacity: 0.2, width: '30px' }}>{row}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '3rem', marginTop: '5rem', fontSize: '0.75rem', fontWeight: 900, letterSpacing: '1px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}><div style={{ width: '16px', height: '16px', borderRadius: '5px', background: '#f43f5e' }}></div><span style={{ opacity: 0.5 }}>RESERVED</span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}><div style={{ width: '16px', height: '16px', borderRadius: '5px', background: '#facc15' }}></div><span style={{ opacity: 0.8, color: '#facc15' }}>ELITE</span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}><div style={{ width: '16px', height: '16px', borderRadius: '5px', background: 'var(--primary)' }}></div><span style={{ opacity: 0.8, color: 'var(--primary)' }}>PRO</span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}><div style={{ width: '16px', height: '16px', borderRadius: '5px', background: '#94a3b8' }}></div><span style={{ opacity: 0.8, color: '#94a3b8' }}>STANDARD</span></div>
      </div>
    </div>
  );
};

export default SeatLayout;
