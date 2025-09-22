"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prismaclient_js_1 = require("../prismaclient.js");
const router = (0, express_1.Router)();
router.post("/register", async (req, res) => {
    const { username, password } = req.body;
    const hashed = await bcrypt_1.default.hash(password, 10);
    const user = await prismaclient_js_1.prisma.user.create({
        data: { username, password: hashed }
    });
    res.json(user);
});
router.post("/login", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
    }
    try {
        const user = await prismaclient_js_1.prisma.user.findUnique({
            where: { username: username },
        });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        if (user.password !== password) {
            return res.status(401).json({ error: "Invalid password" });
        }
        return res.json({ message: "Login successful", user });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Something went wrong" });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map