import { io } from "socket.io-client";

const backendUrl = process.env.NEXT_PUBLIC_API_URL || 
  (typeof window !== "undefined" && window.location.hostname === "localhost" 
    ? "http://localhost:5000" 
    : "https://real-time-chat-app-production-f44d.up.railway.app");

export const socket = io(backendUrl, {
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5
});