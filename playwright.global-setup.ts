/**
 * Playwright Global Setup
 * Starts the mock server before all tests run
 */

import { startMockServer } from './e2e/fixtures/mock-server';

export default async function globalSetup() {
  console.log('🚀 Starting mock server for E2E tests...');

  try {
    await startMockServer(3001);
    console.log('✅ Mock server started on http://localhost:3001');
  } catch (error) {
    console.error('❌ Failed to start mock server:', error);
    throw error;
  }
}
