import { Router } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../prismaclient"; // create prismaClient.ts wrapper

const router = Router();

// Register
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ error: "Username, email, and password are required" });
    }

    // Validate password strength (optional but recommended)
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters long" });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email } // Ensure email is unique
    });

    if (existingUser) {
      return res.status(409).json({ error: "Email already exists" });
    }

    // Hash password and create user
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { username, email, password: hashed }
    });

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return res.status(201).json({ message: "User created successfully", user: userWithoutPassword });
  } catch (error: any) {
    console.error("Registration error:", error.message);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email } // Query by email
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Compare password
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
  } catch (error: any) {
    console.error("Login error:", error.message);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
});

export default router;