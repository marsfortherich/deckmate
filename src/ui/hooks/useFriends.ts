import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../auth/AuthProvider';
import {
  FriendData,
  FriendRequest,
  sendFriendRequest as sendRequest,
  acceptFriendRequest as acceptRequest,
  rejectFriendRequest as rejectRequest,
  removeFriend as removeFriendFromList,
  subscribeFriendsList,
  subscribeIncomingRequests,
  getOutgoingRequests,
  findUserByUsername,
} from '../../services/friendService';

export interface UseFriendsReturn {
  friends: FriendData[];
  incomingRequests: FriendRequest[];
  outgoingRequests: FriendRequest[];
  sendFriendRequest: (username: string) => Promise<void>;
  acceptFriendRequest: (requestId: string) => Promise<void>;
  rejectFriendRequest: (requestId: string) => Promise<void>;
  removeFriend: (friendUid: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

/**
 * Hook für Friend-System Management
 * 
 * Features:
 * - Real-time Friend List
 * - Real-time incoming requests
 * - Send/Accept/Reject friend requests
 * - Remove friends
 */
export const useFriends = (): UseFriendsReturn => {
  const { user } = useAuth();
  const [friends, setFriends] = useState<FriendData[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to friends list
  useEffect(() => {
    if (!user) {
      setFriends([]);
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeFriendsList(user.uid, (friendsList) => {
      setFriends(friendsList);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  // Subscribe to incoming requests
  useEffect(() => {
    if (!user) {
      setIncomingRequests([]);
      return;
    }

    const unsubscribe = subscribeIncomingRequests(user.uid, (requests) => {
      setIncomingRequests(requests);
    });

    return unsubscribe;
  }, [user]);

  // Load outgoing requests
  useEffect(() => {
    if (!user) {
      setOutgoingRequests([]);
      return;
    }

    const loadOutgoingRequests = async () => {
      try {
        const requests = await getOutgoingRequests(user.uid);
        setOutgoingRequests(requests);
      } catch (err) {
        console.error('Failed to load outgoing requests:', err);
      }
    };

    loadOutgoingRequests();
  }, [user, incomingRequests]); // Re-load when incoming changes (request accepted/rejected)

  const sendFriendRequest = useCallback(
    async (username: string): Promise<void> => {
      if (!user) {
        throw new Error('Du musst eingeloggt sein');
      }

      setError(null);

      try {
        // Finde User anhand Username
        const targetUser = await findUserByUsername(username);
        
        if (!targetUser) {
          throw new Error('Kein User mit diesem Usernamen gefunden');
        }

        await sendRequest(
          user.uid,
          user.displayName || 'Unknown',
          targetUser.uid,
          targetUser.displayName
        );

        // Reload outgoing requests
        const requests = await getOutgoingRequests(user.uid);
        setOutgoingRequests(requests);

        if (import.meta.env.DEV) {
          console.log('👥 Friend request sent to:', username);
        }
      } catch (err: any) {
        const errorMessage = err.message || 'Fehler beim Senden der Anfrage';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [user]
  );

  const acceptFriendRequest = useCallback(
    async (requestId: string): Promise<void> => {
      setError(null);

      try {
        await acceptRequest(requestId);

        if (import.meta.env.DEV) {
          console.log('👥 Friend request accepted:', requestId);
        }
      } catch (err: any) {
        const errorMessage = err.message || 'Fehler beim Akzeptieren';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    []
  );

  const rejectFriendRequest = useCallback(
    async (requestId: string): Promise<void> => {
      setError(null);

      try {
        await rejectRequest(requestId);

        if (import.meta.env.DEV) {
          console.log('👥 Friend request rejected:', requestId);
        }
      } catch (err: any) {
        const errorMessage = err.message || 'Fehler beim Ablehnen';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    []
  );

  const removeFriend = useCallback(
    async (friendUid: string): Promise<void> => {
      if (!user) {
        throw new Error('Du musst eingeloggt sein');
      }

      setError(null);

      try {
        await removeFriendFromList(user.uid, friendUid);

        if (import.meta.env.DEV) {
          console.log('👥 Friend removed:', friendUid);
        }
      } catch (err: any) {
        const errorMessage = err.message || 'Fehler beim Entfernen';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [user]
  );

  return {
    friends,
    incomingRequests,
    outgoingRequests,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    loading,
    error,
  };
};
