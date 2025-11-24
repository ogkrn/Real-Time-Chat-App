import { io } from "socket.io-client";

const rawSocketEnv = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL;
const backendUrl = (rawSocketEnv ? rawSocketEnv.replace(/\/+$/, "") :
  (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ? "http://localhost:5000"
    : ""));

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