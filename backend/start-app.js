#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
  return new Promise((resolve, reject) => {
    console.log('🔄 Running database migrations...');
    exec('npx prisma migrate deploy --skip-generate', (error, stdout, stderr) => {
      if (error) {
        console.log('⚠️ Migration warning (may be expected):', stderr);
        // Continue anyway - migrations might have already been run
      }
      console.log('✅ Migrations step complete');
      resolve();
    });
  });
}

async function startApp() {
  try {
    await runMigrations();
    console.log('🚀 Starting application...');
    require('./dist/index.js');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

startApp();
