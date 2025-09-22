import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ error: "No token provided" });

  return jwt.verify(token, process.env["JWT_SECRET"]!, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    (req as any).user = user; // attach user info to request
    return next();
  });
};