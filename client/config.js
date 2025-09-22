// File: client/config.js

// This file contains the network configuration for the client app.

// ⚠️ CRITICAL: Replace this with your server PC's static IP address on the LAN.
// Do NOT use 'localhost' or '127.0.0.1' because the mobile app runs on a different
// device than the server.
const SERVER_IP = '192.168.36.207';

// The port your server is running on (from your .env file).
const SERVER_PORT = 3000;

// The base URL for your API endpoints.
export const API_URL = `http://${SERVER_IP}:${SERVER_PORT}/api`;

// The URL for your WebSocket server.
export const SOCKET_URL = `http://${SERVER_IP}:${SERVER_PORT}`;