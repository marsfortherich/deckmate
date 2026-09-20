import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signInWithEmailPassword, signOutUser, onAuthStateChanged } from '../authService';
import * as firebaseAuth from 'firebase/auth';

// Mock firebase/auth module
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
}));

// Mock firebase config
vi.mock('../firebase', () => ({
  auth: {},
  db: {},
  firebaseApp: {},
}));

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('signInWithEmailPassword', () => {
    it('should call Firebase signInWithEmailAndPassword with correct parameters', async () => {
      const mockUserCredential = {
        user: { uid: 'test-uid', email: 'test@example.com' },
      };
      
      vi.mocked(firebaseAuth.signInWithEmailAndPassword).mockResolvedValue(
        mockUserCredential as any
      );

      const email = 'test@example.com';
      const password = 'testPassword123';

      const result = await signInWithEmailPassword(email, password);

      expect(firebaseAuth.signInWithEmailAndPassword).toHaveBeenCalledWith(
        {},
        email,
        password
      );
      expect(result).toEqual(mockUserCredential);
    });

    it('should propagate errors from Firebase', async () => {
      const mockError = new Error('Invalid credentials');
      vi.mocked(firebaseAuth.signInWithEmailAndPassword).mockRejectedValue(mockError);

      await expect(
        signInWithEmailPassword('wrong@example.com', 'wrongPassword')
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('signOutUser', () => {
    it('should call Firebase signOut', async () => {
      vi.mocked(firebaseAuth.signOut).mockResolvedValue(undefined);

      await signOutUser();

      expect(firebaseAuth.signOut).toHaveBeenCalledWith({});
    });

    it('should propagate errors from Firebase', async () => {
      const mockError = new Error('Sign out failed');
      vi.mocked(firebaseAuth.signOut).mockRejectedValue(mockError);

      await expect(signOutUser()).rejects.toThrow('Sign out failed');
    });
  });

  describe('onAuthStateChanged', () => {
    it('should register auth state listener and return unsubscribe function', () => {
      const mockCallback = vi.fn();
      const mockUnsubscribe = vi.fn();

      vi.mocked(firebaseAuth.onAuthStateChanged).mockReturnValue(mockUnsubscribe);

      const unsubscribe = onAuthStateChanged(mockCallback);

      expect(firebaseAuth.onAuthStateChanged).toHaveBeenCalledWith({}, mockCallback);
      expect(unsubscribe).toBe(mockUnsubscribe);
    });

    it('should invoke callback when auth state changes', () => {
      const mockCallback = vi.fn();
      const mockUser = { uid: 'test-uid', email: 'test@example.com' };

      vi.mocked(firebaseAuth.onAuthStateChanged).mockImplementation((_auth: any, callback: any) => {
        // Simulate immediate callback invocation
        callback(mockUser as any);
        return vi.fn();
      });

      onAuthStateChanged(mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(mockUser);
    });
  });
});
