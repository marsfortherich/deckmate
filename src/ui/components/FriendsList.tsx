/**
 * Friends List Component with Presence Integration
 * 
 * Features:
 * - Real-time friends list
 * - Online/Offline/In-Game status
 * - Send friend requests
 * - Accept/Reject incoming requests
 * - Remove friends
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFriends } from '../hooks/useFriends';
import { useUserPresence } from '../hooks/usePresence';
import { useAuth } from '../auth/AuthProvider';
import { createChallenge } from '../../services/matchService';
import { getUserDocument } from '../../services/userService';
import { getErrorMessage } from '../../utils/errors';

interface FriendItemProps {
  uid: string;
  displayName: string;
  onRemove: (uid: string) => void;
  onChallenge: (uid: string, displayName: string) => void;
  canChallenge: boolean;
}

const FriendItem: React.FC<FriendItemProps> = ({ uid, displayName, onRemove, onChallenge, canChallenge }) => {
  const presence = useUserPresence(uid);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const getStatusColor = () => {
    if (!presence || !presence.online) return '#64748b'; // offline - gray
    if (presence.inGame) return '#f59e0b'; // in-game - orange
    return '#10b981'; // online - green
  };

  const getStatusText = () => {
    if (!presence || !presence.online) return 'Offline';
    if (presence.inGame) return 'Im Spiel';
    return 'Online';
  };

  const isOnlineAndAvailable = presence?.online && !presence?.inGame;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px',
        backgroundColor: '#1e293b',
        borderRadius: '8px',
        marginBottom: '8px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Status Indicator */}
        <div
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: getStatusColor(),
          }}
        />
        
        <div>
          <div style={{ fontWeight: '600', color: '#f1f5f9' }}>{displayName}</div>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>{getStatusText()}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        {/* Challenge Button - nur wenn Freund online und verfügbar */}
        {isOnlineAndAvailable && canChallenge && (
          <button
            onClick={() => onChallenge(uid, displayName)}
            style={{
              padding: '6px 12px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Herausfordern
          </button>
        )}

        {!confirmRemove ? (
          <button
            onClick={() => setConfirmRemove(true)}
            style={{
              padding: '6px 12px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Entfernen
          </button>
        ) : (
          <>
            <button
              onClick={() => onRemove(uid)}
              style={{
                padding: '6px 12px',
                backgroundColor: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Bestätigen
            </button>
            <button
              onClick={() => setConfirmRemove(false)}
              style={{
                padding: '6px 12px',
                backgroundColor: '#475569',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Abbrechen
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export const FriendsList: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    friends,
    incomingRequests,
    outgoingRequests,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    loading,
    error,
  } = useFriends();

  const [username, setUsername] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [challengeSuccess, setChallengeSuccess] = useState<string | null>(null);
  const [challengeError, setChallengeError] = useState<string | null>(null);

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendError(null);
    setSendSuccess(false);

    try {
      await sendFriendRequest(username);
      setUsername('');
      setSendSuccess(true);
      setTimeout(() => setSendSuccess(false), 3000);
    } catch (err) {
      setSendError(getErrorMessage(err));
    }
  };

  const handleChallenge = async (friendUid: string, friendDisplayName: string) => {
    if (!user) return;

    setChallengeSuccess(null);
    setChallengeError(null);

    try {
      // Hole aktuelle Nutzerdaten
      const currentUserData = await getUserDocument(user.uid);
      if (!currentUserData) {
        throw new Error('Benutzerdaten nicht gefunden');
      }

      // Erstelle Challenge
      await createChallenge(
        user.uid,
        currentUserData.displayName,
        friendUid,
        friendDisplayName
      );

      setChallengeSuccess(`Herausforderung an ${friendDisplayName} gesendet!`);
      setTimeout(() => setChallengeSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to create challenge:', err);
      setChallengeError(getErrorMessage(err, 'Fehler beim Senden der Herausforderung'));
      setTimeout(() => setChallengeError(null), 3000);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await acceptFriendRequest(requestId);
    } catch (err) {
      console.error('Failed to accept request:', err);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await rejectFriendRequest(requestId);
    } catch (err) {
      console.error('Failed to reject request:', err);
    }
  };

  const handleRemoveFriend = async (friendUid: string) => {
    try {
      await removeFriend(friendUid);
    } catch (err) {
      console.error('Failed to remove friend:', err);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', color: '#f1f5f9' }}>
        Lädt Freundesliste...
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: '600px',
        margin: '0 auto',
        padding: '20px',
        color: '#f1f5f9',
      }}
    >
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px' 
      }}>
        <h2>Freunde</h2>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '8px 16px',
            backgroundColor: '#374151',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          ← Zurück
        </button>
      </div>

      {/* Send Friend Request */}
      <div
        style={{
          backgroundColor: '#1e293b',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '24px',
        }}
      >
        <h3 style={{ marginBottom: '12px', fontSize: '16px' }}>
          Freund hinzufügen
        </h3>
        <form onSubmit={handleSendRequest}>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            required
            style={{
              width: '100%',
              padding: '10px',
              marginBottom: '12px',
              backgroundColor: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '6px',
              color: '#f1f5f9',
              fontSize: '14px',
            }}
          />
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
            }}
          >
            Anfrage senden
          </button>
        </form>
        {sendError && (
          <div
            style={{
              marginTop: '12px',
              padding: '8px',
              backgroundColor: '#7f1d1d',
              borderRadius: '6px',
              fontSize: '14px',
            }}
          >
            {sendError}
          </div>
        )}
        {sendSuccess && (
          <div
            style={{
              marginTop: '12px',
              padding: '8px',
              backgroundColor: '#14532d',
              borderRadius: '6px',
              fontSize: '14px',
            }}
          >
            Anfrage erfolgreich gesendet!
          </div>
        )}
      </div>

      {/* Incoming Requests */}
      {incomingRequests.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '12px', fontSize: '16px' }}>
            Eingehende Anfragen ({incomingRequests.length})
          </h3>
          {incomingRequests.map((request) => (
            <div
              key={request.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px',
                backgroundColor: '#1e293b',
                borderRadius: '8px',
                marginBottom: '8px',
              }}
            >
              <div style={{ fontWeight: '600' }}>{request.fromDisplayName}</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleAcceptRequest(request.id)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  Akzeptieren
                </button>
                <button
                  onClick={() => handleRejectRequest(request.id)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  Ablehnen
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Outgoing Requests */}
      {outgoingRequests.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '12px', fontSize: '16px' }}>
            Ausgehende Anfragen ({outgoingRequests.length})
          </h3>
          {outgoingRequests.map((request) => (
            <div
              key={request.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px',
                backgroundColor: '#1e293b',
                borderRadius: '8px',
                marginBottom: '8px',
              }}
            >
              <div>
                <div style={{ fontWeight: '600' }}>{request.toDisplayName}</div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                  Ausstehend...
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Friends List */}
      <div>
        <h3 style={{ marginBottom: '12px', fontSize: '16px' }}>
          Meine Freunde ({friends.length})
        </h3>
        
        {/* Challenge Success Message */}
        {challengeSuccess && (
          <div
            style={{
              marginBottom: '12px',
              padding: '12px',
              backgroundColor: '#14532d',
              borderRadius: '8px',
              fontSize: '14px',
              color: '#f1f5f9',
            }}
          >
            {challengeSuccess}
          </div>
        )}

        {/* Challenge Error Message */}
        {challengeError && (
          <div
            style={{
              marginBottom: '12px',
              padding: '12px',
              backgroundColor: '#7f1d1d',
              borderRadius: '8px',
              fontSize: '14px',
              color: '#f1f5f9',
            }}
          >
            {challengeError}
          </div>
        )}

        {friends.length === 0 ? (
          <div
            style={{
              padding: '20px',
              textAlign: 'center',
              color: '#94a3b8',
              backgroundColor: '#1e293b',
              borderRadius: '8px',
            }}
          >
            Du hast noch keine Freunde. Füge Freunde über ihren Usernamen hinzu!
          </div>
        ) : (
          friends.map((friend) => (
            <FriendItem
              key={friend.uid}
              uid={friend.uid}
              displayName={friend.displayName}
              onRemove={handleRemoveFriend}
              onChallenge={handleChallenge}
              canChallenge={!!user}
            />
          ))
        )}
      </div>

      {error && (
        <div
          style={{
            marginTop: '16px',
            padding: '12px',
            backgroundColor: '#7f1d1d',
            borderRadius: '8px',
            fontSize: '14px',
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
};
