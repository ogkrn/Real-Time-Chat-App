import { Router } from "express";
import { prisma } from "../prismaclient";
import bcrypt from "bcrypt";
import crypto from "crypto";

const router = Router();

// Request password reset (generates a token)
router.post("/request", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || email.trim() === "") {
      return res.status(400).json({ error: "Email is required" });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (!user) {
      // In development mode, tell the user directly
      // In production, you would hide this for security
      return res.status(404).json({ 
        error: "No account found with that email address. Please check your email or register for a new account.",
        devMode: true
      });
    }

    // Generate a random 6-digit code
    const resetCode = crypto.randomInt(100000, 999999).toString();
    
    // Hash the code before storing (security best practice)
    const hashedToken = await bcrypt.hash(resetCode, 10);
    
    // Set expiration to 15 minutes from now
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Delete any existing unused reset tokens for this email
    await prisma.passwordReset.deleteMany({
      where: {
        email: email.toLowerCase().trim(),
        used: false
      }
    });

    // Create new reset token
    await prisma.passwordReset.create({
      data: {
        email: email.toLowerCase().trim(),
        token: hashedToken,
        expiresAt,
        used: false
      }
    });

    // In development, return the plain code
    // In production, this would be sent via email
    return res.json({ 
      success: true, 
      message: "Reset code generated successfully",
      // WARNING: Remove this in production! Only for development/testing
      devResetCode: resetCode,
      devMode: true,
      expiresIn: "15 minutes"
    });

  } catch (error: any) {
    console.error("Password reset request error:", error.message);
    return res.status(500).json({ error: "Failed to process password reset request" });
  }
});

// Verify reset code and change password
router.post("/reset", async (req, res) => {
  try {
    const { email, resetCode, newPassword } = req.body;

    if (!email || !resetCode || !newPassword) {
      return res.status(400).json({ error: "Email, reset code, and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long" });
    }

    // Find all non-used reset tokens for this email
    const resetTokens = await prisma.passwordReset.findMany({
      where: {
        email: email.toLowerCase().trim(),
        used: false,
        expiresAt: {
          gte: new Date() // Not expired
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (resetTokens.length === 0) {
      return res.status(400).json({ 
        error: "Invalid or expired reset code. Please request a new one." 
      });
    }

    // Check if the provided code matches any of the tokens
    let validToken = null;
    for (const token of resetTokens) {
      const isValid = await bcrypt.compare(resetCode, token.token);
      if (isValid) {
        validToken = token;
        break;
      }
    }

    if (!validToken) {
      return res.status(400).json({ 
        error: "Invalid reset code. Please check and try again." 
      });
    }

    // Check if user still exists
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password and mark token as used
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      }),
      prisma.passwordReset.update({
        where: { id: validToken.id },
        data: { used: true }
      })
    ]);

    return res.json({ 
      success: true, 
      message: "Password reset successfully! You can now login with your new password." 
    });

  } catch (error: any) {
    console.error("Password reset error:", error.message);
    return res.status(500).json({ error: "Failed to reset password" });
  }
});

export default router;
