"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const path_1 = __importDefault(require("path"));
const auth_1 = __importDefault(require("./routes/auth"));
const messages_1 = __importDefault(require("./routes/messages"));
const friends_1 = __importDefault(require("./routes/friends"));
const upload_1 = __importDefault(require("./routes/upload"));
const groups_1 = __importDefault(require("./routes/groups"));
const password_reset_1 = __importDefault(require("./routes/password-reset"));
const prismaclient_1 = require("./prismaclient");
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express_1.default.json());
app.get("/health", (_req, res) => {
    res.json({ status: "ok", message: "Server is running" });
});
app.get("/health/db", async (_req, res) => {
    try {
        await prismaclient_1.prisma.$queryRaw `SELECT 1`;
        res.json({ status: "ok", message: "Database connection successful" });
    }
    catch (error) {
        res.status(500).json({ status: "error", message: error.message || "Database connection failed" });
    }
});
app.all("/admin/migrate", async (_req, res) => {
    try {
        const { execSync } = require("child_process");
        console.log("🚀 Starting database migration...");
        try {
            await prismaclient_1.prisma.$disconnect();
            const output = execSync("npx prisma migrate deploy", { encoding: "utf-8" });
            console.log("✅ Migrations completed:", output);
            await prismaclient_1.prisma.$queryRaw `SELECT 1`;
            res.json({ status: "success", message: "Migrations applied successfully", output });
        }
        catch (migrationError) {
            const errorMsg = migrationError.message || migrationError.stderr || String(migrationError);
            console.error("❌ Migration error:", errorMsg);
            res.json({ status: "error", message: "Migration failed", error: errorMsg });
        }
    }
    catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});
app.all("/admin/reset-db", async (_req, res) => {
    try {
        const { execSync } = require("child_process");
        console.log("🔄 Resetting database...");
        try {
            await prismaclient_1.prisma.$disconnect();
            const output = execSync("npx prisma migrate reset --force", { encoding: "utf-8" });
            console.log("✅ Database reset completed:", output);
            await prismaclient_1.prisma.$queryRaw `SELECT 1`;
            res.json({ status: "success", message: "Database reset and recreated successfully", output });
        }
        catch (error) {
            const errorMsg = error.message || error.stderr || String(error);
            console.error("❌ Reset error:", errorMsg);
            res.json({ status: "error", message: "Reset failed", error: errorMsg });
        }
    }
    catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});
app.all("/admin/baseline", async (_req, res) => {
    try {
        const { execSync } = require("child_process");
        console.log("🔄 Baseline database...");
        try {
            await prismaclient_1.prisma.$disconnect();
            const output = execSync("npx prisma migrate resolve --applied 20251017050009_add_password_reset_table", { encoding: "utf-8" });
            console.log("✅ Baseline completed:", output);
            const deployOutput = execSync("npx prisma migrate deploy", { encoding: "utf-8" });
            console.log("✅ Deploy completed:", deployOutput);
            await prismaclient_1.prisma.$queryRaw `SELECT 1`;
            res.json({ status: "success", message: "Database baselined successfully", output: output + "\n" + deployOutput });
        }
        catch (error) {
            const errorMsg = error.message || error.stderr || String(error);
            console.error("❌ Baseline error:", errorMsg);
            res.json({ status: "error", message: "Baseline failed", error: errorMsg });
        }
    }
    catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});
