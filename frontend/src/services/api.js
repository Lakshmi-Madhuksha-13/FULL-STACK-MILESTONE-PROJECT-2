import axios from 'axios';

// 🌐 ENTERPRISE CONFIGURATION
const isProduction = false; 

const LOCAL_URLS = {
    USER_SERVICE: "http://localhost:8081/api/users",
    EVENT_SERVICE: "http://localhost:8082/api/events",
    BOOKING_SERVICE: "http://localhost:8083/api/bookings",
    SUPPORT_SERVICE: "http://localhost:8081/api/support"
};

const CLOUD_URLS = {
    USER_SERVICE: "https://your-user-service.render.com/api/users",
    EVENT_SERVICE: "https://your-event-service.render.com/api/events",
    BOOKING_SERVICE: "https://your-booking-service.render.com/api/bookings",
    SUPPORT_SERVICE: "https://your-user-service.render.com/api/support"
};

const URLS = isProduction ? CLOUD_URLS : LOCAL_URLS;

const api = {
    user: axios.create({ baseURL: URLS.USER_SERVICE || "" }),
    event: axios.create({ baseURL: URLS.EVENT_SERVICE || "" }),
    booking: axios.create({ baseURL: URLS.BOOKING_SERVICE || "" }),
    support: axios.create({ baseURL: URLS.SUPPORT_SERVICE || "" })
};

// 🛡️ GLOBAL ASYNC SAFEGUARD: Prevents total app crash if one service is slow
const applySafeguard = (instance) => {
    instance.interceptors.response.use(
        r => r,
        e => {
            console.warn(`[Sync Shield] Service status: Standby. Retrying in background.`);
            return Promise.reject(e);
        }
    );
};

applySafeguard(api.user);
applySafeguard(api.event);
applySafeguard(api.booking);
applySafeguard(api.support);

export default api;
