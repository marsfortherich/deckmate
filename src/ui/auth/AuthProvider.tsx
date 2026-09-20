import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { User } from 'firebase/auth';
import { ensureUserDocument } from '../../services/userService';
import { onAuthStateChanged, signInWithEmailPassword, registerWithEmailPassword, signOutUser } from '../../services/authService';
import { setUserOffline } from '../../services/presenceService';

export interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingUsername, setPendingUsername] = useState<string | null>(null);
  const [pendingDisplayName, setPendingDisplayName] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (nextUser) => {
      setUser(nextUser);

      if (nextUser) {
        try {
          // Use pending values if available (from registration), otherwise fall back to auth profile
          const username = pendingUsername || nextUser.displayName || nextUser.uid;
          const displayName = pendingDisplayName || nextUser.displayName || nextUser.email || 'User';
          
          await ensureUserDocument(
            nextUser.uid,
            username,
            displayName,
            nextUser.email ?? ''
          );
          
          // Clear pending values after use
          setPendingUsername(null);
          setPendingDisplayName(null);
        } catch (error) {
          console.error('Failed to ensure user document', error);
        }
      }

      setLoading(false);
    });

    return unsubscribe;
  }, [pendingUsername, pendingDisplayName]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      login: async (email, password) => {
        await signInWithEmailPassword(email, password);
      },
      register: async (email, password, username, displayName) => {
        // Set pending values before registration
        setPendingUsername(username);
        setPendingDisplayName(displayName);
        await registerWithEmailPassword(email, password, displayName);
      },
      logout: async () => {
        // Wichtig: setUserOffline VOR signOut, damit auth.uid noch verfügbar ist
        if (user) {
          await setUserOffline(user.uid);
        }
        await signOutUser();
      },
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
