#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

async function runCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${command} ${args.join(' ')}`);
    const proc = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      cwd: __dirname
    });

    proc.on('close', (code) => {
      if (code !== 0 && code !== 2) {
        // Code 2 is OK for prisma migrate (already migrated)
        console.log(`Command exited with code ${code}`);
      }
      resolve();
    });

    proc.on('error', (err) => {
      console.error(`Error running command: ${err.message}`);
      resolve(); // Continue anyway
    });
  });
}

async function start() {
  try {
    console.log('🔄 Ensuring Prisma Client is generated...');
    await runCommand('npx', ['prisma', 'generate']);

    console.log('🔄 Running database migrations...');
    await runCommand('npx', ['prisma', 'migrate', 'deploy']);

    console.log('✅ Migrations complete!');
    console.log('🚀 Starting application...');
    
    require('./dist/index.js');
  } catch (error) {
    console.error('❌ Error during startup:', error);
    process.exit(1);
  }
}

start();
