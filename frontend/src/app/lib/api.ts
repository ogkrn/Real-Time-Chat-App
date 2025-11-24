import axios from "axios";

const rawApiEnv = process.env.NEXT_PUBLIC_API_URL;
const backendUrl = (rawApiEnv ? rawApiEnv.replace(/\/+$/, "") :
  (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ? "http://localhost:5000"
    : ""));

const api = axios.create({
  baseURL: backendUrl,
});

export default api;
