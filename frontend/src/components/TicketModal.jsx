import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { QRCodeCanvas } from 'qrcode.react';

const TicketModal = ({ booking, event, user, onClose }) => {
  const ticketRef = useRef();

  if (!booking || !event) return null;

  // Encode full ticket data into the QR
  const qrData = JSON.stringify({
    passId: `TF-${booking.id}`,
    event: event.eventName,
    holder: user?.name || 'Participant',
    email: user?.email || 'N/A',
    datetime: event.dateTime,
    venue: event.venue,
    seats: booking.ticketsBooked,
    status: booking.status
  });

  const handleDownloadPDF = async () => {
    const canvas = await html2canvas(ticketRef.current, {
      scale: 3,
      backgroundColor: '#ffffff',
      useCORS: true,
    });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Ticket-Pass-TF-${booking.id}.pdf`);
  };

  let attendees = [];
  try { attendees = JSON.parse(booking.attendeeDetails || '[]'); } catch { }

  const isCancelled = booking.status === 'CANCELLED' || booking.status === 'REFUNDED';

  const storyRef = useRef();

  const handleDownloadStory = async () => {
    const canvas = await html2canvas(storyRef.current, { scale: 3, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `FestStory-TF-${booking.id}.png`;
    link.href = imgData;
    link.click();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)',
      zIndex: 9999, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'flex-start', padding: '2rem 1rem',
      backdropFilter: 'blur(15px)', overflowY: 'auto'
    }}>

      <div style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        {/* REAL TICKET CONTAINER */}
        <div ref={ticketRef} style={{
          width: '100%', maxWidth: '380px', background: '#fff', borderRadius: '24px',
          overflow: 'hidden', boxShadow: '0 50px 100px rgba(0,0,0,0.5)',
          position: 'relative', color: '#1e293b'
        }}>
          {/* ... (Existing Ticket Content) ... */}
          {/* TOP BRANDING */}
          <div style={{ background: isCancelled ? '#94a3b8' : 'linear-gradient(135deg, #1e1b4b, #312e81)', padding: '2rem', color: 'white', textAlign: 'center' }}>
            <div style={{ fontSize: '0.6rem', letterSpacing: '4px', opacity: 0.6, marginBottom: '0.5rem' }}>TECHNICAL FEST 2026</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, textTransform: 'uppercase' }}>{event.eventName}</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '0.5rem' }}>{event.department} • Official Pass</div>
          </div>

          {/* TICKET CUT-OUT DIVIDER */}
          <div style={{ position: 'relative', height: '20px', background: '#fff' }}>
            <div style={{ position: 'absolute', left: '-10px', top: '0', width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(0,0,0,0.95)' }} />
            <div style={{ position: 'absolute', right: '-10px', top: '0', width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(0,0,0,0.95)' }} />
            <div style={{ borderTop: '2px dashed #e2e8f0', position: 'absolute', top: '10px', left: '20px', right: '20px' }} />
          </div>

          {/* MAIN DETAILS */}
          <div style={{ padding: '1.5rem 2.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
              <div>
                <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '1px' }}>HOLDER</div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{user?.name || 'Participant'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '1px' }}>TICKET ID</div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', fontFamily: 'monospace' }}>TF-{booking.id}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '1px' }}>DATE</div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{new Date(event.dateTime).toLocaleDateString()}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '1px' }}>TIME</div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{new Date(event.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '1px' }}>VENUE</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{event.venue || 'Main Auditorium, Tech Campus'}</div>
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.venue || 'Main Auditorium, Tech Campus')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#8b5cf6', fontSize: '0.75rem', fontWeight: 700, textDecoration: 'none', borderBottom: '1px dashed #8b5cf6' }}
                >
                  📍 NAVIGATE
                </a>
              </div>
            </div>

            {attendees.length > 0 && (
               <div style={{ marginBottom: '2rem', padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '1px', marginBottom: '0.5rem' }}>ATTENDEES ({booking.ticketsBooked})</div>
                  {attendees.map((a, i) => (
                    <div key={i} style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.2rem' }}>{i+1}. {a.name || a}</div>
                  ))}
               </div>
            )}
          </div>

          {/* BOTTOM QR SECTION */}
          <div style={{ background: '#f8fafc', padding: '2rem', textAlign: 'center', borderTop: '1px solid #f1f5f9' }}>
             <div style={{ background: '#fff', display: 'inline-block', padding: '15px', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', marginBottom: '1rem' }}>
                <QRCodeCanvas value={qrData} size={160} level={"H"} includeMargin={false} />
             </div>
             <div style={{ fontSize: '0.6rem', color: '#94a3b8', letterSpacing: '2px', fontWeight: 800, marginBottom: '1.5rem' }}>SCAN TO VALIDATE ENTRY</div>
             
             {/* 📍 MINI MAP PREVIEW */}
             <div style={{ borderRadius: '15px', overflow: 'hidden', border: '1px solid #e2e8f0', height: '120px' }}>
                <iframe
                  title="Ticket Venue Map"
                  width="100%"
                  height="120"
                  style={{ border: 'none' }}
                  loading="lazy"
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(event.venue)}&output=embed&z=15`}
                />
             </div>
          </div>
        </div>

        {/* 📱 SOCIAL STORY GENERATOR (Hidden but Rendered for Export) */}
        {!isCancelled && (
          <div ref={storyRef} style={{
            width: '1080px', height: '1920px', position: 'fixed', left: '-5000px', top: 0,
            background: 'linear-gradient(135deg, #0f172a, #1e1b4b)', padding: '80px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Outfit', sans-serif", color: 'white'
          }}>
             <div style={{ position: 'absolute', top: '100px', fontSize: '2.5rem', fontWeight: 900, letterSpacing: '15px', opacity: 0.3 }}>NEXUS 2026</div>
             <div style={{ 
               width: '800px', height: '800px', borderRadius: '50px', border: '20px solid var(--primary)',
               display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
               textAlign: 'center', padding: '60px', position: 'relative',
               background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(50px)',
               boxShadow: '0 0 100px rgba(139, 92, 246, 0.4)'
             }}>
                <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--accent)', marginBottom: '20px' }}>I'M ATTENDING</div>
                <div style={{ fontSize: '7rem', fontWeight: 950, lineHeight: 1.1, marginBottom: '40px', textTransform: 'uppercase' }}>{event.eventName}</div>
                <div style={{ width: '200px', height: '10px', background: 'var(--secondary)', marginBottom: '40px' }}></div>
                <div style={{ fontSize: '2.5rem', fontWeight: 600, opacity: 0.8 }}>📍 {event.venue}</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 600, opacity: 0.8, marginTop: '10px' }}>📅 {new Date(event.dateTime).toLocaleDateString()}</div>
             </div>
             <div style={{ position: 'absolute', bottom: '150px', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '20px' }}>{user?.name}</div>
                <div style={{ fontSize: '1.5rem', opacity: 0.5, letterSpacing: '5px' }}>OFFICIAL TICKET HOLDER</div>
             </div>
             {/* Decorative Neon Circles */}
             <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '500px', height: '500px', borderRadius: '50%', background: 'var(--primary)', filter: 'blur(200px)', opacity: 0.3 }}></div>
             <div style={{ position: 'absolute', bottom: '-100px', left: '-100px', width: '500px', height: '500px', borderRadius: '50%', background: 'var(--secondary)', filter: 'blur(200px)', opacity: 0.3 }}></div>
          </div>
        )}
      </div>

      {/* ACTION BUTTONS BELOW TICKET */}
      <div style={{ marginTop: '2.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center', width: '100%', maxWidth: '400px' }}>
         {!isCancelled && (
           <>
             <button onClick={handleDownloadPDF} style={{ flex: 1, minWidth: '120px', background: 'var(--primary)', border: 'none', color: 'white', padding: '1rem', borderRadius: '16px', cursor: 'pointer', fontWeight: 900, boxShadow: '0 10px 20px rgba(139, 92, 246, 0.3)' }}>⬇ DOWNLOAD PDF</button>
             <button onClick={handleDownloadStory} style={{ flex: 1, minWidth: '120px', background: 'var(--secondary)', border: 'none', color: 'white', padding: '1rem', borderRadius: '16px', cursor: 'pointer', fontWeight: 900, boxShadow: '0 10px 20px rgba(236, 72, 153, 0.3)' }}>📱 SOCIAL STORY</button>
           </>
         )}
         <button onClick={onClose} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', padding: '1rem', borderRadius: '16px', cursor: 'pointer', fontWeight: 700, marginTop: '0.5rem' }}>✕ CLOSE PASS</button>
      </div>

      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', marginTop: '2rem', textAlign: 'center' }}>
         This is a digital entry pass generated by Technical Fest Management System.<br/>
         Present this pass at the registration desk for verification.
      </div>
    </div>
  );
};

export default TicketModal;
