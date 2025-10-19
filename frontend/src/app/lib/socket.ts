import { io } from "socket.io-client";

export const socket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000", {
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5
});