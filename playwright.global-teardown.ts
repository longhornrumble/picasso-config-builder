/**
 * Playwright Global Teardown
 * Stops the mock server after all tests complete
 */

import { stopMockServer } from './e2e/fixtures/mock-server';

export default async function globalTeardown() {
  console.log('🛑 Stopping mock server...');

  try {
    await stopMockServer();
    console.log('✅ Mock server stopped');
  } catch (error) {
    console.error('❌ Failed to stop mock server:', error);
    // Don't throw - teardown should be graceful
  }
}
