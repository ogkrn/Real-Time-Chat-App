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
const auth_1 = __importDefault(require("./routes/auth"));
const prismaclient_1 = require("./prismaclient");
const redis_1 = require("redis");
const redis_adapter_1 = require("@socket.io/redis-adapter");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use("/auth", auth_1.default);
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, { cors: { origin: "*" } });
async function initializeServer() {
    try {
        const pubClient = (0, redis_1.createClient)({ url: "redis://localhost:6379" });
        const subClient = pubClient.duplicate();
        await pubClient.connect();
        await subClient.connect();
        io.adapter((0, redis_adapter_1.createAdapter)(pubClient, subClient));
        console.log("✅ Redis adapter connected successfully");
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.warn("⚠️ Redis connection failed, using memory adapter:", errorMessage);
    }
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
                const { token, content } = data;
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
                    data: { userId, content },
                    include: { user: true },
                });
                io.emit("receive_message", message);
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