import { prisma } from './prismaclient';

async function fixDuplicateUsernames() {
  try {
    // Find all users
    const users = await prisma.user.findMany({
      orderBy: { id: 'asc' }
    });

    // Group users by username
    const usernameGroups = new Map<string, typeof users>();
    
    for (const user of users) {
      const existing = usernameGroups.get(user.username) || [];
      existing.push(user);
      usernameGroups.set(user.username, existing);
    }

    // Fix duplicates
    let fixedCount = 0;
    for (const [username, userList] of usernameGroups) {
      if (userList.length > 1) {
        console.log(`Found ${userList.length} users with username: ${username}`);
        
        // Keep the first one, rename the rest
        for (let i = 1; i < userList.length; i++) {
          const user = userList[i];
          if (user) {
            const newUsername = `${username}_${user.id}`;
            await prisma.user.update({
              where: { id: user.id },
              data: { username: newUsername }
            });
            console.log(`  Renamed user ${user.id}: ${username} -> ${newUsername}`);
            fixedCount++;
          }
        }
      }
    }

    if (fixedCount === 0) {
      console.log('✅ No duplicate usernames found');
    } else {
      console.log(`✅ Fixed ${fixedCount} duplicate usernames`);
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error fixing duplicate usernames:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

fixDuplicateUsernames();