app.use("/uploads", express_1.default.static(path_1.default.join(__dirname, "../uploads")));
app.use("/auth", auth_1.default);
app.use("/password-reset", password_reset_1.default);
app.use("/messages", messages_1.default);
app.use("/friends", friends_1.default);
app.use("/upload", upload_1.default);
app.use("/groups", groups_1.default);
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: (_origin, callback) => {
            callback(null, true);
        },
        methods: ["GET", "POST"],
        credentials: true
    },
    transports: ['polling', 'websocket'],
    pingInterval: 25000,
    pingTimeout: 60000,
    allowUpgrades: true,
    path: '/socket.io/',
    serveClient: false
});
async function initializeServer() {
    console.log("📡 Using in-memory adapter (suitable for single server deployment)");
    io.use(async (socket, next) => {
        const JWT_SECRET = process.env['JWT_SECRET'] || "supersecretkey";
        try {
            const token = (socket.handshake && socket.handshake.auth && socket.handshake.auth.token) || null;
            if (!token)
                return next();
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            if (typeof decoded === "string" || !decoded || typeof decoded !== "object" || !("id" in decoded)) {
                return next();
            }
            const maybeId = decoded.id;
            const idNum = Number(maybeId);
            if (Number.isNaN(idNum))
                return next();
            const user = await prismaclient_1.prisma.user.findUnique({ where: { id: idNum } });
            if (user)
                socket.data.user = { id: user.id, username: user.username };
            return next();
        }
        catch (err) {
            console.warn("Socket auth token invalid:", err instanceof Error ? err.message : err);
            return next();
        }
    });
    io.on("connection", (socket) => {
        console.log("User connected:", socket.id, "user:", socket.data?.user?.username ?? "(anonymous)");
        socket.on("send_message", async (data) => {
            try {
                console.log("📨 Received send_message event:", JSON.stringify(data, null, 2));
                const { token, content, recipientId, groupId, fileUrl, fileName, fileType, fileSize } = data;
                let userId = socket.data?.user?.id ?? null;
                const JWT_SECRET = process.env['JWT_SECRET'] || "supersecretkey";
                if (!userId) {
                    if (!token)
                        return;
                    const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
                    if (typeof decoded === "string" || !decoded || typeof decoded !== "object" || !("id" in decoded)) {
                        console.warn("Invalid token payload or missing id");
                        return;
                    }
                    const maybeId = decoded.id;
                    const idNum = Number(maybeId);
                    if (Number.isNaN(idNum)) {
                        console.warn("Invalid user id in token payload");
                        return;
                    }
                    userId = idNum;
                }
                const message = await prismaclient_1.prisma.message.create({
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
                if (groupId) {
                    console.log("📢 Broadcasting to group:", groupId);
                    const members = await prismaclient_1.prisma.groupMember.findMany({
                        where: { groupId },
                        select: { userId: true }
                    });
                    const sockets = await io.fetchSockets();
                    console.log("🔍 Total sockets:", sockets.length, "Group members:", members.length);
                    sockets.forEach(s => {
                        if (members.some(m => m.userId === s.data?.user?.id)) {
                            console.log("✅ Emitting to socket:", s.id, "user:", s.data?.user?.username);
                            s.emit("receive_message", message);
                        }
                    });
                }
                else if (recipientId) {
                    console.log("📤 Sending DM to recipient:", recipientId);
                    const senderSockets = await io.fetchSockets();
                    console.log("🔍 Total sockets:", senderSockets.length);
                    senderSockets.forEach(s => {
                        if (s.data?.user?.id === userId) {
                            console.log("✅ Emitting to sender:", s.id, "user:", s.data?.user?.username);
                            s.emit("receive_message", message);
                        }
                    });
                    senderSockets.forEach(s => {
                        if (s.data?.user?.id === recipientId) {
                            console.log("✅ Emitting to recipient:", s.id, "user:", s.data?.user?.username);
                            s.emit("receive_message", message);
                        }
                    });
                }
                else {
                    io.emit("receive_message", message);
                }
            }
            catch (error) {
                console.error("JWT verification failed:", error);
            }
        });
        socket.on("disconnect", () => {
            console.log("User disconnected:", socket.id);
        });
    });
    server.listen(5000, () => {
        console.log("🚀 Backend running on port 5000");
        console.log("📡 Socket.IO server initialized");
    });
}
initializeServer().catch((error) => {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map