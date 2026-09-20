import {
  ref,
  set,
  onDisconnect,
  serverTimestamp,
  onValue,
  remove,
} from 'firebase/database';
import { rtdb } from './firebase';

export interface PresenceStatus {
  online: boolean;
  inGame: boolean;
  lastSeen: number;
}

/**
 * Setzt den User als online und richtet Auto-Disconnect ein
 */
export const setUserOnline = async (uid: string): Promise<void> => {
  const userStatusRef = ref(rtdb, `status/${uid}`);

  const status: PresenceStatus = {
    online: true,
    inGame: false,
    lastSeen: Date.now(),
  };

  // Setze Status auf online
  await set(userStatusRef, status);

  // Konfiguriere automatisches Offline-Setzen bei Disconnect
  await onDisconnect(userStatusRef).set({
    online: false,
    inGame: false,
    lastSeen: serverTimestamp(),
  });
};

/**
 * Setzt den User als offline
 */
export const setUserOffline = async (uid: string): Promise<void> => {
  const userStatusRef = ref(rtdb, `status/${uid}`);

  await set(userStatusRef, {
    online: false,
    inGame: false,
    lastSeen: serverTimestamp(),
  });
};

/**
 * Entfernt den Presence-Status komplett
 */
export const removeUserPresence = async (uid: string): Promise<void> => {
  const userStatusRef = ref(rtdb, `status/${uid}`);
  await remove(userStatusRef);
};

/**
 * Aktualisiert den inGame-Status
 */
export const setInGameStatus = async (uid: string, inGame: boolean): Promise<void> => {
  const userStatusRef = ref(rtdb, `status/${uid}`);

  await set(userStatusRef, {
    online: true,
    inGame,
    lastSeen: Date.now(),
  });

  // Update auch den onDisconnect Handler
  await onDisconnect(userStatusRef).set({
    online: false,
    inGame: false,
    lastSeen: serverTimestamp(),
  });
};

/**
 * Listener für User-Status Änderungen
 */
export const subscribeToUserStatus = (
  uid: string,
  callback: (status: PresenceStatus | null) => void
): (() => void) => {
  const userStatusRef = ref(rtdb, `status/${uid}`);

  const unsubscribe = onValue(userStatusRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val() as PresenceStatus);
    } else {
      callback(null);
    }
  });

  return unsubscribe;
};
