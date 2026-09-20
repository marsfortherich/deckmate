/**
 * Vitest config for Firebase security-rules tests.
 *
 * Separate from the main config because these tests talk to the emulator over
 * the network: they need the node environment, and they must not load the
 * global Firebase mock in src/test/setup.ts.
 *
 * Run them with `npm run test:rules`, which starts and stops the emulator.
 */
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/test/rules/**/*.test.ts'],
    // The emulator can be slow to accept the first connection.
    testTimeout: 20_000,
    hookTimeout: 30_000,
  },
});
