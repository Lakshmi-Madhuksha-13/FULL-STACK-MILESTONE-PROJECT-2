import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BookingForm = ({ event, onBookingSuccess, user }) => {
  const [ticketCount, setTicketCount] = useState(1);
  const [attendees, setAttendees] = useState([{ name: '', email: '', department: '' }]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync attendees array with ticket count
  useEffect(() => {
    const count = parseInt(ticketCount) || 1;
    if (attendees.length < count) {
      const needed = count - attendees.length;
      const newAttendees = Array(needed).fill(0).map(() => ({ name: '', email: '', department: '' }));
      setAttendees([...attendees, ...newAttendees]);
    } else if (attendees.length > count) {
      setAttendees(attendees.slice(0, count));
    }
  }, [ticketCount]);

  const handleAttendeeChange = (index, field, value) => {
    const updatedAttendees = [...attendees];
    updatedAttendees[index][field] = value;
    setAttendees(updatedAttendees);
  };

  const handleReset = () => {
    setTicketCount(1);
    setAttendees([{ name: '', email: '', department: '' }]);
    setError('');
  };

  const validate = () => {
    for (let i = 0; i < attendees.length; i++) {
        const a = attendees[i];
        if (!a.name || !a.email || !a.department) {
            return `Please fill all details for Attendee #${i + 1}`;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(a.email)) {
            return `Invalid email format for Attendee #${i + 1}`;
        }
    }
    if (ticketCount > event.availableTickets) {
      return `Only ${event.availableTickets} tickets are available.`;
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      const bookingData = {
        userId: user.id,
        eventId: event.id,
        ticketsBooked: parseInt(ticketCount),
        totalAmount: ticketCount * event.price,
        attendeeDetails: JSON.stringify(attendees) // Pass as JSON string to backend
      };

      await axios.post('http://localhost:8083/api/bookings', bookingData);
      
      onBookingSuccess({
        userName: attendees[0].name, // Main attendee
        eventName: event.eventName,
        ticketsBooked: ticketCount,
        totalAmount: bookingData.totalAmount,
        attendees: attendees // Pass array for the success modal to show all names
      });
      handleReset();
    } catch (err) {
      setError(err.response?.data || "Booking failed. Please check availability.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!event || event.availableTickets === 0) return null;

  return (
    <div className="glass-panel">
      <h2 style={{ marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
        Book Tickets
      </h2>
      <form onSubmit={handleSubmit}>
        {error && <div className="error-text" style={{marginBottom: '1rem', padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid var(--danger)'}}>{error}</div>}
        
        <div className="form-group">
          <label>Number of Tickets</label>
          <input 
            type="number" 
            className="form-control" 
            value={ticketCount} 
            onChange={(e) => setTicketCount(Math.max(1, parseInt(e.target.value) || 1))} 
            min="1" max={event.availableTickets} 
          />
        </div>

        <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '0.5rem', marginBottom: '1.5rem' }}>
          {attendees.map((attendee, index) => (
            <div key={index} style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.5rem', marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
              <h4 style={{ margin: '0 0 1rem 0', color: 'var(--primary-color)' }}>Attendee #{index + 1}</h4>
              <div className="form-group">
                <label>Name</label>
                <input type="text" className="form-control" value={attendee.name} onChange={(e) => handleAttendeeChange(index, 'name', e.target.value)} placeholder="Full Name" />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" className="form-control" value={attendee.email} onChange={(e) => handleAttendeeChange(index, 'email', e.target.value)} placeholder="Email ID" />
                </div>
                <div className="form-group">
                  <label>Department</label>
                  <input type="text" className="form-control" value={attendee.department} onChange={(e) => handleAttendeeChange(index, 'department', e.target.value)} placeholder="e.g. CS" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Processing...' : `Pay ₹${ticketCount * event.price}`}
          </button>
          <button type="button" onClick={handleReset} className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--secondary-color)', color: 'var(--text-primary)' }}>
            Reset
          </button>
        </div>
      </form>
    </div>
  );
};

export default BookingForm;
