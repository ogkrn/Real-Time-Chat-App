import { Router } from 'express';
import { prisma } from '../prismaclient';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Search users by username
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const { username } = req.query;
    const currentUserId = (req as any).user.id;

    if (!username || typeof username !== 'string') {
      return res.status(400).json({ error: 'Username query is required' });
    }

    const users = await prisma.user.findMany({
      where: {
        username: {
          contains: username,
          mode: 'insensitive',
        },
        id: {
          not: currentUserId, // Exclude current user
        },
      },
      select: {
        id: true,
        username: true,
        email: true,
      },
      take: 10,
    });

    return res.json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    return res.status(500).json({ error: 'Failed to search users' });
  }
});

// Send friend request
router.post('/request', authMiddleware, async (req, res) => {
  try {
    const senderId = (req as any).user.id;
    const { receiverId } = req.body;

    if (!receiverId) {
      return res.status(400).json({ error: 'Receiver ID is required' });
    }

    // Check if friendship already exists
    const existingFriendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
      },
    });

    if (existingFriendship) {
      return res.status(400).json({ error: 'Friend request already exists' });
    }

    const friendship = await prisma.friendship.create({
      data: {
        senderId,
        receiverId,
        status: 'pending',
      },
      include: {
        receiver: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    return res.json(friendship);
  } catch (error) {
    console.error('Error sending friend request:', error);
    return res.status(500).json({ error: 'Failed to send friend request' });
  }
});

// Get pending friend requests (received)
router.get('/requests/pending', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;

    const requests = await prisma.friendship.findMany({
      where: {
        receiverId: userId,
        status: 'pending',
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.json(requests);
  } catch (error) {
    console.error('Error fetching pending requests:', error);
    return res.status(500).json({ error: 'Failed to fetch pending requests' });
  }
});

// Accept friend request
router.put('/request/:id/accept', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const requestId = parseInt(req.params['id']!);

    const friendship = await prisma.friendship.findUnique({
      where: { id: requestId },
    });

    if (!friendship) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    if (friendship.receiverId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const updated = await prisma.friendship.update({
      where: { id: requestId },
      data: { status: 'accepted' },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    return res.json(updated);
  } catch (error) {
    console.error('Error accepting friend request:', error);
    return res.status(500).json({ error: 'Failed to accept friend request' });
  }
});

// Reject friend request
router.put('/request/:id/reject', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const requestId = parseInt(req.params['id']!);

    const friendship = await prisma.friendship.findUnique({
      where: { id: requestId },
    });

    if (!friendship) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    if (friendship.receiverId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await prisma.friendship.update({
      where: { id: requestId },
      data: { status: 'rejected' },
    });

    return res.json({ message: 'Friend request rejected' });
  } catch (error) {
    console.error('Error rejecting friend request:', error);
    return res.status(500).json({ error: 'Failed to reject friend request' });
  }
});

// Get all friends (accepted friendships)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;

    const friendships = await prisma.friendship.findMany({
      where: {
        status: 'accepted',
        OR: [
          { senderId: userId },
          { receiverId: userId },
        ],
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    // Extract the friend (not the current user) from each friendship
    const friends = friendships.map(friendship => {
      return friendship.senderId === userId ? friendship.receiver : friendship.sender;
    });

    return res.json(friends);
  } catch (error) {
    console.error('Error fetching friends:', error);
    return res.status(500).json({ error: 'Failed to fetch friends' });
  }
});

// Check friendship status with another user
router.get('/status/:userId', authMiddleware, async (req, res) => {
  try {
    const currentUserId = (req as any).user.id;
    const otherUserId = parseInt(req.params['userId']!);

    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId: currentUserId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: currentUserId },
        ],
      },
    });

    if (!friendship) {
      return res.json({ status: 'none', canMessage: false });
    }

    return res.json({
      status: friendship.status,
      canMessage: friendship.status === 'accepted',
      isSender: friendship.senderId === currentUserId,
    });
  } catch (error) {
    console.error('Error checking friendship status:', error);
    return res.status(500).json({ error: 'Failed to check friendship status' });
  }
});

export default router;
