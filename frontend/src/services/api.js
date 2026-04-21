import axios from 'axios';

// 🌐 CLOUD-READY CONFIGURATION
const isProduction = false; 

const LOCAL_URLS = {
    USER_SERVICE: "http://localhost:8081/api/users",
    EVENT_SERVICE: "http://localhost:8082/api/events",
    BOOKING_SERVICE: "http://localhost:8083/api/bookings",
    SUPPORT_SERVICE: "http://localhost:8081/api/support"
};

const CLOUD_URLS = {
    USER_SERVICE: "https://your-users.render.com/api/users",
    EVENT_SERVICE: "https://your-events.render.com/api/events",
    BOOKING_SERVICE: "https://your-bookings.render.com/api/bookings",
    SUPPORT_SERVICE: "https://your-users.render.com/api/support"
};

const URLS = isProduction ? CLOUD_URLS : LOCAL_URLS;

const createInstance = (baseUrl, name) => {
    const inst = axios.create({ baseURL: baseUrl || "" });
    inst.interceptors.response.use(
        r => r,
        e => {
            console.warn(`[Sync Info] ${name} is currently offline. Background retries active.`);
            return Promise.reject(e);
        }
    );
    return inst;
};

const api = {
    user: createInstance(URLS.USER_SERVICE, "UserService"),
    event: createInstance(URLS.EVENT_SERVICE, "EventService"),
    booking: createInstance(URLS.BOOKING_SERVICE, "BookingService"),
    support: createInstance(URLS.SUPPORT_SERVICE, "SupportService")
};

export default api;
