"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prismaclient_1 = require("../prismaclient");
const router = (0, express_1.Router)();
router.post("/register", async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ error: "Username, email, and password are required" });
        }
        if (password.length < 8) {
            return res.status(400).json({ error: "Password must be at least 8 characters long" });
        }
        const existingUser = await prismaclient_1.prisma.user.findUnique({
            where: { email }
        });
        if (existingUser) {
            return res.status(409).json({ error: "Email already exists" });
        }
        const hashed = await bcrypt_1.default.hash(password, 10);
        const user = await prismaclient_1.prisma.user.create({
            data: { username, email, password: hashed }
        });
        const { password: _, ...userWithoutPassword } = user;
        return res.status(201).json({ message: "User created successfully", user: userWithoutPassword });
    }
    catch (error) {
        console.error("Registration error:", error.message);
        return res.status(500).json({ error: error.message || "Internal server error" });
    }
});
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }
        const user = await prismaclient_1.prisma.user.findUnique({
            where: { email }
        });
        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        const isValidPassword = await bcrypt_1.default.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        const { password: _, ...userWithoutPassword } = user;
        return res.json({
            message: "Login successful",
            user: userWithoutPassword,
            userId: user.id
        });
    }
    catch (error) {
        console.error("Login error:", error.message);
        return res.status(500).json({ error: error.message || "Internal server error" });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map