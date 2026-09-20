/**
 * Game Router - Routes for authenticated users
 * 
 * Handles routing between menu, deck builder, and game screens
 */

import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate, Navigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { MainMenu } from '../components/MainMenu';
import { DeckBuilder } from '../components/DeckBuilder';
import { DeckManager } from '../components/DeckManager';
import { GameView } from '../components/GameView';
import { EnhancedGameView } from '../components/EnhancedGameView';
import { MultiplayerGameView } from '../components/MultiplayerGameView';
import { OnlineMultiplayerGameView } from '../components/OnlineMultiplayerGameView';
import { FriendsList } from '../components/FriendsList';
import { MatchTest } from '../components/MatchTest';
import { ChallengePopup } from '../components/ChallengePopup';
import { DeckSelection } from '../components/DeckSelection';
import { Color } from '../../core/index';
import { Card } from '../../cards/types/card';
import { CARD_LIBRARY } from '../../cards/cardLibrary';
import { subscribeIncomingChallenges, subscribeAcceptedChallenges, acceptChallenge, declineChallenge } from '../../services/matchService';

// Wrapper component for editing a deck
const DeckBuilderEdit: React.FC = () => {
  const navigate = useNavigate();
  const { deckId } = useParams<{ deckId: string }>();

  return (
    <DeckBuilder
      deckId={deckId}
      onDeckComplete={() => navigate('/deck-builder')}
      onCancel={() => navigate('/deck-builder')}
      saveMode={true}
    />
  );
};

