// API Configuration
const isDev = import.meta.env.DEV;
const isProd = import.meta.env.PROD;

// In development, we can use the local backend directly or via proxy
// In production (Docker), we always use the relative path /api to go through Nginx
const getBaseUrl = () => {
    if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
    // Empty string means use relative path, which works with both Vite proxy and Nginx proxy
    return '';
};

const getWsBaseUrl = () => {
    if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL;

    // Construct WebSocket URL based on current location
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}`;
};

export const API_CONFIG = {
    BASE_URL: getBaseUrl(),
    API_VERSION: '/api/v1',
    WS_URL: getWsBaseUrl(),
};

export const getApiUrl = (endpoint) => {
    return `${API_CONFIG.BASE_URL}${API_CONFIG.API_VERSION}${endpoint}`;
};

export const getWsUrl = (endpoint) => {
    return `${API_CONFIG.WS_URL}${API_CONFIG.API_VERSION}${endpoint}`;
};
