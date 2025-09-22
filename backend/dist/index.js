"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const auth_js_1 = __importDefault(require("./routes/auth.js"));
const prismaclient_js_1 = require("./prismaclient.js");
const redis_1 = require("redis");
const redis_adapter_1 = require("@socket.io/redis-adapter");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use("/auth", auth_js_1.default);
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
    io.on("connection", (socket) => {
        console.log("User connected:", socket.id);
        socket.on("send_message", async (data) => {
            const { userId, content } = data;
            const message = await prismaclient_js_1.prisma.message.create({ data: { userId, content } });
            io.emit("receive_message", message);
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