"use client";
import { useState, useEffect } from "react";
import axios from "axios";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [year, setYear] = useState("");
  const [emailOptIn, setEmailOptIn] = useState(false);
  const [message, setMessage] = useState("");
  const [fadeIn, setFadeIn] = useState(false);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => (currentYear - i).toString());

  useEffect(() => {
    setFadeIn(true);
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/register`,
        { username, email, password }
      );
      setMessage("✅ Registered successfully! Redirecting to login...");
      setTimeout(() => {
        window.location.href = "/login";
      }, 1500);
    } catch (err: any) {
      setMessage("❌ Registration failed: " + err.response?.data?.error);
    }
  };

  return (
    <div className="h-screen font-['gg_sans',_'Noto_Sans',_'Helvetica_Neue',_Helvetica,_Arial,_sans-serif] relative overflow-hidden">
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

      <div className="flex items-center justify-center h-screen px-4">
        <div
          className={`w-full max-w-[480px] bg-white/95 backdrop-blur-sm rounded-lg shadow-2xl p-8 transition-all duration-700 relative z-10 max-h-[90vh] overflow-y-auto ${
            fadeIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Create an account
            </h2>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
                Email <span className="text-red-600">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-100 border border-gray-300 rounded-[3px] text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[16px] h-[40px] transition-colors"
                required
              />
            </div>

            {/* Display Name Field */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-100 border border-gray-300 rounded-[3px] text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[16px] h-[40px] transition-colors"
              />
            </div>

            {/* Username Field */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
                Username <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
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
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
                Date of Birth <span className="text-red-600">*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                <select
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="px-3 py-2.5 bg-gray-100 border border-gray-300 rounded-[3px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[16px] h-[40px] cursor-pointer"
                >
                  <option value="">Month</option>
                  {months.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>

                <select
                  value={day}
                  onChange={(e) => setDay(e.target.value)}
                  className="px-3 py-2.5 bg-gray-100 border border-gray-300 rounded-[3px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[16px] h-[40px] cursor-pointer"
                >
                  <option value="">Day</option>
                  {days.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>

                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="px-3 py-2.5 bg-gray-100 border border-gray-300 rounded-[3px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[16px] h-[40px] cursor-pointer"
                >
                  <option value="">Year</option>
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Email Opt-in Checkbox */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="emailOptIn"
                checked={emailOptIn}
                onChange={(e) => setEmailOptIn(e.target.checked)}
                className="mt-0.5 w-5 h-5 rounded border-gray-300 cursor-pointer accent-blue-600 flex-shrink-0"
              />
              <label
                htmlFor="emailOptIn"
                className="text-xs text-gray-600 leading-[18px] cursor-pointer select-none"
              >
                (Optional) It's okay to send me emails with updates, tips, and special offers. You can opt out at any time.
              </label>
            </div>

            {/* Terms */}
            <p className="text-xs text-gray-600 leading-[18px]">
              By clicking "Create Account," you agree to Discord's{" "}
              <a href="#" className="text-blue-600 hover:underline">
                Terms of Service
              </a>{" "}
              and have read the{" "}
              <a href="#" className="text-blue-600 hover:underline">
                Privacy Policy
              </a>
            </p>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-[3px] transition-colors duration-150 text-[16px] h-[44px]"
            >
              Create Account
            </button>

            {/* Login Link */}
            <div className="text-sm text-center">
              <a
                href="/login"
                className="text-blue-600 hover:underline"
              >
                Already have an account? Log in
              </a>
            </div>
          </form>

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
    </div>
  );
}
