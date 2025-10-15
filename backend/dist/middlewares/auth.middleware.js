"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token)
        return res.status(401).json({ error: "No token provided" });
    return jsonwebtoken_1.default.verify(token, process.env["JWT_SECRET"], (err, user) => {
        if (err)
            return res.status(403).json({ error: "Invalid token" });
        req.user = user;
        return next();
    });
};
exports.authMiddleware = authMiddleware;
//# sourceMappingURL=auth.middleware.js.map