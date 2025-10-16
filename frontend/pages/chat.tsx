"use client";
import { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import axios from "axios";

interface User {
  id: number;
  username: string;
  email: string;
}

interface Message {
  id: number;
  content: string;
  userId: number;
  recipientId?: number;
  user: User;
  createdAt: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
}

interface FriendRequest {
  id: number;
  senderId: number;
  receiverId: number;
  status: string;
  sender: User;
  receiver: User;
  createdAt: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showPendingRequests, setShowPendingRequests] = useState(false);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const socketRef = useRef<any | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const emojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
    '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
    '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
    '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
    '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
    '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '👍', '👎',
    '👊', '✊', '🤛', '🤜', '🤞', '✌️', '🤟', '🤘', '👌', '🤌',
    '🤏', '👈', '👉', '👆', '👇', '☝️', '👏', '🙌', '👐', '🤲',
    '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦿', '🦵', '🦶', '👂',
    '🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🥈', '🥉', '⚽', '🏀',
    '🔥', '⭐', '🌟', '✨', '💫', '💥', '💢', '💦', '💨', '🌈'
  ];

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (showEmojiPicker && !target.closest('.emoji-picker-container')) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker]);

  // Fetch current user and all users on mount
  useEffect(() => {
    const fetchData = async () => {
      // Ensure we're on the client side
      if (typeof window === "undefined") return;
      
      const token = localStorage.getItem("token");
      if (!token) {
        window.location.href = "/login";
        return;
      }

      try {
        // Decode JWT to get current user ID
        // JWT format: header.payload.signature
        const parts = token.split('.');
        if (parts.length !== 3) {
          console.error("Invalid token format");
          window.location.href = "/login";
          return;
        }

        // Decode base64url (JWT uses base64url encoding, not standard base64)
        const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const paddedBase64 = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
        const payload = JSON.parse(window.atob(paddedBase64));
        const currentUserId = payload.id;

        // Fetch all users
        const usersResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/users`
        );
        const allUsers = usersResponse.data.users || [];
        setUsers(allUsers);

        // Set current user
        const user = allUsers.find((u: User) => u.id === currentUserId);
        if (user) {
          setCurrentUser(user);
        }

        // Fetch friends list (only after migration is run)
        try {
          const friendsResponse = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}/friends`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setFriends(friendsResponse.data || []);
        } catch (error) {
          console.log("Friends feature not available yet - migration needed");
          // Fallback: show all users if friends feature not available
          setFriends(allUsers.filter((u: User) => u.id !== currentUserId));
        }

        // Fetch pending friend requests
        try {
          const requestsResponse = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}/friends/requests/pending`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setPendingRequests(requestsResponse.data || []);
        } catch (error) {
          console.log("Pending requests not available yet - migration needed");
        }
      } catch (error) {
        console.error("Failed to fetch users:", error);
        // If token is invalid, redirect to login
        window.location.href = "/login";
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    
    if (!token) {
      setConnectionError("No token found. Please login first.");
      window.location.href = "/login";
      return;
    }

    // Auto-detect Socket.IO URL based on environment
    // If accessing via ngrok or network, use the current origin
    // Otherwise use localhost for development
    let socketUrl = "";
    
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;
      const isNgrok = hostname.includes('ngrok');
      const isNetwork = !hostname.includes('localhost') && !hostname.includes('127.0.0.1');
      
      if (isNgrok || isNetwork) {
        // Using ngrok or network IP - connect to current origin with proxy
        socketUrl = window.location.origin;
      } else {
        // Local development - connect directly to backend
        socketUrl = "http://localhost:5000";
      }
    }
    
    console.log("🔌 Connecting to Socket.IO at:", socketUrl);
    
    const socket = io(socketUrl, { 
      auth: { token },
      transports: ['polling', 'websocket'],  // Use polling first (better for ngrok free tier)
      path: '/socket.io/',
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,  // Increased timeout for ngrok
      forceNew: true,
      upgrade: true,  // Allow upgrade from polling to websocket
      autoConnect: true
    });
    
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("✅ Connected to server at", socketUrl);
      setIsConnected(true);
      setConnectionError(null);
    });

    socket.on("disconnect", (reason) => {
      console.log("❌ Disconnected from server:", reason);
      setIsConnected(false);
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect manually
        socket.connect();
      }
    });

    socket.on("connect_error", (error) => {
      console.error("Connection error:", error.message);
      setConnectionError(`Failed to connect: ${error.message}`);
      setIsConnected(false);
    });

    socket.on("connect_timeout", () => {
      console.error("Connection timeout");
      setConnectionError("Connection timeout - server may be unreachable");
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

  // Load messages when user is selected
  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedUser || !currentUser) {
        setMessages([]);
        return;
      }

      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) return;

      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/messages/${selectedUser.id}?currentUserId=${currentUser.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMessages(response.data.messages || []);
      } catch (error) {
        console.error("Failed to load messages:", error);
      }
    };

    loadMessages();
  }, [selectedUser, currentUser]);

  const sendMessage = (fileData?: { fileUrl: string; fileName: string; fileType: string; fileSize: number }) => {
    if ((!newMessage.trim() && !fileData) || !selectedUser) return;

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const sock = socketRef.current;
    
    if (sock && sock.connected && token) {
      sock.emit("send_message", { 
        token, 
        content: fileData ? (newMessage.trim() || `Sent ${fileData.fileName}`) : newMessage.trim(),
        recipientId: selectedUser.id,
        ...(fileData && {
          fileUrl: fileData.fileUrl,
          fileName: fileData.fileName,
          fileType: fileData.fileType,
          fileSize: fileData.fileSize
        })
      });
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

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !selectedUser) return;

    const file = files[0];
    const maxSize = 50 * 1024 * 1024; // 50MB

    if (file.size > maxSize) {
      alert("File size exceeds 50MB limit");
      return;
    }

    setUploadingFile(true);

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const fileData = response.data;
      sendMessage(fileData);
    } catch (error: any) {
      console.error("File upload error:", error);
      alert(error.response?.data?.error || "File upload failed");
    } finally {
      setUploadingFile(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const token = localStorage.getItem("token");
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/friends/search?username=${query}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSearchResults(response.data || []);
    } catch (error) {
      console.error("Failed to search users:", error);
    }
  };

  const sendFriendRequest = async (receiverId: number) => {
    const token = localStorage.getItem("token");
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/friends/request`,
        { receiverId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Friend request sent!");
      setSearchResults([]);
      setShowAddFriend(false);
    } catch (error: any) {
      alert(error.response?.data?.error || "Failed to send friend request");
    }
  };

  const acceptFriendRequest = async (requestId: number) => {
    const token = localStorage.getItem("token");
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/friends/request/${requestId}/accept`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Refresh friends and requests
      const friendsResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/friends`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFriends(friendsResponse.data || []);
      
      const requestsResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/friends/requests/pending`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPendingRequests(requestsResponse.data || []);
    } catch (error) {
      console.error("Failed to accept friend request:", error);
    }
  };

  const rejectFriendRequest = async (requestId: number) => {
    const token = localStorage.getItem("token");
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/friends/request/${requestId}/reject`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Refresh requests
      const requestsResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/friends/requests/pending`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPendingRequests(requestsResponse.data || []);
    } catch (error) {
      console.error("Failed to reject friend request:", error);
    }
  };

  const clearChat = async () => {
    if (!selectedUser || !currentUser) return;
    
    const token = localStorage.getItem("token");
    try {
      // Delete messages from database
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/messages/${selectedUser.id}`,
        { 
          headers: { Authorization: `Bearer ${token}` },
          data: { currentUserId: currentUser.id }
        }
      );
      
      // Clear local messages
      setMessages([]);
      setShowClearConfirm(false);
    } catch (error) {
      console.error("Failed to clear chat:", error);
      alert("Failed to clear chat");
    }
  };

  const filteredUsers = friends.filter(user => 
    user.id !== currentUser?.id && 
    (user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
     user.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Filter messages for the selected conversation
  const conversationMessages = messages.filter(msg => {
    if (!currentUser || !selectedUser) return false;
    return (
      (msg.userId === currentUser.id && msg.recipientId === selectedUser.id) ||
      (msg.userId === selectedUser.id && msg.recipientId === currentUser.id)
    );
  });

  return (
    <div className="flex h-screen bg-[#313338] overflow-hidden">
      {/* Sidebar */}
      <div className="w-[320px] bg-[#2b2d31] flex flex-col">
        {/* Sidebar Header */}
        <div className="h-12 px-4 flex items-center justify-between border-b border-[#1e1f22] shadow-sm">
          <h1 className="text-white font-semibold text-base">Direct Messages</h1>
          <div className="flex items-center gap-2">
            {pendingRequests.length > 0 && (
              <button
                onClick={() => setShowPendingRequests(true)}
                className="relative text-[#b5bac1] hover:text-white transition-colors duration-200 p-1 rounded hover:bg-[#35373c]"
                title="Friend Requests"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                </svg>
                <span className="absolute -top-1 -right-1 bg-[#ED4245] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {pendingRequests.length}
                </span>
              </button>
            )}
            <button
              onClick={() => setShowAddFriend(true)}
              className="text-[#23A559] hover:text-white transition-colors duration-200 p-1 rounded hover:bg-[#35373c]"
              title="Add Friend"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </button>
            <button
              onClick={handleLogout}
              className="text-[#b5bac1] hover:text-white transition-colors duration-200 text-sm px-2 py-1 rounded hover:bg-[#35373c]"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-2 py-2">
          <div className="bg-[#1e1f22] rounded px-2 py-1.5 flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#949BA4">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Find or start a conversation"
              className="bg-transparent border-none text-white placeholder-[#87898c] focus:outline-none flex-1 text-sm"
            />
          </div>
        </div>

        {/* Users List */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-2 pt-4 pb-1">
            <div className="px-2 text-[#949BA4] text-xs font-semibold uppercase tracking-wide">
              Direct Messages — {filteredUsers.length}
            </div>
          </div>
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              onClick={() => setSelectedUser(user)}
              className={`mx-2 px-2 py-1.5 rounded cursor-pointer flex items-center gap-3 transition-all duration-200 group ${
                selectedUser?.id === user.id 
                  ? 'bg-[#404249] text-white' 
                  : 'hover:bg-[#35373c] text-[#949BA4]'
              }`}
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-[#5865F2] flex items-center justify-center text-white font-semibold text-sm">
                  {user.username[0].toUpperCase()}
                </div>
                {/* Online status indicator */}
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#23A559] border-2 border-[#2b2d31] rounded-full"></div>
              </div>
              {/* User Info */}
              <div className="flex-1 min-w-0">
                <p className={`font-medium truncate text-[15px] ${
                  selectedUser?.id === user.id ? 'text-white' : 'text-[#f2f3f5] group-hover:text-white'
                }`}>
                  {user.username}
                </p>
                <p className="text-[#87898c] text-xs truncate">Online</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div 
        className="flex-1 flex flex-col bg-[#313338] relative overflow-hidden"
        style={{
          backgroundImage: "url('/images/background.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        {/* Dark overlay for better contrast */}
        <div className="absolute inset-0 bg-[#313338]/95 z-0"></div>
        
        {selectedUser ? (
          <div className="relative z-10 flex flex-col h-full">
            {/* Chat Header */}
            <div className="h-12 px-4 flex items-center gap-3 border-b border-[#26272b] shadow-sm bg-[#313338]/50 backdrop-blur-sm">
              <span className="text-[#80848e] text-xl">@</span>
              <h2 className="text-white font-semibold text-base">{selectedUser.username}</h2>
              <div className="flex-1"></div>
              {conversationMessages.length > 0 && (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="text-[#ED4245] hover:text-white hover:bg-[#ED4245]/20 transition-all duration-200 px-3 py-1.5 rounded text-sm font-medium flex items-center gap-2"
                  title="Clear chat history"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                  </svg>
                  Clear Chat
                </button>
              )}
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#23A559]' : 'bg-[#ED4245]'}`}></div>
            </div>

            {/* Connection Error */}
            {connectionError && (
              <div className="bg-[#ED4245]/20 border-l-4 border-[#ED4245] text-[#ED4245] px-4 py-3 text-sm">
                <span className="font-bold">⚠️ Connection Error:</span> {connectionError}
              </div>
            )}

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {conversationMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="w-16 h-16 rounded-full bg-[#5865F2] flex items-center justify-center text-white font-bold text-2xl mb-4">
                    {selectedUser.username[0].toUpperCase()}
                  </div>
                  <h3 className="text-white text-2xl font-bold mb-1">{selectedUser.username}</h3>
                  <p className="text-[#b5bac1] text-sm mb-4">
                    This is the beginning of your direct message history with @{selectedUser.username}.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {conversationMessages.map((msg, idx) => {
                    const isCurrentUser = msg.userId === currentUser?.id;
                    const showAvatar = idx === 0 || conversationMessages[idx - 1].userId !== msg.userId;
                    
                    return (
                      <div 
                        key={idx} 
                        className={`flex items-end gap-2 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}
                      >
                        {/* Avatar */}
                        {showAvatar ? (
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-xs flex-shrink-0 ${
                            isCurrentUser ? 'bg-[#5865F2]' : 'bg-[#23A559]'
                          }`}>
                            {msg.user?.username[0].toUpperCase()}
                          </div>
                        ) : (
                          <div className="w-8 flex-shrink-0"></div>
                        )}
                        
                        {/* Message Bubble */}
                        <div className={`max-w-[70%] group ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                          {showAvatar && (
                            <div className={`flex items-baseline gap-2 mb-1 px-1 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
                              <span className="font-medium text-white text-xs">
                                {msg.user?.username}
                              </span>
                              <span className="text-[#949BA4] text-[10px]">
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          )}
                          <div className={`rounded-2xl px-4 py-2.5 ${
                            isCurrentUser 
                              ? 'bg-[#5865F2] text-white rounded-br-md' 
                              : 'bg-[#2b2d31] text-[#dbdee1] rounded-bl-md'
                          }`}>
                            {/* Display file attachment if present */}
                            {msg.fileUrl && (
                              <div className="mb-2">
                                {msg.fileType?.startsWith('image/') ? (
                                  <img 
                                    src={`${process.env.NEXT_PUBLIC_API_URL}${msg.fileUrl}`}
                                    alt={msg.fileName || 'Image'}
                                    className="max-w-xs max-h-64 rounded-lg cursor-pointer hover:opacity-90"
                                    onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL}${msg.fileUrl}`, '_blank')}
                                  />
                                ) : msg.fileType?.startsWith('video/') ? (
                                  <video 
                                    controls
                                    className="max-w-xs max-h-64 rounded-lg"
                                    src={`${process.env.NEXT_PUBLIC_API_URL}${msg.fileUrl}`}
                                  />
                                ) : (
                                  <a 
                                    href={`${process.env.NEXT_PUBLIC_API_URL}${msg.fileUrl}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 p-3 bg-black/20 rounded-lg hover:bg-black/30 transition-colors"
                                  >
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                      <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/>
                                    </svg>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate">{msg.fileName}</p>
                                      <p className="text-xs opacity-75">
                                        {msg.fileSize ? `${(msg.fileSize / 1024 / 1024).toFixed(2)} MB` : 'File'}
                                      </p>
                                    </div>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                      <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                                    </svg>
                                  </a>
                                )}
                              </div>
                            )}
                            <p className="text-[15px] break-words leading-[1.375rem]">{msg.content}</p>
                          </div>
                          {!showAvatar && (
                            <span className={`text-[#949BA4] text-[10px] opacity-0 group-hover:opacity-100 transition-opacity px-1 mt-0.5 block ${
                              isCurrentUser ? 'text-right' : 'text-left'
                            }`}>
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="px-4 pb-6 pt-2">
              <div className="bg-[#383a40] rounded-lg flex items-center gap-2 px-4 py-2.5">
                {/* Attach files button */}
                <button 
                  className="text-[#b5bac1] hover:text-[#dbdee1] transition-colors duration-200 p-1 rounded hover:bg-[#4e5058] disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                  title="Attach images, videos, or files"
                  disabled={uploadingFile || !isConnected}
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt,audio/*';
                    input.onchange = (e) => {
                      const files = (e.target as HTMLInputElement).files;
                      handleFileUpload(files);
                    };
                    input.click();
                  }}
                >
                  {uploadingFile ? (
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="12" r="10"/>
                      <path fill="#383a40" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                    </svg>
                  )}
                </button>

                {/* Emoji picker button */}
                <div className="relative emoji-picker-container flex-shrink-0">
                  <button 
                    className="text-[#b5bac1] hover:text-[#dbdee1] transition-colors duration-200 p-1 rounded hover:bg-[#4e5058]"
                    title="Insert emoji"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.486 2 2 6.486 2 12C2 17.514 6.486 22 12 22C17.514 22 22 17.514 22 12C22 6.486 17.514 2 12 2ZM12 20C7.589 20 4 16.411 4 12C4 7.589 7.589 4 12 4C16.411 4 20 7.589 20 12C20 16.411 16.411 20 12 20ZM15.5 11C16.328 11 17 10.328 17 9.5S16.328 8 15.5 8 14 8.672 14 9.5 14.672 11 15.5 11ZM8.5 11C9.328 11 10 10.328 10 9.5S9.328 8 8.5 8 7 8.672 7 9.5 7.672 11 8.5 11ZM12 17C13.657 17 15.134 16.097 16.001 14.75L14.361 13.911C13.855 14.732 13.008 15.25 12 15.25S10.145 14.732 9.639 13.911L7.999 14.75C8.866 16.097 10.343 17 12 17Z"/>
                    </svg>
                  </button>

                  {/* Emoji picker dropdown */}
                  {showEmojiPicker && (
                    <div className="absolute bottom-14 right-0 bg-[#2b2d31] rounded-lg shadow-2xl border border-[#1e1f22] p-3 w-80 max-h-64 overflow-y-auto z-50">
                      <div className="flex justify-between items-center mb-2 pb-2 border-b border-[#3f4147]">
                        <span className="text-[#dbdee1] text-sm font-semibold">EMOJI</span>
                        <button
                          onClick={() => setShowEmojiPicker(false)}
                          className="text-[#b5bac1] hover:text-white transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="grid grid-cols-9 gap-1">
                        {emojis.map((emoji, idx) => (
                          <button
                            key={idx}
                            className="text-2xl hover:bg-[#35373c] rounded p-1.5 transition-colors"
                            onClick={() => {
                              setNewMessage(prev => prev + emoji);
                              setShowEmojiPicker(false);
                            }}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 bg-transparent border-none text-[#dbdee1] placeholder-[#87898c] focus:outline-none text-[15px] leading-5"
                  placeholder={isConnected ? `Message @${selectedUser.username}` : "Connecting..."}
                  disabled={!isConnected}
                />

                {/* Send button */}
                <button
                  onClick={() => sendMessage()}
                  disabled={!isConnected || (!newMessage.trim() && !uploadingFile)}
                  className="bg-[#5865F2] hover:bg-[#4752C4] text-white px-4 py-2 rounded-md transition-all duration-200 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 flex-shrink-0"
                  title="Send message"
                >
                  <span>Send</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative z-10 flex flex-col items-center justify-center h-full text-[#b5bac1] px-8">
            <p className="text-[#87898c] text-base text-center max-w-md leading-relaxed">
              Select a conversation from the left sidebar or start a new direct message.
            </p>
          </div>
        )}
      </div>

      {/* Add Friend Modal */}
      {showAddFriend && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setShowAddFriend(false)}>
          <div className="bg-[#313338] rounded-lg p-6 w-[480px] max-h-[600px] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white text-xl font-bold">Add Friend</h2>
              <button
                onClick={() => setShowAddFriend(false)}
                className="text-[#b5bac1] hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            <p className="text-[#b5bac1] text-sm mb-4">
              Search for users by username to send friend requests
            </p>
            <input
              type="text"
              placeholder="Search by username..."
              className="w-full bg-[#1e1f22] text-white rounded px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-[#5865F2]"
              onChange={(e) => searchUsers(e.target.value)}
            />
            <div className="space-y-2">
              {searchResults.map(user => (
                <div key={user.id} className="flex items-center justify-between bg-[#2b2d31] rounded p-3 hover:bg-[#35373c] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#5865F2] flex items-center justify-center text-white font-semibold">
                      {user.username[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white font-medium">{user.username}</p>
                      <p className="text-[#b5bac1] text-sm">{user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => sendFriendRequest(user.id)}
                    className="bg-[#5865F2] hover:bg-[#4752C4] text-white px-4 py-2 rounded transition-colors"
                  >
                    Add Friend
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Pending Requests Modal */}
      {showPendingRequests && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setShowPendingRequests(false)}>
          <div className="bg-[#313338] rounded-lg p-6 w-[480px] max-h-[600px] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white text-xl font-bold">Friend Requests</h2>
              <button
                onClick={() => setShowPendingRequests(false)}
                className="text-[#b5bac1] hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2">
              {pendingRequests.length === 0 ? (
                <p className="text-[#b5bac1] text-center py-8">No pending friend requests</p>
              ) : (
                pendingRequests.map(request => (
                  <div key={request.id} className="flex items-center justify-between bg-[#2b2d31] rounded p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#5865F2] flex items-center justify-center text-white font-semibold">
                        {request.sender.username[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white font-medium">{request.sender.username}</p>
                        <p className="text-[#b5bac1] text-sm">{request.sender.email}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => acceptFriendRequest(request.id)}
                        className="bg-[#23A559] hover:bg-[#1F8F4D] text-white px-4 py-2 rounded transition-colors"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => rejectFriendRequest(request.id)}
                        className="bg-[#ED4245] hover:bg-[#C93B3D] text-white px-4 py-2 rounded transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Clear Chat Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setShowClearConfirm(false)}>
          <div className="bg-[#313338] rounded-lg p-6 w-[440px]" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-white text-xl font-bold mb-3">Clear Chat History</h2>
            <p className="text-[#b5bac1] mb-6">
              Are you sure you want to delete all messages with <span className="text-white font-semibold">@{selectedUser?.username}</span>? 
              This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="bg-[#4e5058] hover:bg-[#5c5e66] text-white px-4 py-2 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={clearChat}
                className="bg-[#ED4245] hover:bg-[#C93B3D] text-white px-4 py-2 rounded transition-colors font-medium"
              >
                Clear Chat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
