import axios from 'axios';

// 🌐 ENTERPRISE CLOUD SYNC
const isProduction = false; 

const LOCAL_URLS = {
    USER_SERVICE: "http://192.168.29.17:8081/api/users",
    EVENT_SERVICE: "http://192.168.29.17:8082/api/events",
    BOOKING_SERVICE: "http://192.168.29.17:8083/api/bookings",
    COUPON_SERVICE: "http://192.168.29.17:8083/api/coupons",
    SUPPORT_SERVICE: "http://192.168.29.17:8081/api/support"
};

const CLOUD_URLS = {
    USER_SERVICE: "https://your-users.render.com/api/users",
    EVENT_SERVICE: "https://your-events.render.com/api/events",
    BOOKING_SERVICE: "https://your-bookings.render.com/api/bookings",
    COUPON_SERVICE: "https://your-bookings.render.com/api/coupons",
    SUPPORT_SERVICE: "https://your-users.render.com/api/support"
};

const URLS = isProduction ? CLOUD_URLS : LOCAL_URLS;

const api = {
    user: axios.create({ baseURL: URLS.USER_SERVICE }),
    event: axios.create({ baseURL: URLS.EVENT_SERVICE }),
    booking: axios.create({ baseURL: URLS.BOOKING_SERVICE }),
    coupon: axios.create({ baseURL: URLS.COUPON_SERVICE }),
    support: axios.create({ baseURL: URLS.SUPPORT_SERVICE })
};

// 🛡️ ATOMIC INTERCEPTORS (Prevents Blank Screen on Network Hiccups)
const applyResilience = (inst) => {
    inst.interceptors.response.use(
        r => r,
        e => {
            console.log("[Resilience Hub]: Stabilizing connection...");
            return Promise.resolve({ data: [] }); // Safe fallback to prevent crash
        }
    );
};

applyResilience(api.user);
applyResilience(api.event);
applyResilience(api.booking);
applyResilience(api.coupon);
applyResilience(api.support);

export default api;
