import axios from 'axios';

const isProduction = import.meta.env.PROD;

// Production Cloud URLs (Vercel/Render/etc)
const CLOUD_URLS = {
    USER_SERVICE: "https://your-user-service.onrender.com",
    EVENT_SERVICE: "https://your-event-service.onrender.com",
    BOOKING_SERVICE: "https://your-booking-service.onrender.com"
};

// Local Development URLs (Spring Boot)
const LOCAL_URLS = {
    USER_SERVICE: "http://localhost:8081",
    EVENT_SERVICE: "http://localhost:8082",
    BOOKING_SERVICE: "http://localhost:8083"
};

const BASE_URLS = isProduction ? CLOUD_URLS : LOCAL_URLS;

const api = {
    // Note: Spring Boot controllers usually have /api/users, /api/events, etc.
    user: axios.create({ baseURL: `${BASE_URLS.USER_SERVICE}/api/users` }),
    event: axios.create({ baseURL: `${BASE_URLS.EVENT_SERVICE}/api/events` }),
    booking: axios.create({ baseURL: `${BASE_URLS.BOOKING_SERVICE}/api/bookings` })
};

export default api;
