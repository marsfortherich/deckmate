import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ensureUserDocument, UserDocument } from '../userService';
import * as firestore from 'firebase/firestore';

// Mock firebase/firestore module
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  getFirestore: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(),
}));

// Mock firebase config
vi.mock('../firebase', () => ({
  auth: {},
  db: {},
  firebaseApp: {},
  rtdb: {},
}));

describe('userService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock isUsernameTaken to return false by default (username available)
    vi.mocked(firestore.getDocs).mockResolvedValue({ empty: true } as any);
  });

  describe('ensureUserDocument', () => {
    it('should return existing user document if it exists', async () => {
      const existingUser: UserDocument = {
        username: 'existinguser',
        displayName: 'Existing User',        email: 'existing@test.com',        rankedUnlocked: true,
        unrankedWins: 5,
        tier: 'Pawn',
        division: 2,
        lp: 50,
        mmr: 1100,
        wins: 10,
        losses: 3,
      };

      const mockDocRef = { id: 'test-uid' };
      const mockSnapshot = {
        exists: () => true,
        data: () => existingUser,
      };

      vi.mocked(firestore.doc).mockReturnValue(mockDocRef as any);
      vi.mocked(firestore.getDoc).mockResolvedValue(mockSnapshot as any);

      const result = await ensureUserDocument('test-uid', 'existinguser', 'Should Not Matter', 'test@example.com');

      expect(firestore.doc).toHaveBeenCalledWith({}, 'users', 'test-uid');
      expect(firestore.getDoc).toHaveBeenCalledWith(mockDocRef);
      expect(firestore.setDoc).not.toHaveBeenCalled();
      expect(result).toEqual(existingUser);
    });

    it('should create new user document if it does not exist', async () => {
      const mockDocRef = { id: 'new-user-uid' };
      const mockSnapshot = {
        exists: () => false,
      };

      vi.mocked(firestore.doc).mockReturnValue(mockDocRef as any);
      vi.mocked(firestore.getDoc).mockResolvedValue(mockSnapshot as any);
      vi.mocked(firestore.setDoc).mockResolvedValue(undefined);

      const displayName = 'New User';
      const result = await ensureUserDocument('new-user-uid', 'newuser', displayName, 'new@test.com');

      expect(firestore.doc).toHaveBeenCalledWith({}, 'users', 'new-user-uid');
      expect(firestore.getDoc).toHaveBeenCalledWith(mockDocRef);
      expect(firestore.setDoc).toHaveBeenCalledWith(mockDocRef, {
        username: 'newuser',
        displayName,
        email: 'new@test.com',
        rankedUnlocked: false,
        unrankedWins: 0,
        tier: 'Pawn',
        division: 3,
        lp: 0,
        mmr: 1000,
        wins: 0,
        losses: 0,
      });
      expect(result).toEqual({
        username: 'newuser',
        displayName,
        email: 'new@test.com',
        rankedUnlocked: false,
        unrankedWins: 0,
        tier: 'Pawn',
        division: 3,
        lp: 0,
        mmr: 1000,
        wins: 0,
        losses: 0,
      });
    });

    it('should use default values for new user document', async () => {
      const mockDocRef = { id: 'test-uid' };
      const mockSnapshot = {
        exists: () => false,
      };

      vi.mocked(firestore.doc).mockReturnValue(mockDocRef as any);
      vi.mocked(firestore.getDoc).mockResolvedValue(mockSnapshot as any);
      vi.mocked(firestore.setDoc).mockResolvedValue(undefined);

      const result = await ensureUserDocument('test-uid', 'testplayer', 'Test Player', 'test@example.com');

      const expectedDefaults = {
        username: 'testplayer',
        displayName: 'Test Player',
        email: 'test@example.com',
        rankedUnlocked: false,
        unrankedWins: 0,
        tier: 'Pawn',
        division: 3,
        lp: 0,
        mmr: 1000,
        wins: 0,
        losses: 0,
      };

      expect(result).toEqual(expectedDefaults);
      expect(firestore.setDoc).toHaveBeenCalledWith(mockDocRef, expectedDefaults);
    });

    it('should propagate errors from Firestore', async () => {
      const mockError = new Error('Firestore error');
      vi.mocked(firestore.doc).mockReturnValue({} as any);
      vi.mocked(firestore.getDoc).mockRejectedValue(mockError);

      await expect(
        ensureUserDocument('error-uid', 'erroruser', 'Error User', 'error@test.com')
      ).rejects.toThrow('Firestore error');
    });
  });
});
