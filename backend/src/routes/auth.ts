import { Router } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../prismaclient";  // create prismaClient.ts wrapper

const router = Router();

// Register
router.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Validate input
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      return res.status(409).json({ error: "Username already exists" });
    }

    // Hash password and create user
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { username, password: hashed }
    });
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return res.status(201).json({ message: "User created successfully", user: userWithoutPassword });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    const user = await prisma.user.findUnique({
      where: { username: username }
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Use bcrypt to compare password with hashed password
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Return success with user info (without password)
    const { password: _, ...userWithoutPassword } = user;
    return res.json({ 
      message: "Login successful", 
      user: userWithoutPassword,
      userId: user.id 
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
