import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthProvider';
import * as authService from '../../../services/authService';
import * as userService from '../../../services/userService';

// Mock Firebase first - before any imports
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  onAuthStateChanged: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('firebase/database', () => ({
  getDatabase: vi.fn(() => ({})),
  ref: vi.fn(),
  set: vi.fn(),
  onDisconnect: vi.fn(() => ({
    set: vi.fn(),
  })),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(() => Promise.resolve({ empty: true })),
}));

// Mock the services
vi.mock('../../../services/authService');
vi.mock('../../../services/userService');

// Test component that uses the auth hook
const TestComponent = () => {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (user) return <div>User: {user.uid}</div>;
  return <div>No user</div>;
};

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should provide loading state initially', () => {
    // Mock auth state listener that doesn't call callback immediately
    vi.mocked(authService.onAuthStateChanged).mockReturnValue(vi.fn());

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.queryByText('Loading...')).toBeTruthy();
  });

  it('should provide user when authenticated', async () => {
    const mockUser = { uid: 'test-uid', email: 'test@example.com', displayName: 'test@example.com' };
    
    // Mock auth state listener to immediately call with user
    vi.mocked(authService.onAuthStateChanged).mockImplementation((callback: any) => {
      callback(mockUser as any);
      return vi.fn();
    });

    // Mock user document creation
    vi.mocked(userService.ensureUserDocument).mockResolvedValue({
      username: 'testuser',
      displayName: 'Test User',
      email: 'test@example.com',
      rankedUnlocked: false,
      unrankedWins: 0,
      tier: 'Pawn',
      division: 3,
      lp: 0,
      mmr: 1000,
      wins: 0,
      losses: 0,
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText('User: test-uid')).toBeTruthy();
    });

    expect(userService.ensureUserDocument).toHaveBeenCalledWith(
      'test-uid',
      'test@example.com', // username (fallback to email since no displayName)
      'test@example.com', // displayName
      'test@example.com'  // email
    );
  });

  it('should provide null when not authenticated', async () => {
    // Mock auth state listener to call with null
    vi.mocked(authService.onAuthStateChanged).mockImplementation((callback: any) => {
      callback(null);
      return vi.fn();
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText('No user')).toBeTruthy();
    });

    expect(userService.ensureUserDocument).not.toHaveBeenCalled();
  });

  it('should handle user document creation errors gracefully', async () => {
    const mockUser = { uid: 'test-uid', email: 'test@example.com' };
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    vi.mocked(authService.onAuthStateChanged).mockImplementation((callback: any) => {
      callback(mockUser as any);
      return vi.fn();
    });

    vi.mocked(userService.ensureUserDocument).mockRejectedValue(
      new Error('Firestore error')
    );

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText('User: test-uid')).toBeTruthy();
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to ensure user document',
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });

  it('should throw error when useAuth is used outside AuthProvider', () => {
    // Suppress expected console.error from React error boundary
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useAuth must be used within AuthProvider');

    consoleErrorSpy.mockRestore();
  });

  it('should unsubscribe from auth state listener on unmount', () => {
    const mockUnsubscribe = vi.fn();
    vi.mocked(authService.onAuthStateChanged).mockReturnValue(mockUnsubscribe);

    const { unmount } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });
});
