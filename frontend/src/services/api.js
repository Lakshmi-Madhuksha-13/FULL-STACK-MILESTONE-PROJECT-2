import axios from 'axios';

const isProduction = import.meta.env.PROD;

// Production Cloud URLs (Replace these after deploying backends)
const CLOUD_URLS = {
    USER_SERVICE: "https://your-user-service.onrender.com",
    EVENT_SERVICE: "https://your-event-service.onrender.com",
    BOOKING_SERVICE: "https://your-booking-service.onrender.com"
};

// Local Development URLs
const LOCAL_URLS = {
    USER_SERVICE: "http://localhost:8081",
    EVENT_SERVICE: "http://localhost:8082",
    BOOKING_SERVICE: "http://localhost:8083"
};

const BASE_URLS = isProduction ? CLOUD_URLS : LOCAL_URLS;

const api = {
    user: axios.create({ baseURL: `${BASE_URLS.USER_SERVICE}/api` }),
    event: axios.create({ baseURL: `${BASE_URLS.EVENT_SERVICE}/api` }),
    booking: axios.create({ baseURL: `${BASE_URLS.BOOKING_SERVICE}/api` })
};

export default api;
