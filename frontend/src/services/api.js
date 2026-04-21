import axios from 'axios';

const isProduction = import.meta.env.PROD;

const CLOUD_URLS = {
    USER_SERVICE: "https://your-user-service.onrender.com/api/users",
    EVENT_SERVICE: "https://your-event-service.onrender.com/api/events",
    BOOKING_SERVICE: "https://your-booking-service.onrender.com/api/bookings"
};

const LOCAL_URLS = {
    USER_SERVICE: "http://localhost:8081/api/users",
    EVENT_SERVICE: "http://localhost:8082/api/events",
    BOOKING_SERVICE: "http://localhost:8083/api/bookings"
};

const BASE_URLS = isProduction ? CLOUD_URLS : LOCAL_URLS;

const api = {
    user: axios.create({ baseURL: BASE_URLS.USER_SERVICE }),
    event: axios.create({ baseURL: BASE_URLS.EVENT_SERVICE }),
    booking: axios.create({ baseURL: BASE_URLS.BOOKING_SERVICE })
};

// Add interceptors for debugging
api.event.interceptors.response.use(
    response => response,
    error => {
        console.error("EVENT_SERVICE_OFFLINE:", error.config.baseURL);
        return Promise.reject(error);
    }
);

export default api;
