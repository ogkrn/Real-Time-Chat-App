"use client";
import { useEffect, useState, useRef } from "react";
import io from "socket.io-client";

export default function ChatPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const socketRef = useRef<any | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    
    if (!token) {
      setConnectionError("No token found. Please login first.");
      window.location.href = "/login";
      return;
    }

    const socket = io(process.env.NEXT_PUBLIC_API_URL!, { 
      auth: { token },
      transports: ['websocket', 'polling']
    });
    
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("✅ Connected to server");
      setIsConnected(true);
      setConnectionError(null);
    });

    socket.on("disconnect", () => {
      console.log("❌ Disconnected from server");
      setIsConnected(false);
    });

    socket.on("connect_error", (error) => {
      console.error("Connection error:", error);
      setConnectionError("Failed to connect to server");
      setIsConnected(false);
    });

    socket.on("receive_message", (msg: any) => {
      console.log("📨 Received message:", msg);
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const sock = socketRef.current;
    
    if (sock && sock.connected && token) {
      sock.emit("send_message", { token, content: newMessage.trim() });
      setNewMessage("");
    } else {
      setConnectionError("Not connected to server");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#313338] font-['gg_sans',_'Noto_Sans',_'Helvetica_Neue',_Helvetica,_Arial,_sans-serif]">
      {/* Header */}
      <div className="bg-[#313338] border-b border-[#26272b] px-4 py-3 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="text-2xl">💬</div>
          <div>
            <h2 className="text-white font-bold text-lg"># general-chat</h2>
            <p className="text-[#B5BAC1] text-xs">Welcome to the chat room</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-[#3BA55D]' : 'bg-[#ED4245]'}`}></div>
          <span className="text-sm text-[#B5BAC1]">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Connection Error */}
      {connectionError && (
        <div className="bg-[#ED4245]/20 border-l-4 border-[#ED4245] text-[#ED4245] px-4 py-3 text-sm">
          <span className="font-bold">⚠️ Connection Error:</span> {connectionError}
        </div>
      )}

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-[#B5BAC1]">
            <div className="text-6xl mb-4">💭</div>
            <p className="text-lg font-medium">No messages yet</p>
            <p className="text-sm">Be the first to start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div 
              key={idx} 
              className="hover:bg-[#2e2f35] py-1 px-3 -mx-3 rounded group transition-colors duration-75"
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#5865F2] flex items-center justify-center text-white font-bold text-sm mt-0.5">
                  {(msg.user?.username || 'U')[0].toUpperCase()}
                </div>
                
                {/* Message Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold text-white hover:underline cursor-pointer">
                      {msg.user?.username || `User ${msg.userId}`}
                    </span>
                    <span className="text-xs text-[#949BA4]">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[#DBDEE1] text-[15px] break-words leading-relaxed mt-0.5">
                    {msg.content}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="px-4 pb-6">
        <div className="bg-[#383a40] rounded-lg flex items-center gap-2 px-4 py-3">
          <button className="text-[#B5BAC1] hover:text-white transition text-xl">
            ➕
          </button>
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 bg-transparent border-none text-white placeholder-[#6d6f78] focus:outline-none text-[15px]"
            placeholder={isConnected ? "Message #general-chat" : "Connecting..."}
            disabled={!isConnected}
          />
          <button className="text-[#B5BAC1] hover:text-white transition text-xl">
            😊
          </button>
          <button
            onClick={sendMessage}
            disabled={!isConnected || !newMessage.trim()}
            className={`ml-2 transition-all duration-200 ${
              !isConnected || !newMessage.trim()
                ? 'text-[#4e5058] cursor-not-allowed'
                : 'text-[#5865F2] hover:text-white cursor-pointer'
            }`}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2 21L23 12L2 3V10L17 12L2 14V21Z"/>
            </svg>
          </button>
        </div>
        <div className="text-xs text-[#949BA4] mt-2 px-1">
          Press <span className="bg-[#26272b] px-1.5 py-0.5 rounded text-[#B5BAC1]">Enter</span> to send • 
          <span className="text-[#5865F2] ml-1 cursor-pointer hover:underline">Logout</span>
        </div>
      </div>
    </div>
  );
}
