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
import groupsRoutes from "./routes/groups";
import passwordResetRoutes from "./routes/password-reset";
import { prisma } from "./prismaclient";
// Redis is optional - uncomment if you want to scale across multiple servers
// import { createClient } from "redis";
// import { createAdapter } from "@socket.io/redis-adapter";

const app = express();
app.use(cors());
app.use(express.json());

// Health check endpoint (doesn't require database)
app.get("/health", (_req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

// Database status endpoint
app.get("/health/db", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", message: "Database connection successful" });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message || "Database connection failed" });
  }
});

// Manual migration endpoint (for testing/emergency use only)
app.all("/admin/migrate", async (_req, res) => {
  try {
    const { execSync } = require("child_process");
    console.log("🚀 Starting database migration...");
    
    try {
      // First reset the Prisma client to clear any cache
      await prisma.$disconnect();
      
      // Run migrations with output
      const output = execSync("npx prisma migrate deploy", { encoding: "utf-8" });
      console.log("✅ Migrations completed:", output);
      
      // Reconnect
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: "success", message: "Migrations applied successfully", output });
    } catch (migrationError: any) {
      const errorMsg = migrationError.message || migrationError.stderr || String(migrationError);
      console.error("❌ Migration error:", errorMsg);
      res.json({ status: "error", message: "Migration failed", error: errorMsg });
    }
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// Reset and recreate database (DANGER - deletes all data!)
app.all("/admin/reset-db", async (_req, res) => {
  try {
    const { execSync } = require("child_process");
    console.log("🔄 Resetting database...");
    
    try {
      await prisma.$disconnect();
      
      // Reset the database - this will drop all tables and re-run migrations
      const output = execSync("npx prisma migrate reset --force", { encoding: "utf-8" });
      console.log("✅ Database reset completed:", output);
      
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: "success", message: "Database reset and recreated successfully", output });
    } catch (error: any) {
      const errorMsg = error.message || error.stderr || String(error);
      console.error("❌ Reset error:", errorMsg);
      res.json({ status: "error", message: "Reset failed", error: errorMsg });
    }
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// Baseline existing database for Prisma migrations
app.all("/admin/baseline", async (_req, res) => {
  try {
    const { execSync } = require("child_process");
    console.log("🔄 Baseline database...");
    
    try {
      await prisma.$disconnect();
      
      // Baseline the latest migration
      const output = execSync("npx prisma migrate resolve --applied 20251017050009_add_password_reset_table", { encoding: "utf-8" });
      console.log("✅ Baseline completed:", output);
      
      // Now deploy remaining migrations
      const deployOutput = execSync("npx prisma migrate deploy", { encoding: "utf-8" });
      console.log("✅ Deploy completed:", deployOutput);
      
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: "success", message: "Database baselined successfully", output: output + "\n" + deployOutput });
    } catch (error: any) {
      const errorMsg = error.message || error.stderr || String(error);
      console.error("❌ Baseline error:", errorMsg);
      res.json({ status: "error", message: "Baseline failed", error: errorMsg });
    }
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/auth", authRoutes);
app.use("/password-reset", passwordResetRoutes);
app.use("/messages", messagesRoutes);
app.use("/friends", friendsRoutes);
app.use("/upload", uploadRoutes);
app.use("/groups", groupsRoutes);

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
        console.log("📨 Received send_message event:", JSON.stringify(data, null, 2));
        const { token, content, recipientId, groupId, fileUrl, fileName, fileType, fileSize } = data as { 
          token?: string; 
          content: string; 
          recipientId?: number;
          groupId?: number;
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

        // Create message with recipientId for DM or groupId for group chat
        const message = await prisma.message.create({
          data: { 
            userId, 
            content,
            recipientId: recipientId || null,
            groupId: groupId || null,
            fileUrl: fileUrl || null,
            fileName: fileName || null,
            fileType: fileType || null,
            fileSize: fileSize || null
          },
          include: { user: true },
        });

        console.log("💾 Message created:", message.id, "GroupId:", groupId, "RecipientId:", recipientId);

        // Handle group messages
        if (groupId) {
          console.log("📢 Broadcasting to group:", groupId);
          // Get all group members
          const members = await prisma.groupMember.findMany({
            where: { groupId },
            select: { userId: true }
          });

          // Emit to all sockets of group members
          const sockets = await io.fetchSockets();
          console.log("🔍 Total sockets:", sockets.length, "Group members:", members.length);
          sockets.forEach(s => {
            if (members.some(m => m.userId === s.data?.user?.id)) {
              console.log("✅ Emitting to socket:", s.id, "user:", s.data?.user?.username);
              s.emit("receive_message", message);
            }
          });
        } else if (recipientId) {
          console.log("📤 Sending DM to recipient:", recipientId);
          // Handle direct messages - emit to both sender and recipient
          const senderSockets = await io.fetchSockets();
          console.log("🔍 Total sockets:", senderSockets.length);
          senderSockets.forEach(s => {
            if (s.data?.user?.id === userId) {
              console.log("✅ Emitting to sender:", s.id, "user:", s.data?.user?.username);
              s.emit("receive_message", message);
            }
          });

          // Emit to all sockets of the recipient
          senderSockets.forEach(s => {
            if (s.data?.user?.id === recipientId) {
              console.log("✅ Emitting to recipient:", s.id, "user:", s.data?.user?.username);
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
