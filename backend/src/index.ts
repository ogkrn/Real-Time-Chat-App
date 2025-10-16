import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import jwt from "jsonwebtoken";
import path from "path";
import authRoutes from "./routes/auth";
import messagesRoutes from "./routes/messages";
import friendsRoutes from "./routes/friends";
import uploadRoutes from "./routes/upload";
import { prisma } from "./prismaclient";
// Redis is optional - uncomment if you want to scale across multiple servers
// import { createClient } from "redis";
// import { createAdapter } from "@socket.io/redis-adapter";

const app = express();
app.use(cors());
app.use(express.json());

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/auth", authRoutes);
app.use("/messages", messagesRoutes);
app.use("/friends", friendsRoutes);
app.use("/upload", uploadRoutes);

const server = http.createServer(app);

const io = new Server(server, { 
  cors: { origin: "*" },
  transports: ['polling', 'websocket']
});

// Initialize server
async function initializeServer() {
  // Redis adapter is optional - for scaling Socket.IO across multiple servers
  // Uncomment below if you set up Redis in production
  /*
  try {
    const pubClient = createClient({ url: process.env.REDIS_URL || "redis://localhost:6379" });
    const subClient = pubClient.duplicate();
    
    await pubClient.connect();
    await subClient.connect();
    
    io.adapter(createAdapter(pubClient, subClient));
    console.log("✅ Redis adapter connected successfully");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.warn("⚠️ Redis connection failed, using memory adapter:", errorMessage);
  }
  */
  
  console.log("📡 Using in-memory adapter (suitable for single server deployment)");

  // Authenticate socket connections (middleware) so socket.data.user is set before connection
  io.use(async (socket, next) => {
    const JWT_SECRET = process.env['JWT_SECRET'] || "supersecretkey";
    try {
      const token = (socket.handshake && (socket.handshake as any).auth && (socket.handshake as any).auth.token) || null;
      if (!token) return next();
      const decoded = jwt.verify(token, JWT_SECRET);
      if (typeof decoded === "string" || !decoded || typeof decoded !== "object" || !("id" in decoded)) {
        return next();
      }
      const maybeId = (decoded as { id: string }).id;
      const idNum = Number(maybeId);
      if (Number.isNaN(idNum)) return next();
      const user = await prisma.user.findUnique({ where: { id: idNum } });
      if (user) socket.data.user = { id: user.id, username: user.username };
      return next();
    } catch (err) {
      console.warn("Socket auth token invalid:", err instanceof Error ? err.message : err);
      return next();
    }
  });

  // Socket.IO event handlers
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id, "user:", socket.data?.user?.username ?? "(anonymous)");

    socket.on("send_message", async (data) => {
      try {
        const { token, content, recipientId, fileUrl, fileName, fileType, fileSize } = data as { 
          token?: string; 
          content: string; 
          recipientId?: number;
          fileUrl?: string;
          fileName?: string;
          fileType?: string;
          fileSize?: number;
        };

        // Prefer authenticated user attached to socket during connection
        let userId: number | null = socket.data?.user?.id ?? null;
        const JWT_SECRET = process.env['JWT_SECRET'] || "supersecretkey";

        // If no user on socket, try per-emit token for backward compatibility
        if (!userId) {
          if (!token) return;
          const decoded = jwt.verify(token, JWT_SECRET);

          if (typeof decoded === "string" || !decoded || typeof decoded !== "object" || !("id" in decoded)) {
            console.warn("Invalid token payload or missing id");
            return;
          }

          const maybeId = (decoded as { id: string }).id;
          const idNum = Number(maybeId);
          if (Number.isNaN(idNum)) {
            console.warn("Invalid user id in token payload");
            return;
          }
          userId = idNum;
        }

        // TODO: Enable friendship check after migration is run
        // Check if users are friends before allowing message send
        // if (recipientId) {
        //   const friendship = await prisma.friendship.findFirst({
        //     where: {
        //       status: 'accepted',
        //       OR: [
        //         { senderId: userId, receiverId: recipientId },
        //         { senderId: recipientId, receiverId: userId }
        //       ]
        //     }
        //   });

        //   if (!friendship) {
        //     console.warn(`User ${userId} attempted to message non-friend ${recipientId}`);
        //     return;
        //   }
        // }

        // Create message with recipientId for private messaging
        const message = await prisma.message.create({
          data: { 
            userId, 
            content,
            recipientId: recipientId || null,
            fileUrl: fileUrl || null,
            fileName: fileName || null,
            fileType: fileType || null,
            fileSize: fileSize || null
          },
          include: { user: true },
        });

        // If recipientId is provided, emit to both sender and recipient only
        if (recipientId) {
          // Emit to all sockets of the sender
          const senderSockets = await io.fetchSockets();
          senderSockets.forEach(s => {
            if (s.data?.user?.id === userId) {
              s.emit("receive_message", message);
            }
          });

          // Emit to all sockets of the recipient
          senderSockets.forEach(s => {
            if (s.data?.user?.id === recipientId) {
              s.emit("receive_message", message);
            }
          });
        } else {
          // Broadcast to all connected clients (general chat - backward compatibility)
          io.emit("receive_message", message);
        }
      } catch (error) {
        console.error("JWT verification failed:", error);
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  // Start the server
  server.listen(5000, () => {
    console.log("🚀 Backend running on port 5000");
    console.log("📡 Socket.IO server initialized");
  });
}

// Initialize everything
initializeServer().catch((error) => {
  console.error("❌ Failed to start server:", error);
  process.exit(1);
});
