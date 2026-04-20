import React from 'react';

const BookingSummary = ({ summary, onDismiss }) => {
  if (!summary) return null;

  return (
    <div className="glass-panel" style={{ marginTop: '2rem', border: '1px solid var(--success)', background: 'rgba(34, 197, 94, 0.05)' }}>
      <div className="success-message">
        <strong>Booking Confirmed!</strong> Your tickets have been successfully booked.
      </div>
      
      <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
        Booking Summary
      </h3>
      
      <div style={{ display: 'grid', gap: '0.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Name:</span>
          <strong>{summary.userName}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Event:</span>
          <strong>{summary.eventName}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Tickets:</span>
          <strong>{summary.ticketsBooked}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px dashed rgba(255,255,255,0.2)' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Total Amount:</span>
          <strong style={{ fontSize: '1.25rem', color: 'var(--success)' }}>₹{summary.totalAmount?.toFixed(2)}</strong>
        </div>
      </div>

      <button onClick={onDismiss} className="btn-primary" style={{ marginTop: '1.5rem' }}>
        Book Another Ticket
      </button>
    </div>
  );
};

export default BookingSummary;
