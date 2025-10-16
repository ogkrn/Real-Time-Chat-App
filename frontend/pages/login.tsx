"use client";
import { useState, useEffect } from "react";
import axios from "axios";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    setFadeIn(true);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
        { email, password }
      );
      localStorage.setItem("token", res.data.token);
      setMessage("✅ Login successful! Redirecting...");
      setTimeout(() => {
        window.location.href = "/chat";
      }, 1000);
    } catch (err: any) {
      setMessage("❌ Login failed: " + err.response?.data?.error);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen px-4 font-['gg_sans',_'Noto_Sans',_'Helvetica_Neue',_Helvetica,_Arial,_sans-serif] relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/images/background.jpg')`,
        }}
      />
      
      {/* Darker overlay */}
      <div className="absolute inset-0 bg-black/40" />
      
      {/* Very subtle grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />
      
      {/* Subtle decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Very subtle glows - reduced opacity */}
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" style={{ animation: 'pulse 8s ease-in-out infinite' }} />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl" style={{ animation: 'pulse 10s ease-in-out infinite 2s' }} />
        
        {/* Minimal floating particles - fewer and more subtle */}
        <div className="absolute top-1/4 left-1/4 w-1.5 h-1.5 bg-white/10 rounded-full" style={{ animation: 'float 12s ease-in-out infinite' }} />
        <div className="absolute bottom-1/3 right-1/4 w-1.5 h-1.5 bg-white/8 rounded-full" style={{ animation: 'float 15s ease-in-out infinite 3s' }} />
        
        {/* Very subtle corner decorations */}
        <div className="absolute top-0 left-0 w-32 h-32 border-t border-l border-white/3" />
        <div className="absolute bottom-0 right-0 w-32 h-32 border-b border-r border-white/3" />
      </div>

      <div
        className={`w-full max-w-[480px] bg-white/95 backdrop-blur-sm rounded-lg shadow-2xl p-8 transition-all duration-700 relative z-10 ${
          fadeIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Welcome back!
          </h2>
          <p className="text-gray-600 text-[16px]">
            We're so excited to see you again!
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {/* Email Field */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
              Email or Phone Number <span className="text-red-600">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-100 border border-gray-300 rounded-[3px] text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[16px] h-[40px] transition-colors"
              required
            />
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
              Password <span className="text-red-600">*</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-100 border border-gray-300 rounded-[3px] text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[16px] h-[40px] transition-colors"
              required
            />
            <a href="#" className="text-xs text-blue-600 hover:underline mt-2 inline-block">
              Forgot your password?
            </a>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-[3px] transition-colors duration-150 text-[16px] h-[44px] mt-5"
          >
            Log In
          </button>
        </form>

        {/* Register Link */}
        <div className="mt-2 text-sm text-center text-gray-600">
          Need an account?{" "}
          <a
            href="/register"
            className="text-blue-600 hover:underline"
          >
            Register
          </a>
        </div>

        {/* Message Display */}
        {message && (
          <div
            className={`mt-4 p-3 rounded text-sm ${
              message.startsWith("✅")
                ? "bg-[#3BA55D]/10 text-[#3BA55D]"
                : "bg-[#ED4245]/10 text-[#ED4245]"
            }`}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
