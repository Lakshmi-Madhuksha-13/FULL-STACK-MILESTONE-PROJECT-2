import axios from 'axios';

// 🌐 ENTERPRISE CLOUD SYNC
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'; 

const getBaseURL = (port) => {
    const host = window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname;
    return `http://${host}:${port}/api`;
};

const LOCAL_URLS = {
    USER_SERVICE: getBaseURL(8081) + "/users",
    EVENT_SERVICE: getBaseURL(8082) + "/events",
    BOOKING_SERVICE: getBaseURL(8083) + "/bookings",
    COUPON_SERVICE: getBaseURL(8083) + "/coupons",
    SUPPORT_SERVICE: getBaseURL(8081) + "/support"
};

const CLOUD_URLS = {
    USER_SERVICE: "/api/users",
    EVENT_SERVICE: "/api/events",
    BOOKING_SERVICE: "/api/bookings",
    COUPON_SERVICE: "/api/coupons",
    SUPPORT_SERVICE: "/api/support"
};

const URLS = isProduction ? CLOUD_URLS : LOCAL_URLS;

const api = {
    user: axios.create({ baseURL: URLS.USER_SERVICE }),
    event: axios.create({ baseURL: URLS.EVENT_SERVICE }),
    booking: axios.create({ baseURL: URLS.BOOKING_SERVICE }),
    coupon: axios.create({ baseURL: URLS.COUPON_SERVICE }),
    support: axios.create({ baseURL: URLS.SUPPORT_SERVICE })
};

// 🛡️ API INTERCEPTORS (Optional: Add Auth tokens here if needed)
// No global error-swallowing to ensure proper component state management

export default api;
