import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

export default function Chat() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    socket.on("receive_message", (msg) => setMessages(prev => [...prev, msg]));
    return () => { socket.off("receive_message"); };
  }, []);

  const sendMessage = () => {
    const userId = Number(localStorage.getItem("userId"));
    socket.emit("send_message", { userId, content: input });
    setInput("");
  };

  return (
    <div>
      <h1>Chat</h1>
      <div>
        {messages.map((m, i) => <p key={i}><b>{m.userId}:</b> {m.content}</p>)}
      </div>
      <input value={input} onChange={(e) => setInput(e.target.value)} />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}
