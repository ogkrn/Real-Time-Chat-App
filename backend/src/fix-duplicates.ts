import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixDuplicateUsernames() {
  try {
    // Find all users
    const users = await prisma.user.findMany({
      orderBy: { id: 'asc' }
    });

    // Track usernames we've seen
    const seenUsernames = new Map<string, number>();
    
    // Update duplicates
    for (const user of users) {
      if (seenUsernames.has(user.username)) {
        const count = seenUsernames.get(user.username)!;
        const newUsername = `${user.username}_${count + 1}`;
        
        console.log(`Updating duplicate username: ${user.username} -> ${newUsername} (user ID: ${user.id})`);
        
        await prisma.user.update({
          where: { id: user.id },
          data: { username: newUsername }
        });
        
        seenUsernames.set(user.username, count + 1);
        seenUsernames.set(newUsername, 1);
      } else {
        seenUsernames.set(user.username, 1);
      }
    }

    console.log('✅ All duplicate usernames fixed!');
  } catch (error) {
    console.error('Error fixing duplicate usernames:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixDuplicateUsernames();
