import { useEffect, useCallback, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import {
  setUserOnline,
  setInGameStatus,
  subscribeToUserStatus,
  PresenceStatus,
} from '../../services/presenceService';

interface UsePresenceReturn {
  setInGame: (inGame: boolean) => Promise<void>;
  isOnline: boolean;
}

/**
 * Hook zum Verwalten des User Presence Status
 * 
 * Automatisch:
 * - Setzt User online beim Mount (wenn eingeloggt)
 * - Setzt User offline beim Unmount
 * - Setzt User offline bei Window Close/Tab Close
 * 
 * Manuell:
 * - setInGame(true/false) für Game-Status
 */
export const usePresence = (): UsePresenceReturn => {
  const { user } = useAuth();

  // Setze User online beim Mount
  useEffect(() => {
    if (!user) return;

    const initializePresence = async () => {
      try {
        await setUserOnline(user.uid);
        if (import.meta.env.DEV) {
          console.log('👤 Presence: User online', user.uid);
        }
      } catch (error) {
        console.error('Failed to set user online:', error);
      }
    };

    initializePresence();

    // Kein cleanup hier - wird von AuthProvider.logout() und beforeunload gehandelt
  }, [user]);

  // Setze User offline bei Window Close/Tab Close
  useEffect(() => {
    if (!user) return;

    const handleBeforeUnload = () => {
      // Synchronous call - important for beforeunload
      const databaseUrl = import.meta.env.VITE_FIREBASE_DATABASE_URL;
      navigator.sendBeacon(
        `${databaseUrl}/status/${user.uid}.json`,
        JSON.stringify({
          online: false,
          inGame: false,
          lastSeen: Date.now(),
        })
      );
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user]);

  // Update inGame Status
  const setInGame = useCallback(
    async (inGame: boolean) => {
      if (!user) {
        console.warn('Cannot set inGame status: user not logged in');
        return;
      }

      try {
        await setInGameStatus(user.uid, inGame);
        if (import.meta.env.DEV) {
          console.log('👤 Presence: inGame =', inGame);
        }
      } catch (error) {
        console.error('Failed to update inGame status:', error);
      }
    },
    [user]
  );

  return {
    setInGame,
    isOnline: !!user,
  };
};

/**
 * Hook zum Subscriben auf einen anderen User's Presence Status
 */
export const useUserPresence = (uid: string | null): PresenceStatus | null => {
  const [status, setStatus] = useState<PresenceStatus | null>(null);

  useEffect(() => {
    if (!uid) {
      setStatus(null);
      return;
    }

    const unsubscribe = subscribeToUserStatus(uid, setStatus);

    return () => {
      unsubscribe();
    };
  }, [uid]);

  return status;
};
