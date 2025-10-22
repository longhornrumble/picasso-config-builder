#!/usr/bin/env tsx

/**
 * Standalone script to start mock server for E2E tests
 * Run this before running Playwright tests
 */

import { startMockServer } from './mock-server';

async function main() {
  try {
    await startMockServer(3001);
    console.log('✓ Mock server started on port 3001');
    console.log('Press Ctrl+C to stop the server');

    // Keep process alive
    process.on('SIGINT', () => {
      console.log('\n✓ Mock server stopped');
      process.exit(0);
    });
  } catch (error) {
    console.error('✗ Failed to start mock server:', error);
    process.exit(1);
  }
}

main();
