"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prismaclient_1 = require("../prismaclient");
const router = (0, express_1.Router)();
router.get("/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.query['currentUserId'];
        if (!currentUserId) {
            return res.status(400).json({ error: "Current user ID is required" });
        }
        const messages = await prismaclient_1.prisma.message.findMany({
            where: {
                OR: [
                    {
                        userId: parseInt(currentUserId),
                        recipientId: parseInt(userId)
                    },
                    {
                        userId: parseInt(userId),
                        recipientId: parseInt(currentUserId)
                    }
                ]
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        email: true
                    }
                }
            },
            orderBy: {
                createdAt: 'asc'
            }
        });
        return res.json({ messages });
    }
    catch (error) {
        console.error("Fetch messages error:", error.message);
        return res.status(500).json({ error: error.message || "Internal server error" });
    }
});
router.delete("/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const { currentUserId } = req.body;
        if (!currentUserId) {
            return res.status(400).json({ error: "Current user ID is required" });
        }
        await prismaclient_1.prisma.message.deleteMany({
            where: {
                OR: [
                    {
                        userId: parseInt(currentUserId),
                        recipientId: parseInt(userId)
                    },
                    {
                        userId: parseInt(userId),
                        recipientId: parseInt(currentUserId)
                    }
                ]
            }
        });
        return res.json({ success: true, message: "Chat history cleared" });
    }
    catch (error) {
        console.error("Delete messages error:", error.message);
        return res.status(500).json({ error: error.message || "Internal server error" });
    }
});
router.get("/group/:groupId", async (req, res) => {
    try {
        const { groupId } = req.params;
        const messages = await prismaclient_1.prisma.message.findMany({
            where: {
                groupId: parseInt(groupId)
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        email: true
                    }
                }
            },
            orderBy: {
                createdAt: 'asc'
            }
        });
        return res.json({ messages });
    }
    catch (error) {
        console.error("Fetch group messages error:", error.message);
        return res.status(500).json({ error: error.message || "Internal server error" });
    }
});
router.delete("/group/:groupId", async (req, res) => {
    try {
        const { groupId } = req.params;
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
        }
        const membership = await prismaclient_1.prisma.groupMember.findUnique({
            where: {
                groupId_userId: {
                    groupId: parseInt(groupId),
                    userId: parseInt(userId)
                }
            }
        });
        if (!membership || membership.role !== 'admin') {
            return res.status(403).json({ error: "Only group admins can clear chat history" });
        }
        await prismaclient_1.prisma.message.deleteMany({
            where: {
                groupId: parseInt(groupId)
            }
        });
        return res.json({ success: true, message: "Group chat history cleared" });
    }
    catch (error) {
        console.error("Delete group messages error:", error.message);
        return res.status(500).json({ error: error.message || "Internal server error" });
    }
});
exports.default = router;
//# sourceMappingURL=messages.js.map