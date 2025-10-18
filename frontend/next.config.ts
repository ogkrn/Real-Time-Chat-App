import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fix turbopack root directory warning
  turbopack: {
    root: ".",
  },
  // Disable ESLint during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Redirect root to login
  async redirects() {
    return [
      {
        source: "/",
        destination: "/login",
        permanent: false,
      },
    ];
  },
  // Proxy API and Socket.IO requests to backend in development
  // In production, set NEXT_PUBLIC_API_URL and NEXT_PUBLIC_SOCKET_URL to your backend URL
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/:path*',
      },
      {
        source: '/socket.io/:path*',
        destination: 'http://localhost:5000/socket.io/:path*',
      },
    ];
  },
};

export default nextConfig;

