"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function Home() {
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    setFadeIn(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e1f22] via-[#2b2d31] to-[#313338] text-white overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#5865F2]/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#23A559]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex justify-between items-center px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#5865F2] to-[#4752C4] rounded-xl flex items-center justify-center shadow-lg">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9h10v2H7z"/>
              <circle cx="9" cy="9" r="1.5" fill="white"/>
              <circle cx="15" cy="9" r="1.5" fill="white"/>
              <path d="M12 17.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" fill="white"/>
            </svg>
          </div>
          <span className="text-xl font-bold">ChatConnect</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-[#b5bac1] hover:text-white transition-colors px-4 py-2">
            Login
          </Link>
          <Link href="/register" className="bg-[#5865F2] hover:bg-[#4752C4] text-white px-6 py-2.5 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-8 pt-20 pb-32">
        <div className={`text-center transition-all duration-1000 ${fadeIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent leading-tight">
            Connect Instantly,
            <br />
            Chat Effortlessly
          </h1>
          <p className="text-xl text-[#b5bac1] mb-12 max-w-2xl mx-auto leading-relaxed">
            Experience real-time messaging with friends, share photos, videos, and files seamlessly. Built for speed, designed for simplicity.
          </p>
          
          <div className="flex gap-4 justify-center items-center flex-wrap">
            <Link 
              href="/register" 
              className="bg-[#5865F2] hover:bg-[#4752C4] text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 shadow-2xl hover:shadow-[#5865F2]/50"
            >
              Start Chatting Now
            </Link>
            <Link 
              href="/login" 
              className="bg-[#2b2d31] hover:bg-[#35373c] border-2 border-[#404249] text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all transform hover:scale-105"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className={`mt-32 grid md:grid-cols-3 gap-8 transition-all duration-1000 delay-300 ${fadeIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {/* Feature 1 */}
          <div className="bg-[#2b2d31]/50 backdrop-blur-sm rounded-2xl p-8 border border-[#404249] hover:border-[#5865F2] transition-all hover:transform hover:scale-105">
            <div className="w-14 h-14 bg-[#5865F2]/20 rounded-xl flex items-center justify-center mb-6">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="#5865F2">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-3">Real-Time Messaging</h3>
            <p className="text-[#b5bac1] leading-relaxed">
              Send and receive messages instantly with WebSocket technology. No delays, just pure real-time communication.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-[#2b2d31]/50 backdrop-blur-sm rounded-2xl p-8 border border-[#404249] hover:border-[#23A559] transition-all hover:transform hover:scale-105">
            <div className="w-14 h-14 bg-[#23A559]/20 rounded-xl flex items-center justify-center mb-6">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="#23A559">
                <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-3">Media Sharing</h3>
            <p className="text-[#b5bac1] leading-relaxed">
              Share images, videos, and files up to 50MB. All media displays beautifully in your conversations.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-[#2b2d31]/50 backdrop-blur-sm rounded-2xl p-8 border border-[#404249] hover:border-purple-500 transition-all hover:transform hover:scale-105">
            <div className="w-14 h-14 bg-purple-500/20 rounded-xl flex items-center justify-center mb-6">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="#a855f7">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-3">Friend System</h3>
            <p className="text-[#b5bac1] leading-relaxed">
              Add friends, manage requests, and keep your conversations private. Only chat with people you trust.
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className={`mt-24 text-center transition-all duration-1000 delay-500 ${fadeIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-4xl font-bold mb-16">Why Choose ChatConnect?</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="text-5xl font-bold text-[#5865F2] mb-2">⚡</div>
              <div className="text-3xl font-bold mb-2">Fast</div>
              <p className="text-[#b5bac1]">Lightning-fast message delivery</p>
            </div>
            <div>
              <div className="text-5xl font-bold text-[#23A559] mb-2">🔒</div>
              <div className="text-3xl font-bold mb-2">Secure</div>
              <p className="text-[#b5bac1]">Your privacy is our priority</p>
            </div>
            <div>
              <div className="text-5xl font-bold text-purple-500 mb-2">🎨</div>
              <div className="text-3xl font-bold mb-2">Beautiful</div>
              <p className="text-[#b5bac1]">Modern, sleek interface</p>
            </div>
            <div>
              <div className="text-5xl font-bold text-orange-500 mb-2">🚀</div>
              <div className="text-3xl font-bold mb-2">Free</div>
              <p className="text-[#b5bac1]">Always free to use</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className={`mt-32 text-center bg-gradient-to-r from-[#5865F2]/20 to-purple-500/20 rounded-3xl p-16 border border-[#5865F2]/30 transition-all duration-1000 delay-700 ${fadeIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Start Chatting?
          </h2>
          <p className="text-xl text-[#b5bac1] mb-8 max-w-2xl mx-auto">
            Join thousands of users already enjoying seamless communication. Create your free account today!
          </p>
          <Link 
            href="/register" 
            className="inline-block bg-[#5865F2] hover:bg-[#4752C4] text-white px-10 py-5 rounded-xl font-bold text-xl transition-all transform hover:scale-105 shadow-2xl hover:shadow-[#5865F2]/50"
          >
            Get Started for Free →
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[#404249] mt-32 py-12">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-[#5865F2] to-[#4752C4] rounded-lg flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9h10v2H7z"/>
                </svg>
              </div>
              <span className="font-semibold">ChatConnect</span>
            </div>
            <div className="text-[#b5bac1] text-sm">
              © 2025 ChatConnect. Built with Next.js, Socket.IO & Prisma.
            </div>
            <div className="flex gap-6">
              <Link href="/login" className="text-[#b5bac1] hover:text-white transition-colors">
                Login
              </Link>
              <Link href="/register" className="text-[#b5bac1] hover:text-white transition-colors">
                Register
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
