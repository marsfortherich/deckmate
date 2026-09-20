/**
 * Deck Selection Screen - Wähle ein Deck für das Match
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { SavedDeck, getUserDecks } from '../../services/deckService';
import { selectDeck, subscribeToMatch } from '../../services/matchService';

export const DeckSelection: React.FC = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [decks, setDecks] = useState<SavedDeck[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);

  useEffect(() => {
    if (!user || !matchId) return;

    const loadDecks = async () => {
      try {
        const userDecks = await getUserDecks(user.uid);
        setDecks(userDecks);
      } catch (err) {
        console.error('Error loading decks:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDecks();
  }, [user, matchId]);

  // Subscribe to match to detect when both players selected decks
  useEffect(() => {
    if (!matchId) return;

    console.log('🔍 Subscribing to match:', matchId);

    const unsubscribe = subscribeToMatch(matchId, (match) => {
      if (!match) {
        console.log('⚠️ Match not found or deleted');
        return;
      }
      
      console.log('📨 Match update received:', {
        matchId,
        status: match.status,
        playerDecks: match.playerDecks ? Object.keys(match.playerDecks).length : 0,
      });
      
      // When match status is 'pending', both players selected decks -> start game
      if (match.status === 'pending') {
        console.log('✅ Both players ready! Navigating to game...');
        navigate(`/match/${matchId}/game`);
      }
    });

    return () => {
      console.log('🔌 Unsubscribing from match');
      unsubscribe();
    };
  }, [matchId, navigate]);

  const handleSelectDeck = async (deck: SavedDeck) => {
    if (!user || !matchId) return;

    console.log('🎯 Selecting deck:', {
      deckId: deck.id,
      deckName: deck.name,
      matchId,
      userUid: user.uid,
    });

    setSelecting(true);
    try {
      await selectDeck(matchId, user.uid, deck.id, deck.name, deck.cards);
      console.log('✅ Deck selected successfully');
      // selectDeck automatically updates status to 'pending' when both ready
      // The useEffect above will navigate when that happens
    } catch (err: any) {
      console.error('❌ Error selecting deck:', err);
      alert(`Fehler: ${err.message}`);
    } finally {
      setSelecting(false);
    }
  };

  const handleBuildNewDeck = () => {
    // Navigate to deck builder with return route
    navigate(`/match/${matchId}/deck-builder`);
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#f1f5f9',
        }}
      >
        Lädt Decks...
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '24px',
        color: '#f1f5f9',
      }}
    >
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ marginBottom: '8px', fontSize: '32px' }}>🃏 Wähle dein Deck</h1>
        <p style={{ marginBottom: '32px', color: '#94a3b8' }}>
          Wähle eines deiner gespeicherten Decks oder erstelle ein neues.
        </p>

        {/* Build New Deck Button */}
        <button
          onClick={handleBuildNewDeck}
          style={{
            width: '100%',
            padding: '20px',
            marginBottom: '24px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: '2px dashed #60a5fa',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '18px',
            fontWeight: '600',
          }}
        >
          ➕ Neues Deck erstellen
        </button>

        {/* Deck List */}
        {decks.length === 0 ? (
          <div
            style={{
              padding: '40px',
              textAlign: 'center',
              backgroundColor: '#1e293b',
              borderRadius: '8px',
              color: '#94a3b8',
            }}
          >
            <p style={{ fontSize: '18px', marginBottom: '8px' }}>
              Du hast noch keine gespeicherten Decks
            </p>
            <p>Erstelle dein erstes Deck um zu spielen!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {decks.map((deck) => (
              <div
                key={deck.id}
                style={{
                  padding: '20px',
                  backgroundColor: '#1e293b',
                  borderRadius: '8px',
                  border: '2px solid #334155',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <h3 style={{ marginBottom: '8px', fontSize: '20px' }}>{deck.name}</h3>
                  <p style={{ color: '#94a3b8', fontSize: '14px' }}>
                    {deck.cards.length} Karten
                  </p>
                </div>
                <button
                  onClick={() => handleSelectDeck(deck)}
                  disabled={selecting}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: selecting ? 'not-allowed' : 'pointer',
                    fontSize: '16px',
                    fontWeight: '600',
                  }}
                >
                  {selecting ? 'Lädt...' : 'Auswählen'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
