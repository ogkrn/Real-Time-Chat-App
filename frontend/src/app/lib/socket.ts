import { io } from "socket.io-client";

const backendUrl = process.env.NEXT_PUBLIC_API_URL || 
  (typeof window !== "undefined" && window.location.hostname === "localhost" 
    ? "http://localhost:5000" 
    : "https://real-time-chat-app-production-f44d.up.railway.app");

export const socket = io(backendUrl, {
  transports: ["polling", "websocket"],  // Polling first for reliability
  reconnection: true,
  reconnectionDelay: 500,
  reconnectionDelayMax: 3000,
  reconnectionAttempts: Infinity,
  timeout: 20000,
  path: '/socket.io/',
  upgrade: true,
  rememberUpgrade: false
});