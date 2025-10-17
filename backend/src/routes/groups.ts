import { Router } from "express";
import { prisma } from "../prismaclient";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Create a new group
router.post("/", async (req, res) => {
  try {
    const { name, description, memberIds } = req.body;
    const userId = (req as any).user.id;

    if (!name || name.trim() === "") {
      return res.status(400).json({ error: "Group name is required" });
    }

    // Create group with creator as first member and admin
    const group = await prisma.group.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        creatorId: userId,
        members: {
          create: [
            {
              userId: userId,
              role: "admin"
            },
            ...(memberIds || []).filter((id: number) => id !== userId).map((id: number) => ({
              userId: id,
              role: "member"
            }))
          ]
        }
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            email: true
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true
              }
            }
          }
        }
      }
    });

    return res.json({ group });
  } catch (error: any) {
    console.error("Create group error:", error.message);
    return res.status(500).json({ error: error.message || "Failed to create group" });
  }
});

// Get all groups for current user
router.get("/", async (req, res) => {
  try {
    const userId = (req as any).user.id;

    const groups = await prisma.group.findMany({
      where: {
        members: {
          some: {
            userId: userId
          }
        }
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            email: true
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true
              }
            }
          }
        },
        _count: {
          select: {
            members: true,
            messages: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    return res.json({ groups });
  } catch (error: any) {
    console.error("Get groups error:", error.message);
    return res.status(500).json({ error: error.message || "Failed to fetch groups" });
  }
});

// Get single group details
router.get("/:groupId", async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const groupId = parseInt(req.params.groupId);

    // Check if user is a member
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId
        }
      }
    });

    if (!membership) {
      return res.status(403).json({ error: "You are not a member of this group" });
    }

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            email: true
          }
        },
        members: {
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
            joinedAt: 'asc'
          }
        }
      }
    });

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    return res.json({ group });
  } catch (error: any) {
    console.error("Get group error:", error.message);
    return res.status(500).json({ error: error.message || "Failed to fetch group" });
  }
});

// Add member to group
router.post("/:groupId/members", async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const groupId = parseInt(req.params.groupId);
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: "User IDs are required" });
    }

    // Check if current user is admin
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId
        }
      }
    });

    if (!membership || membership.role !== "admin") {
      return res.status(403).json({ error: "Only admins can add members" });
    }

    // Add new members
    const newMembers = await prisma.groupMember.createMany({
      data: userIds.map((id: number) => ({
        groupId,
        userId: id,
        role: "member"
      })),
      skipDuplicates: true
    });

    // Get updated group
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true
              }
            }
          }
        }
      }
    });

    return res.json({ group, added: newMembers.count });
  } catch (error: any) {
    console.error("Add member error:", error.message);
    return res.status(500).json({ error: error.message || "Failed to add members" });
  }
});

// Remove member from group
router.delete("/:groupId/members/:memberId", async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const groupId = parseInt(req.params.groupId);
    const memberId = parseInt(req.params.memberId);

    // Check if current user is admin
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId
        }
      }
    });

    if (!membership || membership.role !== "admin") {
      return res.status(403).json({ error: "Only admins can remove members" });
    }

    // Can't remove creator
    const group = await prisma.group.findUnique({
      where: { id: groupId }
    });

    if (group?.creatorId === memberId) {
      return res.status(400).json({ error: "Cannot remove group creator" });
    }

    // Remove member
    await prisma.groupMember.delete({
      where: {
        groupId_userId: {
          groupId,
          userId: memberId
        }
      }
    });

    return res.json({ success: true, message: "Member removed" });
  } catch (error: any) {
    console.error("Remove member error:", error.message);
    return res.status(500).json({ error: error.message || "Failed to remove member" });
  }
});

// Leave group
router.post("/:groupId/leave", async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const groupId = parseInt(req.params.groupId);

    const group = await prisma.group.findUnique({
      where: { id: groupId }
    });

    if (group?.creatorId === userId) {
      return res.status(400).json({ error: "Group creator cannot leave. Delete the group instead." });
    }

    await prisma.groupMember.delete({
      where: {
        groupId_userId: {
          groupId,
          userId
        }
      }
    });

    return res.json({ success: true, message: "Left group successfully" });
  } catch (error: any) {
    console.error("Leave group error:", error.message);
    return res.status(500).json({ error: error.message || "Failed to leave group" });
  }
});

// Delete group (creator only)
router.delete("/:groupId", async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const groupId = parseInt(req.params.groupId);

    const group = await prisma.group.findUnique({
      where: { id: groupId }
    });

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    if (group.creatorId !== userId) {
      return res.status(403).json({ error: "Only the group creator can delete the group" });
    }

    // Delete group (cascade will delete members and messages)
    await prisma.group.delete({
      where: { id: groupId }
    });

    return res.json({ success: true, message: "Group deleted successfully" });
  } catch (error: any) {
    console.error("Delete group error:", error.message);
    return res.status(500).json({ error: error.message || "Failed to delete group" });
  }
});

// Transfer ownership (creator only)
router.post("/:groupId/transfer-ownership", async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const groupId = parseInt(req.params.groupId);
    const { newOwnerId } = req.body;

    if (!newOwnerId) {
      return res.status(400).json({ error: "New owner ID is required" });
    }

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: true
      }
    });

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    if (group.creatorId !== userId) {
      return res.status(403).json({ error: "Only the group creator can transfer ownership" });
    }

    // Check if new owner is a member of the group
    const newOwnerMember = group.members.find(m => m.userId === newOwnerId);
    if (!newOwnerMember) {
      return res.status(400).json({ error: "New owner must be a member of the group" });
    }

    // Update group creator and make new owner admin
    await prisma.$transaction([
      // Update group creator
      prisma.group.update({
        where: { id: groupId },
        data: { creatorId: newOwnerId }
      }),
      // Make new owner admin if not already
      prisma.groupMember.update({
        where: {
          groupId_userId: {
            groupId,
            userId: newOwnerId
          }
        },
        data: { role: "admin" }
      }),
      // Demote previous owner to member
      prisma.groupMember.update({
        where: {
          groupId_userId: {
            groupId,
            userId
          }
        },
        data: { role: "member" }
      })
    ]);

    return res.json({ success: true, message: "Ownership transferred successfully" });
  } catch (error: any) {
    console.error("Transfer ownership error:", error.message);
    return res.status(500).json({ error: error.message || "Failed to transfer ownership" });
  }
});

export default router;
