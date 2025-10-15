import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import jwt from "jsonwebtoken";
import authRoutes from "./routes/auth";
import { prisma } from "./prismaclient";
import { createClient } from "redis";
import { createAdapter } from "@socket.io/redis-adapter";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/auth", authRoutes);

const server = http.createServer(app);

const io = new Server(server, { cors: { origin: "*" } });

// Initialize Redis adapter
async function initializeServer() {
  try {
    const pubClient = createClient({ url: "redis://localhost:6379" });
    const subClient = pubClient.duplicate();
    
    await pubClient.connect();
    await subClient.connect();
    
    io.adapter(createAdapter(pubClient, subClient));
    console.log("✅ Redis adapter connected successfully");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.warn("⚠️ Redis connection failed, using memory adapter:", errorMessage);
    // Socket.IO will use memory adapter by default if Redis fails
  }

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
        const { token, content } = data as { token?: string; content: string };

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

        const message = await prisma.message.create({
          data: { userId, content },
          include: { user: true },
        });

        io.emit("receive_message", message);
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
