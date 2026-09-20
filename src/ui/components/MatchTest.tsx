/**
 * Match Test Component - UI zum Testen des Match-Systems
 */

import React, { useState, useEffect } from 'react';
import { useMatch } from '../hooks/useMatch';
import { useAuth } from '../auth/AuthProvider';

export const MatchTest: React.FC = () => {
  const { user } = useAuth();
  const { match, loading, error, createMatch, acceptMatch, updateGameState, finishMatch, loadMatch } =
    useMatch();
  const [opponentUid, setOpponentUid] = useState('');
  const [matchIdInput, setMatchIdInput] = useState('');
  const [gameStateInput, setGameStateInput] = useState('{"turn": 1}');

  // Sync gameStateInput with current match's gameState
  useEffect(() => {
    if (match?.gameState) {
      setGameStateInput(JSON.stringify(match.gameState, null, 2));
    }
  }, [match?.gameState]);

  const handleCreateMatch = async () => {
    if (!opponentUid.trim()) {
      alert('Bitte gib eine Opponent UID ein');
      return;
    }

    try {
      const initialGameState = JSON.parse(gameStateInput);
      const matchId = await createMatch(opponentUid, initialGameState);
      alert(`Match erstellt! ID: ${matchId}`);
    } catch (err: any) {
      alert(`Fehler: ${err.message}`);
    }
  };

  const handleLoadMatch = async () => {
    if (!matchIdInput.trim()) {
      alert('Bitte gib eine Match ID ein');
      return;
    }

    try {
      await loadMatch(matchIdInput);
    } catch (err: any) {
      alert(`Fehler: ${err.message}`);
    }
  };

  const handleAcceptMatch = async () => {
    try {
      await acceptMatch();
      alert('Match akzeptiert!');
    } catch (err: any) {
      alert(`Fehler: ${err.message}`);
    }
  };

  const handleUpdateGameState = async () => {
    try {
      const newGameState = JSON.parse(gameStateInput);
      await updateGameState(newGameState);
      alert('Game State aktualisiert!');
    } catch (err: any) {
      alert(`Fehler: ${err.message}`);
    }
  };

  const handleFinishMatch = async () => {
    try {
      await finishMatch();
      alert('Match beendet!');
    } catch (err: any) {
      alert(`Fehler: ${err.message}`);
    }
  };

  return (
    <div
      style={{
        padding: '24px',
        maxWidth: '800px',
        margin: '0 auto',
        color: '#f1f5f9',
      }}
    >
      <h1 style={{ marginBottom: '24px' }}>🎮 Match System Test</h1>

      {user && (
        <div
          style={{
            padding: '16px',
            backgroundColor: '#1e293b',
            borderRadius: '8px',
            marginBottom: '24px',
          }}
        >
          <p style={{ margin: '4px 0' }}>
            <strong>Deine UID:</strong> {user.uid}
          </p>
          <p style={{ margin: '4px 0', fontSize: '12px', color: '#94a3b8' }}>
            (Kopiere diese UID für den anderen Spieler)
          </p>
        </div>
      )}

      {error && (
        <div
          style={{
            padding: '12px',
            backgroundColor: '#7f1d1d',
            border: '1px solid #991b1b',
            borderRadius: '8px',
            marginBottom: '16px',
            color: '#fca5a5',
          }}
        >
          ⚠ {error}
        </div>
      )}

      {/* Create Match Section */}
      <div
        style={{
          backgroundColor: '#1e293b',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '24px',
        }}
      >
        <h2 style={{ marginBottom: '16px', fontSize: '18px' }}>1. Match erstellen</h2>
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
            Opponent UID:
          </label>
          <input
            type="text"
            value={opponentUid}
            onChange={(e) => setOpponentUid(e.target.value)}
            placeholder="UID des Gegners"
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '6px',
              color: '#f1f5f9',
              fontSize: '14px',
            }}
          />
        </div>
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
            Initial Game State (JSON):
          </label>
          <textarea
            value={gameStateInput}
            onChange={(e) => setGameStateInput(e.target.value)}
            rows={3}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '6px',
              color: '#f1f5f9',
              fontSize: '14px',
              fontFamily: 'monospace',
            }}
          />
        </div>
        <button
          onClick={handleCreateMatch}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '600',
          }}
        >
          {loading ? 'Lädt...' : 'Match erstellen'}
        </button>
      </div>

      {/* Load Match Section */}
      <div
        style={{
          backgroundColor: '#1e293b',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '24px',
        }}
      >
        <h2 style={{ marginBottom: '16px', fontSize: '18px' }}>2. Match laden</h2>
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
            Match ID:
          </label>
          <input
            type="text"
            value={matchIdInput}
            onChange={(e) => setMatchIdInput(e.target.value)}
            placeholder="Match ID eingeben"
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '6px',
              color: '#f1f5f9',
              fontSize: '14px',
            }}
          />
        </div>
        <button
          onClick={handleLoadMatch}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '600',
          }}
        >
          {loading ? 'Lädt...' : 'Match laden'}
        </button>
      </div>

      {/* Current Match Display */}
      {match && (
        <div
          style={{
            backgroundColor: '#1e293b',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '24px',
          }}
        >
          <h2 style={{ marginBottom: '16px', fontSize: '18px' }}>📊 Aktuelles Match</h2>
          <div style={{ marginBottom: '16px' }}>
            <p style={{ margin: '4px 0' }}>
              <strong>Match ID:</strong> {match.id}
            </p>
            <p style={{ margin: '4px 0' }}>
              <strong>Status:</strong>{' '}
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: '4px',
                  backgroundColor:
                    match.status === 'active'
                      ? '#065f46'
                      : match.status === 'pending'
                      ? '#78350f'
                      : '#374151',
                  fontSize: '12px',
                }}
              >
                {match.status}
              </span>
            </p>
            <p style={{ margin: '4px 0' }}>
              <strong>Players:</strong> {match.players[0]} vs {match.players[1]}
            </p>
            <p style={{ margin: '4px 0' }}>
              <strong>Mode:</strong> {match.mode}
            </p>
          </div>

          <div
            style={{
              backgroundColor: '#0f172a',
              padding: '12px',
              borderRadius: '6px',
              marginBottom: '16px',
            }}
          >
            <p style={{ marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
              Aktueller Game State (Read-Only):
            </p>
            <pre
              style={{
                margin: 0,
                fontSize: '12px',
                color: '#94a3b8',
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace',
              }}
            >
              {JSON.stringify(match.gameState, null, 2)}
            </pre>
          </div>

          {match.status === 'active' && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
                Neuer Game State (Editierbar):
              </label>
              <textarea
                value={gameStateInput}
                onChange={(e) => setGameStateInput(e.target.value)}
                rows={8}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#0f172a',
                  border: '2px solid #3b82f6',
                  borderRadius: '6px',
                  color: '#f1f5f9',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                }}
                placeholder='{"turn": 1, "phase": "start"}'
              />
              <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                💡 Editiere das JSON und klicke "🔄 Game State updaten"
              </p>
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {match.status === 'pending' && (
              <button
                onClick={handleAcceptMatch}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                }}
              >
                ✅ Match akzeptieren
              </button>
            )}

            {match.status === 'active' && (
              <>
                <button
                  onClick={handleUpdateGameState}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                  }}
                >
                  🔄 Game State updaten
                </button>
                <button
                  onClick={handleFinishMatch}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                  }}
                >
                  🏁 Match beenden
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div
        style={{
          backgroundColor: '#1e293b',
          padding: '20px',
          borderRadius: '8px',
          fontSize: '14px',
          lineHeight: '1.6',
        }}
      >
        <h3 style={{ marginBottom: '12px', fontSize: '16px' }}>💡 Anleitung</h3>
        <ol style={{ marginLeft: '20px' }}>
          <li>Öffne die App in zwei verschiedenen Browsern/Tabs mit 2 verschiedenen Accounts</li>
          <li>Kopiere die UID vom ersten Spieler</li>
          <li>Im zweiten Browser: Match erstellen mit der UID vom ersten Spieler</li>
          <li>Kopiere die Match ID aus dem Alert</li>
          <li>Im ersten Browser: Match laden mit der Match ID</li>
          <li>Match akzeptieren → Status wird "active"</li>
          <li>Game State updaten (JSON editieren und Button klicken)</li>
          <li>Real-time Updates in beiden Browsern beobachten! 🚀</li>
        </ol>
      </div>
    </div>
  );
};
