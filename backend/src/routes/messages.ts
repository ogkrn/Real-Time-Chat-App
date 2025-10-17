import { Router } from "express";
import { prisma } from "../prismaclient";

const router = Router();

// Get messages between two users
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.query['currentUserId'] as string;

    if (!currentUserId) {
      return res.status(400).json({ error: "Current user ID is required" });
    }

    // TODO: Enable friendship check after migration is run
    // Check if users are friends before allowing message access
    // const friendship = await prisma.friendship.findFirst({
    //   where: {
    //     status: 'accepted',
    //     OR: [
    //       { senderId: parseInt(currentUserId), receiverId: parseInt(userId) },
    //       { senderId: parseInt(userId), receiverId: parseInt(currentUserId) }
    //     ]
    //   }
    // });

    // if (!friendship) {
    //   return res.status(403).json({ error: "You can only message friends" });
    // }

    // Fetch messages where either:
    // - currentUser sent to userId, OR
    // - userId sent to currentUser
    const messages = await prisma.message.findMany({
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
  } catch (error: any) {
    console.error("Fetch messages error:", error.message);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// Delete all messages between two users
router.delete("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { currentUserId } = req.body;

    if (!currentUserId) {
      return res.status(400).json({ error: "Current user ID is required" });
    }

    // Delete messages where either:
    // - currentUser sent to userId, OR
    // - userId sent to currentUser
    await prisma.message.deleteMany({
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
  } catch (error: any) {
    console.error("Delete messages error:", error.message);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// Get messages for a group
router.get("/group/:groupId", async (req, res) => {
  try {
    const { groupId } = req.params;

    // Fetch all messages for this group
    const messages = await prisma.message.findMany({
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
  } catch (error: any) {
    console.error("Fetch group messages error:", error.message);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// Delete all messages in a group (admin only)
router.delete("/group/:groupId", async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Check if user is admin of the group
    const membership = await prisma.groupMember.findUnique({
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

    // Delete all messages in the group
    await prisma.message.deleteMany({
      where: {
        groupId: parseInt(groupId)
      }
    });

    return res.json({ success: true, message: "Group chat history cleared" });
  } catch (error: any) {
    console.error("Delete group messages error:", error.message);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
});

export default router;
