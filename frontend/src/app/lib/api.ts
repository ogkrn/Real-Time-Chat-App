import axios from "axios";

const backendUrl = process.env.NEXT_PUBLIC_API_URL || 
  (typeof window !== "undefined" && window.location.hostname === "localhost" 
    ? "http://localhost:5000" 
    : "https://real-time-chat-app-production-f44d.up.railway.app");

const api = axios.create({
  baseURL: backendUrl,
});

export default api;
