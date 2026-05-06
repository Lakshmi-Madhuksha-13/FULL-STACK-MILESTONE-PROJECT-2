import React from 'react';

const MapView = ({ venue, eventName }) => {
  // Generate a Google Maps Embed URL based on the venue name
  const encodedVenue = encodeURIComponent(venue || 'Vel Tech University, Chennai');
  const mapUrl = `https://www.google.com/maps/embed/v1/place?key=AIzaSy...&q=${encodedVenue}`;
  
  // Since I don't have a real API key, I'll use a standard search URL or a fallback
  const fallbackUrl = `https://maps.google.com/maps?q=${encodedVenue}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', marginTop: '2rem' }}>
      <h3 style={{ fontSize: '0.9rem', fontWeight: 900, marginBottom: '1rem', opacity: 0.7 }}>📍 EVENT LOCATION</h3>
      <div style={{ position: 'relative', height: '300px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
        <iframe
          title="Event Map"
          width="100%"
          height="100%"
          frameBorder="0"
          style={{ border: 0 }}
          src={fallbackUrl}
          allowFullScreen
        ></iframe>
        <div style={{ position: 'absolute', bottom: '15px', right: '15px' }}>
            <a 
                href={`https://www.google.com/maps/search/?api=1&query=${encodedVenue}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn-elite"
                style={{ background: 'var(--primary)', border: 'none', padding: '0.6rem 1.2rem', fontSize: '0.7rem' }}
            >
                OPEN IN GOOGLE MAPS
            </a>
        </div>
      </div>
      <p style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: '0.8rem', textAlign: 'center' }}>
        {venue || 'Location coordinates being finalized...'}
      </p>
    </div>
  );
};

export default MapView;
