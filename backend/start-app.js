#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('='.repeat(50));
console.log('🚀 Starting application initialization...');
console.log('='.repeat(50));

// Check environment
console.log('\n📋 Environment Check:');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);

try {
  // Generate Prisma Client
  console.log('\n🔧 Generating Prisma Client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Prisma Client generated');

  // Run migrations with verbose output
  console.log('\n🔄 Running database migrations...');
  try {
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    console.log('✅ Migrations completed successfully');
  } catch (migrationError) {
    console.log('⚠️ Migration encountered an issue (may be expected):');
    console.log(migrationError.message);
    // Continue anyway - app might still work
  }

  // Verify Prisma Client works
  console.log('\n✔️ Verifying database connection...');
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  
  prisma.$connect()
    .then(() => {
      console.log('✅ Database connection verified');
      prisma.$disconnect();
      
      // Now start the app
      console.log('\n' + '='.repeat(50));
      console.log('🚀 Starting Express app...');
      console.log('='.repeat(50) + '\n');
      require('./dist/index.js');
    })
    .catch((error) => {
      console.error('❌ Database connection failed:', error.message);
      process.exit(1);
    });

} catch (error) {
  console.error('❌ Fatal error during initialization:', error.message);
  process.exit(1);
}
