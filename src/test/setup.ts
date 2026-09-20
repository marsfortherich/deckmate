import '@testing-library/jest-dom/vitest';
import { beforeAll, afterEach, afterAll, vi } from 'vitest';

/**
 * Global mock for the Firebase singleton module.
 *
 * `src/services/firebase.ts` calls initializeApp/getAuth/getFirestore/
 * getDatabase/getFunctions at import time. Any test that (even transitively)
 * imports a service would otherwise hit the real SDK and need live
 * credentials. Mocking the module once here means individual tests only have
 * to mock the service they actually exercise.
 */
vi.mock('../services/firebase', () => ({
  firebaseApp: {},
  auth: {},
  rtdb: {},
  db: {},
  functions: {},
}));

// Mock environment variables for tests
beforeAll(() => {
  vi.stubEnv('VITE_FIREBASE_API_KEY', 'test-api-key');
  vi.stubEnv('VITE_FIREBASE_AUTH_DOMAIN', 'test-project.firebaseapp.com');
  vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'test-project');
  vi.stubEnv('VITE_FIREBASE_STORAGE_BUCKET', 'test-project.appspot.com');
  vi.stubEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', '123456789');
  vi.stubEnv('VITE_FIREBASE_APP_ID', '1:123456789:web:abcdef');
  vi.stubEnv('VITE_FIREBASE_DATABASE_URL', 'https://test-project.firebaseio.com');
});

afterEach(() => {
  vi.clearAllMocks();
});

afterAll(() => {
  vi.unstubAllEnvs();
});
