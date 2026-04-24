import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const TicketModal = ({ booking, event, user, onClose }) => {
  const ticketRef = useRef();

  if (!booking || !event) return null;

  // Encode full ticket data into the QR — scannable and verifiable
  const qrData = JSON.stringify({
    passId: `TF-${booking.id}`,
    event: event.eventName,
    venue: event.venue,
    holder: user?.name || 'Participant',
    slots: booking.ticketsBooked,
    amount: booking.totalAmount,
    status: booking.status || 'CONFIRMED',
    issued: new Date().toISOString().split('T')[0],
  });

  const handleDownloadPDF = async () => {
    const canvas = await html2canvas(ticketRef.current, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
    });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`TechFest-Pass-TF-${booking.id}.pdf`);
  };

  let attendees = [];
  try { attendees = JSON.parse(booking.attendeeDetails || '[]'); if (!Array.isArray(attendees)) attendees = []; } catch { }

  const isCancelled = booking.status === 'CANCELLED';
  const isRefunded  = booking.status === 'REFUNDED';

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)',
      zIndex: 9999, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '1rem',
      backdropFilter: 'blur(10px)',
    }}>
      {/* ── ACTION BAR ── */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center' }}>
        {!isCancelled && !isRefunded && (
          <button onClick={handleDownloadPDF} style={{
            background: 'var(--primary)', border: 'none', color: 'white',
            padding: '0.7rem 1.8rem', borderRadius: '10px', fontWeight: 900,
            cursor: 'pointer', fontSize: '0.85rem', letterSpacing: '1px',
          }}>
            ⬇ DOWNLOAD PDF
          </button>
        )}
        <button onClick={onClose} style={{
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
          color: 'white', padding: '0.7rem 1.8rem', borderRadius: '10px',
          cursor: 'pointer', fontWeight: 900, fontSize: '0.85rem',
        }}>
          ✕ CLOSE
        </button>
      </div>

      {/* ── PRINTABLE TICKET ── */}
      <div ref={ticketRef} style={{
        width: '380px', background: '#ffffff', borderRadius: '20px',
        overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
        position: 'relative', fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}>
        {/* CANCELLED WATERMARK */}
        {(isCancelled || isRefunded) && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 10, pointerEvents: 'none',
          }}>
            <div style={{
              fontSize: '4rem', fontWeight: 950, color: 'rgba(244,63,94,0.25)',
              transform: 'rotate(-35deg)', letterSpacing: '4px', border: '8px solid rgba(244,63,94,0.2)',
              padding: '0.5rem 2rem', borderRadius: '12px',
            }}>
              {isCancelled ? 'CANCELLED' : 'REFUNDED'}
            </div>
          </div>
        )}

        {/* HEADER */}
        <div style={{
          background: isCancelled ? '#64748b' : 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)',
          padding: '1.8rem 2rem', color: 'white',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.6rem', letterSpacing: '3px', opacity: 0.6, marginBottom: '0.3rem' }}>OFFICIAL ENTRY PASS</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, lineHeight: 1.1 }}>{event.eventName}</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '0.4rem' }}>{event.department}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.6rem', opacity: 0.6, letterSpacing: '2px' }}>PASS ID</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 900, fontFamily: 'monospace' }}>TF-{booking.id}</div>
            </div>
          </div>
        </div>

        {/* DASHED DIVIDER WITH CIRCLES */}
        <div style={{ position: 'relative', height: '24px', background: '#ffffff' }}>
          <div style={{ position: 'absolute', left: '-12px', top: '50%', transform: 'translateY(-50%)', width: '24px', height: '24px', borderRadius: '50%', background: '#0f0f1a' }} />
          <div style={{ position: 'absolute', right: '-12px', top: '50%', transform: 'translateY(-50%)', width: '24px', height: '24px', borderRadius: '50%', background: '#0f0f1a' }} />
          <div style={{ borderTop: '2px dashed #e2e8f0', position: 'absolute', top: '50%', left: '16px', right: '16px' }} />
        </div>

        {/* DETAILS */}
        <div style={{ padding: '1.5rem 2rem', background: '#ffffff' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem', marginBottom: '1.5rem' }}>
            {[
              { label: 'VENUE', value: event.venue || 'TBD' },
              { label: 'DATE', value: event.dateTime || 'TBD' },
              { label: 'HOLDER', value: user?.name || attendees[0]?.name || 'Participant' },
              { label: 'SLOTS', value: `× ${booking.ticketsBooked}` },
              { label: 'AMOUNT', value: `₹${booking.totalAmount}` },
              { label: 'STATUS', value: booking.status || 'CONFIRMED', statusColor: isCancelled ? '#f43f5e' : '#10b981' },
            ].map(({ label, value, statusColor }) => (
              <div key={label}>
                <div style={{ fontSize: '0.58rem', fontWeight: 900, color: '#94a3b8', letterSpacing: '1.5px', marginBottom: '0.2rem' }}>{label}</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: statusColor || '#1e293b' }}>{value}</div>
              </div>
            ))}
          </div>

          {/* ATTENDEES */}
          {attendees.length > 0 && (
            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '10px' }}>
              <div style={{ fontSize: '0.58rem', fontWeight: 900, color: '#94a3b8', letterSpacing: '1.5px', marginBottom: '0.8rem' }}>REGISTERED ATTENDEES</div>
              {attendees.slice(0, 3).map((a, i) => (
                <div key={i} style={{ fontSize: '0.78rem', color: '#1e293b', fontWeight: 700, marginBottom: '0.3rem' }}>
                  {i + 1}. {typeof a === 'string' ? a : a.name} 
                  {a.email && <span style={{ color: '#64748b', fontWeight: 400 }}> — {a.email}</span>}
                  {a.university && <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginLeft: '1rem', marginTop: '0.1rem', fontWeight: 600 }}>{a.department} • {a.university} • {a.yearOfStudy}</div>}
                </div>
              ))}
              {attendees.length > 3 && <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>+ {attendees.length - 3} more</div>}
            </div>
          )}
        </div>

        {/* DASHED DIVIDER */}
        <div style={{ position: 'relative', height: '24px', background: '#ffffff' }}>
          <div style={{ position: 'absolute', left: '-12px', top: '50%', transform: 'translateY(-50%)', width: '24px', height: '24px', borderRadius: '50%', background: '#0f0f1a' }} />
          <div style={{ position: 'absolute', right: '-12px', top: '50%', transform: 'translateY(-50%)', width: '24px', height: '24px', borderRadius: '50%', background: '#0f0f1a' }} />
          <div style={{ borderTop: '2px dashed #e2e8f0', position: 'absolute', top: '50%', left: '16px', right: '16px' }} />
        </div>

        {/* QR SECTION */}
        <div style={{ padding: '1.5rem 2rem 2rem 2rem', background: '#f8fafc', textAlign: 'center' }}>
          <div style={{ fontSize: '0.6rem', color: '#94a3b8', letterSpacing: '2px', fontWeight: 900, marginBottom: '1rem' }}>
            SCAN TO VERIFY ENTRY
          </div>
          <div style={{
            display: 'inline-block', background: 'white', padding: '12px',
            borderRadius: '16px', border: '2px solid #e2e8f0',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          }}>
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(qrData)}${isCancelled ? '&color=94a3b8' : '&color=1e1b4b'}&bgcolor=ffffff`}
              alt="Verification QR Code"
              style={{ width: '140px', height: '140px', display: 'block' }}
              crossOrigin="anonymous"
            />
          </div>
          <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '0.8rem', fontFamily: 'monospace', letterSpacing: '1px' }}>
            TF-{booking.id} • {new Date().toLocaleDateString('en-IN')}
          </div>
          <div style={{ fontSize: '0.6rem', color: '#cbd5e1', marginTop: '0.3rem' }}>
            techfest.veltech.ac.in/verify
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketModal;
