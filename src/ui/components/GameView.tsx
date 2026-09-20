/**
 * GameView Component
 * 
 * Hauptkomponente für das Spiel.
 * Kombiniert Board + Hand und orchestriert Interaktionen.
 * 
 * Datenfluss:
 * 1. useGameState liefert State
 * 2. Component zeigt State an
 * 3. User-Events rufen Hook-Actions auf
 * 4. Hook updated State
 * 5. Component re-rendert
 * 
 * WICHTIG: Component hat KEINE Spiellogik!
 */

import React, { useState } from 'react';
import { useGameState } from '../hooks/useGameState';
import { BoardComponent, BoardInfo } from './Board';
import { DualHand } from './Card';
import { Color, Position } from '../../core/index';
import { NO_PARAMS } from '../../cards/types/effect';
import { Card } from '../../cards/types/card';

interface GameViewProps {
  player: Color;
}

/**
 * Extrahiert Zielpositionen aus einer Move-Karte
 */
function getTargetPositionFromMoveCard(card: Card): Position | null {
  // Versuche Position aus der Kartenbeschreibung zu extrahieren
  // Format: "Pawn e2 → e4" oder ähnlich
  const match = card.description.match(/to ([a-h][1-8])/);
  if (match) {
    const algebraic = match[1];
    const col = algebraic.charCodeAt(0) - 'a'.charCodeAt(0);
    const row = parseInt(algebraic[1], 10) - 1;
    return { row, col };
  }
  return null;
}

/**
 * Hauptansicht für einen Spieler
 * 
 * Pattern: Container Component
 * - Hält lokalen UI-State (z.B. selectedCard)
 * - Delegiert Game-Logic an Hook
 * - Rendert Presentational Components
 */
