import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../prismaclient.js";  // create prismaClient.ts wrapper

const router = Router();

// Register
router.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { username, password: hashed }
  });
  res.json(user);
});

// Login
router.post("/login", async (req,res) => {
  const { username, password } = req.body;
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) return res.status(400).json({ error: "User not found" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign({ id: user.id }, process.env["JWT_SECRET"]!, { expiresIn: "1d" });
  res.json({ token });
});

export default router;
