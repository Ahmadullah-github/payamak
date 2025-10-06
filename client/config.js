// Configuration for API endpoints
// For local development on localhost
export const API_URL_LOCAL = 'http://localhost:3000/api';
export const SOCKET_URL_LOCAL = 'http://localhost:3000';

// For device testing (replace with your actual IP)
export const API_URL_DEVICE = 'http://192.168.102.63:3000/api';
export const SOCKET_URL_DEVICE = 'http://192.168.102.63:3000';

// Auto-detect environment
// For development, use device IP for better compatibility
const isDevice = true; // Use device mode to avoid localhost connection issues

export const API_URL = isDevice ? API_URL_DEVICE : API_URL_LOCAL;
export const SOCKET_URL = isDevice ? SOCKET_URL_DEVICE : SOCKET_URL_LOCAL;

console.log('🌐 API Configuration:', { API_URL, SOCKET_URL, isDevice });