export const GameRouter: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [playerColor, setPlayerColor] = useState<Color>('white');
  const [customDeck, setCustomDeck] = useState<Card[] | null>(null);
  const [whiteDeck, setWhiteDeck] = useState<Card[] | null>(null);
  const [blackDeck, setBlackDeck] = useState<Card[] | null>(null);
  
  // Track navigated matches to prevent re-navigation
  const navigatedMatchesRef = useRef<Set<string>>(new Set());
  
  // Challenge State
  const [incomingChallenge, setIncomingChallenge] = useState<{
    matchId: string;
    challengerName: string;
  } | null>(null);

  // Subscribe to incoming challenges
  useEffect(() => {
    if (!user) {
      console.log('👤 No user, skipping challenge subscription');
      return;
    }

    console.log('🎯 Setting up challenge subscription for:', user.uid);
    
    const unsubscribe = subscribeIncomingChallenges(user.uid, (challenges) => {
      console.log('🔔 Challenge callback received:', challenges.length, 'challenges');
      
      // Show the most recent challenge
      if (challenges.length > 0) {
        const challenge = challenges[0];
        console.log('✅ Setting incoming challenge:', {
          matchId: challenge.id,
          challengerName: challenge.challengeData?.challengerName,
          status: challenge.status,
        });
        setIncomingChallenge({
          matchId: challenge.id,
          challengerName: challenge.challengeData?.challengerName || 'Unbekannt',
        });
      } else {
        console.log('📭 No challenges, clearing state');
        setIncomingChallenge(null);
      }
    });

    return () => {
      console.log('🔌 Unsubscribing from challenges');
      unsubscribe();
    };
  }, [user]);

  // Subscribe to accepted challenges (when opponent accepts OUR challenge)
  useEffect(() => {
    if (!user) {
      console.log('👤 No user, skipping accepted challenge subscription');
      return;
    }

    console.log('🎯 Setting up accepted challenge subscription for:', user.uid);
    
    const unsubscribe = subscribeAcceptedChallenges(user.uid, (matches) => {
      console.log('🎊 Accepted challenge callback received:', matches.length, 'matches');
      
      // If we have an accepted challenge, navigate to deck selection
      if (matches.length > 0) {
        const match = matches[0];
        
        // Only navigate if we haven't already navigated to this match
        // AND we're not already on a match-related page
        const alreadyNavigated = navigatedMatchesRef.current.has(match.id);
        const isOnMatchPage = location.pathname.startsWith('/match/');
        
        if (!alreadyNavigated && !isOnMatchPage) {
          console.log('✅ Challenge accepted! Navigating to deck selection:', {
            matchId: match.id,
            status: match.status,
          });
          navigatedMatchesRef.current.add(match.id);
          navigate(`/match/${match.id}/deck-select`);
        } else {
          console.log('⏭️ Skipping navigation:', {
            alreadyNavigated,
            isOnMatchPage,
            currentPath: location.pathname,
          });
        }
      }
    });

    return () => {
      console.log('🔌 Unsubscribing from accepted challenges');
      unsubscribe();
    };
  }, [user, navigate, location.pathname]);

  const handleAcceptChallenge = async () => {
    if (!incomingChallenge) return;

    try {
      await acceptChallenge(incomingChallenge.matchId);
      setIncomingChallenge(null);
      // Navigate to deck selection
      navigate(`/match/${incomingChallenge.matchId}/deck-select`);
    } catch (err) {
      console.error('Failed to accept challenge:', err);
    }
  };

  const handleDeclineChallenge = async () => {
    if (!incomingChallenge) return;

    try {
      await declineChallenge(incomingChallenge.matchId);
      setIncomingChallenge(null);
    } catch (err) {
      console.error('Failed to decline challenge:', err);
    }
  };

  const handleStartGame = () => {
    navigate('/player-select');
  };

  const handleBuildDeck = () => {
    navigate('/deck-builder');
  };

  const handleTestDeck = () => {
    const testDeck: Card[] = [];
    CARD_LIBRARY.forEach((cardDef, index) => {
      testDeck.push({
        ...cardDef.card,
        id: `${cardDef.card.id}-test-${index}`,
      });
    });
    setCustomDeck(testDeck);
    navigate('/player-select');
  };
  
  const handleMultiplayer = () => {
    navigate('/multiplayer/deck-white');
  };
  
  const handleMultiplayerTestDecks = () => {
    const whiteTestDeck: Card[] = [];
    const blackTestDeck: Card[] = [];
    
    CARD_LIBRARY.forEach((cardDef, index) => {
      whiteTestDeck.push({
        ...cardDef.card,
        id: `${cardDef.card.id}-white-${index}`,
      });
      blackTestDeck.push({
        ...cardDef.card,
        id: `${cardDef.card.id}-black-${index}`,
      });
    });
    
    setWhiteDeck(whiteTestDeck);
    setBlackDeck(blackTestDeck);
    navigate('/multiplayer/game');
  };

  const handlePlayerSelect = (color: Color) => {
    setPlayerColor(color);
    navigate('/game');
  };

  const handleBackToMenu = () => {
    setCustomDeck(null);
    setWhiteDeck(null);
    setBlackDeck(null);
    navigate('/');
  };
  
  const handleWhiteDeckComplete = (deck: Card[]) => {
    setWhiteDeck(deck);
    navigate('/multiplayer/deck-black');
  };
  
  const handleBlackDeckComplete = (deck: Card[]) => {
    setBlackDeck(deck);
    navigate('/multiplayer/game');
  };

  return (
    <>
      <Routes>
        <Route 
          path="/" 
          element={
            <MainMenu
              onStartGame={handleStartGame}
              onBuildDeck={handleBuildDeck}
              onTestDeck={handleTestDeck}
              onMultiplayer={handleMultiplayer}
              onMultiplayerTest={handleMultiplayerTestDecks}
            />
          } 
        />

        <Route 
          path="/friends" 
          element={<FriendsList />}
        />

        <Route 
          path="/match-test" 
          element={<MatchTest />}
        />

        <Route 
          path="/match/:matchId/deck-select" 
          element={<DeckSelection />}
        />

        <Route 
          path="/match/:matchId/deck-builder" 
          element={
            <DeckBuilder
              onDeckComplete={() => navigate(-1)} // Navigate back to deck selection
              onCancel={() => navigate(-1)}
              saveMode={true}
            />
          }
        />

        <Route 
          path="/match/:matchId/game" 
          element={<OnlineMultiplayerGameView />}
        />

        {/* Deck Management Routes */}
        <Route 
          path="/deck-builder" 
          element={<DeckManager />}
        />

        <Route 
          path="/deck-builder/new" 
          element={
            <DeckBuilder
              onDeckComplete={() => navigate('/deck-builder')}
              onCancel={() => navigate('/deck-builder')}
              saveMode={true}
            />
          }
        />

        <Route 
          path="/deck-builder/:deckId" 
          element={<DeckBuilderEdit />}
        />

      <Route 
        path="/player-select" 
        element={
          <div style={{
            minHeight: 'calc(100vh - 65px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}>
            <h1 style={{
              fontSize: '32px',
              marginBottom: '32px',
              color: '#f1f5f9',
            }}>
              Wähle deine Farbe
            </h1>

            {customDeck && (
              <div style={{
                marginBottom: '24px',
                padding: '12px 24px',
                backgroundColor: '#16213e',
                borderRadius: '8px',
                color: '#10b981',
              }}>
                ✓ Custom Deck geladen ({customDeck.length} Karten)
              </div>
            )}

            <div style={{
              display: 'flex',
              gap: '24px',
            }}>
              <button
                onClick={() => handlePlayerSelect('white')}
                style={{
                  padding: '40px 60px',
                  backgroundColor: '#f1f5f9',
                  color: '#0f172a',
                  border: '4px solid #94a3b8',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '24px',
                  fontWeight: 'bold',
                  transition: 'all 0.2s',
                }}
              >
                ⚪ Weiß
              </button>

              <button
                onClick={() => handlePlayerSelect('black')}
                style={{
                  padding: '40px 60px',
                  backgroundColor: '#1e293b',
                  color: '#f1f5f9',
                  border: '4px solid #475569',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '24px',
                  fontWeight: 'bold',
                  transition: 'all 0.2s',
                }}
              >
                ⚫ Schwarz
              </button>
            </div>

            <button
              onClick={handleBackToMenu}
              style={{
                marginTop: '32px',
                padding: '12px 24px',
                backgroundColor: '#374151',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              ← Zurück zum Menü
            </button>
          </div>
        } 
      />

      <Route 
        path="/game" 
        element={
          customDeck ? (
            <EnhancedGameView 
              player={playerColor}
              whiteDeck={playerColor === 'white' ? customDeck : undefined}
              blackDeck={playerColor === 'black' ? customDeck : undefined}
            />
          ) : (
            <GameView player={playerColor} />
          )
        } 
      />

      <Route 
        path="/multiplayer/deck-white" 
        element={
          <div>
            <div style={{
              padding: '24px',
              backgroundColor: '#1e293b',
              borderBottom: '1px solid #334155',
            }}>
              <h2 style={{
                fontSize: '24px',
                color: '#3b82f6',
                margin: 0,
                textAlign: 'center',
              }}>
                ⚪ Weißer Spieler - Erstelle dein Deck
              </h2>
            </div>
            <DeckBuilder
              onDeckComplete={handleWhiteDeckComplete}
              onCancel={handleBackToMenu}
            />
          </div>
        } 
      />

      <Route 
        path="/multiplayer/deck-black" 
        element={
          <div>
            <div style={{
              padding: '24px',
              backgroundColor: '#1e293b',
              borderBottom: '1px solid #334155',
            }}>
              <h2 style={{
                fontSize: '24px',
                color: '#8b5cf6',
                margin: 0,
                textAlign: 'center',
              }}>
                ⚫ Schwarzer Spieler - Erstelle dein Deck
              </h2>
            </div>
            <DeckBuilder
              onDeckComplete={handleBlackDeckComplete}
              onCancel={handleBackToMenu}
            />
          </div>
        } 
      />

      <Route 
        path="/multiplayer/game" 
        element={
          <MultiplayerGameView
            whiteDeck={whiteDeck || undefined}
            blackDeck={blackDeck || undefined}
            onBackToMenu={handleBackToMenu}
          />
        } 
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>

    {/* Challenge Popup Overlay */}
    {incomingChallenge && (
      <ChallengePopup
        challengerName={incomingChallenge.challengerName}
        onAccept={handleAcceptChallenge}
        onDecline={handleDeclineChallenge}
      />
    )}
  </>
  );
};