export const GameView: React.FC<GameViewProps> = ({ player }) => {
  // Game State vom Hook
  const { playerView, playCard, refresh } = useGameState(player);
  
  // Lokaler UI-State (NICHT Game-State!)
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [lastMessage, setLastMessage] = useState<string>('Ready to play');
  
  /**
   * Event: Karte auswählen
   * 
   * Regel: NUR UI-State ändern, KEINE Game-Logik!
   */
  const handleCardSelect = (cardId: string, index: number, card: Card) => {
    setSelectedCardId(cardId);
    setSelectedCardIndex(index);
    setSelectedCard(card);
    setLastMessage(`Selected: ${card.name}`);
  };
  
  // Berechne hervorgehobene Felder (bei Move-Karte)
  const highlightedSquares: Position[] = [];
  if (selectedCard && selectedCard.id.startsWith('move-')) {
    const targetPos = getTargetPositionFromMoveCard(selectedCard);
    if (targetPos) {
      highlightedSquares.push(targetPos);
    }
  }
  
  /**
   * Event: Feld auf Board klicken
   * 
   * Regel: Wenn Karte ausgewählt → Delegiere an Hook
   */
  const handleSquareClick = (_position: Position) => {
    if (selectedCardId && selectedCardIndex !== null) {
      // Move cards have the move embedded - no params needed
      const isMoveCard = selectedCard?.id.startsWith('move-') ?? true;
      const params = isMoveCard ? NO_PARAMS : { type: 'destroy' as const, targetPosition: _position };
      
      playCard(selectedCardId, params);
      
      setLastMessage(`Played: ${selectedCard?.name || 'card'}`);
      
      // UI-State zurücksetzen
      setSelectedCardId(null);
      setSelectedCardIndex(null);
      setSelectedCard(null);
    }
  };
  
  /**
   * Event: Karte direkt spielen (ohne Board-Klick)
   * z.B. für Karten die keine Position brauchen
   */
  const handlePlayCardDirect = () => {
    if (selectedCardId && selectedCard) {
      playCard(selectedCardId, NO_PARAMS);
      setLastMessage(`Played: ${selectedCard.name}`);
      setSelectedCardId(null);
      setSelectedCardIndex(null);
      setSelectedCard(null);
    }
  };
  
  /**
   * Debug: State manuell refreshen
   */
  const handleRefresh = () => {
    refresh();
    setSelectedCardId(null);
    setSelectedCardIndex(null);
    setSelectedCard(null);
    setLastMessage('View refreshed');
  };
  
  // Status-Indikator
  const getStatusColor = () => {
    if (playerView.status === 'checkmate') return '#dc2626';
    if (playerView.status === 'check') return '#f59e0b';
    if (playerView.status === 'stalemate' || playerView.status === 'draw') return '#6b7280';
    return '#10b981';
  };
  
  const getStatusMessage = () => {
    if (playerView.status === 'checkmate') return '👑 Checkmate!';
    if (playerView.status === 'check') return '⚠️ Check!';
    if (playerView.status === 'stalemate') return '🤝 Stalemate';
    if (playerView.status === 'draw') return '🤝 Draw';
    return '✓ Active';
  };
  
  return (
    <div style={{ 
      padding: '24px',
      maxWidth: '1400px',
      margin: '0 auto',
    }}>
      {/* Header */}
      <div style={{ 
        marginBottom: '24px',
        textAlign: 'center',
      }}>
        <h1 style={{ 
          fontSize: '32px',
          marginBottom: '8px',
          color: '#f1f5f9',
        }}>
          Deckmate Chess
        </h1>
        <p style={{ color: '#94a3b8' }}>
          Playing as: {player === 'white' ? '⚪ White' : '⚫ Black'}
        </p>
      </div>
      
      {/* Status Banner */}
      {(playerView.status === 'check' || playerView.status === 'checkmate') && (
        <div style={{
          marginBottom: '16px',
          padding: '12px',
          backgroundColor: getStatusColor(),
          borderRadius: '8px',
          textAlign: 'center',
          color: 'white',
          fontSize: '18px',
          fontWeight: 'bold',
          animation: 'pulse 2s infinite',
        }}>
          {getStatusMessage()}
        </div>
      )}
      
      {/* Message Area */}
      <div style={{
        marginBottom: '16px',
        padding: '12px',
        backgroundColor: '#16213e',
        borderRadius: '8px',
        textAlign: 'center',
        color: '#cbd5e1',
      }}>
        💬 {lastMessage}
      </div>
      
      {/* Main Layout: Board + Info */}
      <div style={{ 
        display: 'flex',
        gap: '24px',
        marginBottom: '32px',
        justifyContent: 'center',
      }}>
        {/* Board */}
        <div>
          <BoardComponent
            board={playerView.board}
            onSquareClick={handleSquareClick}
            highlightedSquares={highlightedSquares}
            boardEffects={playerView.boardEffects}
          />
        </div>
        
        {/* Info Sidebar */}
        <div style={{ width: '300px' }}>
          <BoardInfo
            currentPlayer={playerView.currentPlayer}
            turnNumber={playerView.turnNumber}
            status={playerView.status}
          />
          
          {/* Selected Card Info */}
          {selectedCardId && (
            <div style={{ 
              marginTop: '16px',
              padding: '16px',
              backgroundColor: '#16213e',
              borderRadius: '8px',
              border: '2px solid #fbbf24',
            }}>
              <h4 style={{ marginBottom: '8px', color: '#fbbf24' }}>
                Card Selected
              </h4>
              <p style={{ fontSize: '14px', color: '#cbd5e1', marginBottom: '12px' }}>
                {selectedCard?.id.startsWith('move-') 
                  ? '♟ Click highlighted square to move' 
                  : 'Click board or play directly'}
              </p>
              <button
                onClick={handlePlayCardDirect}
                style={{
                  width: '100%',
                  padding: '8px 16px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                }}
              >
                Play Card (No Target)
              </button>
            </div>
          )}
          
          {/* Actions */}
          <div style={{ 
            marginTop: '16px',
            padding: '16px',
            backgroundColor: '#16213e',
            borderRadius: '8px',
          }}>
            <h4 style={{ marginBottom: '12px', color: '#cbd5e1' }}>
              Actions
            </h4>
            
            {/* Play Card Button */}
            {selectedCard && (
              <button
                onClick={handlePlayCardDirect}
                disabled={!playerView.canPlayCard}
                style={{
                  width: '100%',
                  marginBottom: '8px',
                  padding: '12px 16px',
                  backgroundColor: playerView.canPlayCard ? '#10b981' : '#374151',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: playerView.canPlayCard ? 'pointer' : 'not-allowed',
                  fontSize: '14px',
                  fontWeight: 'bold',
                }}
              >
                🎯 Play: {selectedCard.name}
              </button>
            )}
            
            <button
              onClick={handleRefresh}
              style={{
                width: '100%',
                padding: '8px 16px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Refresh View
            </button>
          </div>
          
          {/* Stats */}
          <div style={{ 
            marginTop: '16px',
            padding: '16px',
            backgroundColor: '#16213e',
            borderRadius: '8px',
          }}>
            <h4 style={{ marginBottom: '8px', color: '#cbd5e1' }}>
              Hand Stats
            </h4>
            <div style={{ fontSize: '14px', color: '#94a3b8' }}>
              <div>Move Cards: {playerView.myHand.stats.moveCards}</div>
              <div>Special Cards: {playerView.myHand.stats.specialCards}</div>
              <div>Total: {playerView.myHand.stats.totalCards}</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Hand */}
      <div>
        <DualHand
          moveCards={playerView.myHand.moveCards}
          specialCards={playerView.myHand.specialCards}
          onMoveCardClick={(cardId, index) => {
            const card = playerView.myHand.moveCards.find(c => c.id === cardId);
            if (card) handleCardSelect(cardId, index, card);
          }}
          onSpecialCardClick={(cardId, index) => {
            const card = playerView.myHand.specialCards.find(c => c.id === cardId);
            if (card) handleCardSelect(cardId, index, card);
          }}
          selectedCardId={selectedCardId || undefined}
        />
      </div>
      
      {/* Turn Indicator */}
      {!playerView.canPlayCard && (
        <div style={{ 
          marginTop: '24px',
          padding: '16px',
          backgroundColor: '#991b1b',
          borderRadius: '8px',
          textAlign: 'center',
          color: '#fecaca',
        }}>
          ⏳ Not your turn - waiting for opponent
        </div>
      )}
    </div>
  );
};
