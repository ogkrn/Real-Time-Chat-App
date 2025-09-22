"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
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
    const user = await prismaclient_js_1.prisma.user.findUnique({ where: { username } });
    if (!user)
        return res.status(401).json({ error: "Invalid credentials" });
    const valid = await bcrypt_1.default.compare(password, user.password);
    if (!valid)
        return res.status(401).json({ error: "Invalid credentials" });
    const token = jsonwebtoken_1.default.sign({ id: user.id }, process.env["JWT_SECRET"], { expiresIn: "1d" });
    return res.json({ token });
});
exports.default = router;
//# sourceMappingURL=auth.js.map