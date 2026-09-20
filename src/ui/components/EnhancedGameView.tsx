/**
 * EnhancedGameView Component
 * 
 * Game view with deck-building support and special card decision handling
 */

import React, { useState } from 'react';
import { useEnhancedGameState } from '../hooks/useEnhancedGameState.js';
import { BoardComponent } from './Board.js';
import { DualHand } from './Card.js';
import { SpecialCardDecisionDialog } from './SpecialCardDecisionDialog.js';
import { CardSelectionDialog } from './CardSelectionDialog.js';
import { GameOverDialog } from './GameOverDialog.js';
import { PawnPromotionDialog } from './PawnPromotionDialog.js';
import { Color, Position, Move, PieceType } from '../../core/index.js';
import { NO_PARAMS } from '../../cards/types/effect.js';
import { Card } from '../../cards/types/card.js';
import { logger } from '../../utils/logger';

interface EnhancedGameViewProps {
  player: Color;
  whiteDeck?: readonly Card[];
  blackDeck?: readonly Card[];
}

/**
 * Extract move positions from move card
 */
function getMovePositionsFromCard(card: Card): { from: Position; to: Position } | null {
  // Parse from card description: "Move from e2 to e4"
  const match = card.description.match(/from ([a-h][1-8]) to ([a-h][1-8])/);
  if (match) {
    const fromAlg = match[1];
    const toAlg = match[2];
    
    const fromCol = fromAlg.charCodeAt(0) - 'a'.charCodeAt(0);
    const fromRow = parseInt(fromAlg[1], 10) - 1;
    const toCol = toAlg.charCodeAt(0) - 'a'.charCodeAt(0);
    const toRow = parseInt(toAlg[1], 10) - 1;
    
    return {
      from: { row: fromRow, col: fromCol },
      to: { row: toRow, col: toCol }
    };
  }
  return null;
}

export const EnhancedGameView: React.FC<EnhancedGameViewProps> = ({
  player,
  whiteDeck,
  blackDeck,
}) => {
  // Game state from enhanced hook
  const {
    playerView,
    hasPendingSpecialCardDecision,
    pendingSpecialCard,
    playCard,
    handleSpecialCardDecision,
    getAvailableMovesForPiece,
    makeFreeMove,
    getDeckInfo,
    selectCardsFromUsed,
    activateCardFromUsed,
    cancelCardSelection,
    completeSwapPieces,
    completePlaceTrap,
    completeConvertPawn,
    cancelBoardAction,
  } = useEnhancedGameState(player, whiteDeck, blackDeck);
  
  // Local UI state
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [lastMessage, setLastMessage] = useState<string>('Ready to play');
  
  // Free move state
  const [selectedPiecePos, setSelectedPiecePos] = useState<Position | null>(null);
  const [availableMoves, setAvailableMoves] = useState<Position[]>([]);
  
  // Spawn mode state (for Reinforcements card)
  const [spawnMode, setSpawnMode] = useState(false);
  const [spawnCardId, setSpawnCardId] = useState<string | null>(null);
  const[selectedPawnForSpawn, setSelectedPawnForSpawn] = useState<Position | null>(null);
  const [spawnPositions, setSpawnPositions] = useState<Position[]>([]);
  
  // Board action state (for Tactical Reposition, Trap Field, Conversion)
  const [firstPiecePos, setFirstPiecePos] = useState<Position | null>(null);
  
  // Pawn promotion state
  const [pendingPromotion, setPendingPromotion] = useState<{ move: Move; color: Color } | null>(null);
  
  /**
   * Handle card selection
   */
  const handleMoveCardSelect = (cardId: string, index: number) => {
    const card = playerView.myHand.moveCards[index];
    if (card) {
      setSelectedCardId(cardId);
      setSelectedCardIndex(index);
      setSelectedCard(card);
      setLastMessage(`Selected: ${card.name}`);
    }
  };

  const handleSpecialCardSelect = (cardId: string, index: number) => {
    const card = playerView.myHand.specialCards[index];
    if (card) {
      setSelectedCardId(cardId);
      setSelectedCardIndex(index);
      setSelectedCard(card);
      setLastMessage(`Selected: ${card.name}`);
    }
  };
  
  // Calculate highlighted squares (for move cards, free move, spawn mode, or board actions)
  const highlightedSquares: Position[] = [];
  
  // Highlight for board actions
  if (playerView.pendingBoardAction) {
    if (firstPiecePos) {
      highlightedSquares.push(firstPiecePos);
    }
    // For swap mode, highlight all own pieces
    if (playerView.pendingBoardAction.action === 'swapPieces') {
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const piece = playerView.board[row][col];
          if (piece && piece.color === player) {
            highlightedSquares.push({ row, col });
          }
        }
      }
    }
    // For trap mode, highlight empty squares
    if (playerView.pendingBoardAction.action === 'placeTrap') {
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const piece = playerView.board[row][col];
          if (!piece) {
            highlightedSquares.push({ row, col });
          }
        }
      }
    }
    // For convert mode, highlight opponent pawns
    if (playerView.pendingBoardAction.action === 'convertPawn') {
      const opponentColor = player === 'white' ? 'black' : 'white';
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const piece = playerView.board[row][col];
          if (piece && piece.type === 'pawn' && piece.color === opponentColor) {
            highlightedSquares.push({ row, col });
          }
        }
      }
    }
  } else if (spawnMode && spawnPositions.length > 0) {
    // Show available spawn positions
    highlightedSquares.push(...spawnPositions);
    if (selectedPawnForSpawn) {
      highlightedSquares.push(selectedPawnForSpawn);
    }
  } else if (playerView.freeMoveEnabled && availableMoves.length > 0) {
    // Show available move destinations
    highlightedSquares.push(...availableMoves);
    // Also highlight selected piece
    if (selectedPiecePos) {
      highlightedSquares.push(selectedPiecePos);
    }
  } else if (selectedCard && selectedCard.id.startsWith('move-')) {
    // Highlight the from and to positions of the selected move card
    const movePos = getMovePositionsFromCard(selectedCard);
    if (movePos) {
      highlightedSquares.push(movePos.from);
      highlightedSquares.push(movePos.to);
    }
  }
  
  /**
   * Handle square click on board
   */
  const handleSquareClick = (_position: Position) => {
    // Board action mode (Tactical Reposition, Trap Field, Conversion)
    if (playerView.pendingBoardAction) {
      const action = playerView.pendingBoardAction.action;
      const piece = playerView.board[_position.row][_position.col];
      
      if (action === 'swapPieces') {
        // Need to select 2 own pieces
        if (!firstPiecePos) {
          // Select first piece
          if (piece && piece.color === player) {
            setFirstPiecePos(_position);
            setLastMessage(`First piece selected - click another piece to swap`);
          } else {
            setLastMessage(`Please select one of your pieces`);
          }
        } else {
          // Select second piece
          if (piece && piece.color === player) {
            completeSwapPieces(firstPiecePos, _position);
            setFirstPiecePos(null);
            setLastMessage(`Pieces swapped!`);
          } else {
            setLastMessage(`Please select one of your pieces`);
          }
        }
        return;
      }
      
      if (action === 'placeTrap') {
        // Need to select empty square
        if (!piece) {
          completePlaceTrap(_position);
          setLastMessage(`Trap placed!`);
        } else {
          setLastMessage(`Please select an empty square`);
        }
        return;
      }
      
      if (action === 'convertPawn') {
        // Need to select opponent pawn
        const opponentColor = player === 'white' ? 'black' : 'white';
        if (piece && piece.type === 'pawn' && piece.color === opponentColor) {
          completeConvertPawn(_position);
          setLastMessage(`Pawn converted!`);
        } else {
          setLastMessage(`Please select an opponent pawn`);
        }
        return;
      }
    }
    
    // Spawn mode (Reinforcements card)
    if (spawnMode) {
      const piece = playerView.board[_position.row][_position.col];
      
      // Step 1: Select a pawn
      if (!selectedPawnForSpawn) {
        if (piece && piece.type === 'pawn' && piece.color === player) {
          setSelectedPawnForSpawn(_position);
          
          // Calculate adjacent empty squares
          const adjacent: Position[] = [];
          const directions = [
            { row: -1, col: -1 }, { row: -1, col: 0 }, { row: -1, col: 1 },
            { row: 0, col: -1 },                        { row: 0, col: 1 },
            { row: 1, col: -1 },  { row: 1, col: 0 },  { row: 1, col: 1 },
          ];
          
          for (const dir of directions) {
            const newRow = _position.row + dir.row;
            const newCol = _position.col + dir.col;
            
            if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
              const adjPiece = playerView.board[newRow][newCol];
              if (!adjPiece) {
                adjacent.push({ row: newRow, col: newCol });
              }
            }
          }
          
          setSpawnPositions(adjacent);
          setLastMessage(`Pawn selected - click an adjacent empty square to spawn`);
        } else {
          setLastMessage(`Please select one of your pawns`);
        }
        return;
      }
      
      // Step 2: Select spawn position
      if (selectedPawnForSpawn && spawnPositions.length > 0) {
        const validSpawn = spawnPositions.find(
          pos => pos.row === _position.row && pos.col === _position.col
        );
        
        if (validSpawn && spawnCardId) {
          // Execute spawn
          playCard(spawnCardId, { 
            type: 'spawn', 
            targetPosition: validSpawn,
            pieceType: 'pawn'
          }, false);
          
          // Reset state
          setSpawnMode(false);
          setSpawnCardId(null);
          setSelectedPawnForSpawn(null);
          setSpawnPositions([]);
          setLastMessage('Pawn spawned!');
          return;
        }
      }
      
      // Clear spawn selection if clicking elsewhere
      setSelectedPawnForSpawn(null);
      setSpawnPositions([]);
      setLastMessage('Spawn cancelled - select a pawn');
      return;
    }
    
    // Free move mode
    if (playerView.freeMoveEnabled) {
      const piece = playerView.board[_position.row][_position.col];
      
      // If clicking on own piece, select it and show available moves
      if (piece && piece.color === player) {
        setSelectedPiecePos(_position);
        const moves = getAvailableMovesForPiece(_position);
        setAvailableMoves(moves);
        setLastMessage(`Selected ${piece.type} - click destination to move`);
        return;
      }
      
      // If we have a selected piece, check if this is a valid destination
      if (selectedPiecePos && availableMoves.length > 0) {
        const targetPos = availableMoves.find(
          pos => pos.row === _position.row && pos.col === _position.col
        );
        
        if (targetPos) {
          // Get the piece to create the move
          const piece = playerView.board[selectedPiecePos.row][selectedPiecePos.col];
          if (piece) {
            const move: Move = {
              from: selectedPiecePos,
              to: targetPos,
              piece: piece,
            };
            
            // Check if pawn promotion is needed
            const promotionRank = piece.color === 'white' ? 7 : 0;
            if (piece.type === 'pawn' && targetPos.row === promotionRank) {
              // Show promotion dialog
              setPendingPromotion({ move, color: piece.color });
              setSelectedPiecePos(null);
              setAvailableMoves([]);
              setLastMessage('Choose promotion piece');
              return;
            }
            
            makeFreeMove(move);
            setSelectedPiecePos(null);
            setAvailableMoves([]);
            setLastMessage('Free move executed!');
            return;
          }
        }
      }
      
      // Clear selection if clicking elsewhere
      setSelectedPiecePos(null);
      setAvailableMoves([]);
      return;
    }
    
    // Normal card mode
    if (selectedCardId && selectedCardIndex !== null) {
      // Determine if it's a move card or special card
      const isMoveCard = selectedCard?.id.startsWith('move-') ?? true;
      
      // Move cards have the move embedded - no params needed
      // Special cards are handled via their specific UI flows (spawn, board actions, etc.)
      playCard(selectedCardId, NO_PARAMS, isMoveCard);
      
      setLastMessage(`Played: ${selectedCard?.name || 'card'}`);
      
      // Reset UI state
      setSelectedCardId(null);
      setSelectedCardIndex(null);
      setSelectedCard(null);
    }
  };
  
  /**
   * Handle playing card directly (without board interaction)
   */
  const handlePlayCardDirect = () => {
    if (selectedCardId && selectedCard) {
      // Special handling for Reinforcements card - enter spawn mode
      if (selectedCard.id.startsWith('spawn-pawn')) {
        setSpawnMode(true);
        setSpawnCardId(selectedCardId);
        setSelectedCardId(null); // Clear selection to hide card and button
        setSelectedCardIndex(null);
        setSelectedCard(null);
        setLastMessage(`${selectedCard.name}: Click on one of your pawns`);
        return;
      }
      
      // Special handling for Wild Card - clear selection after playing
      if (selectedCard.id.startsWith('free-move-')) {
        playCard(selectedCardId, NO_PARAMS, false);
        setSelectedCardId(null); // Clear selection to hide card and button
        setSelectedCardIndex(null);
        setSelectedCard(null);
        setLastMessage(`${selectedCard.name}: Click on any piece to move`);
        return;
      }
      
      const isMoveCard = selectedCard.id.startsWith('move-');
      playCard(selectedCardId, NO_PARAMS, isMoveCard);
      setLastMessage(`Played: ${selectedCard.name}`);
      setSelectedCardId(null);
      setSelectedCardIndex(null);
      setSelectedCard(null);
    }
  };
  
  /**
   * Handle special card decision
   */
  const handleKeepCard = () => {
    handleSpecialCardDecision(true);
    setLastMessage('Special card discarded');
  };
  
  const handleShuffleBack = () => {
    handleSpecialCardDecision(false);
    setLastMessage('Special card shuffled back into deck');
  };
  
  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Board Action Mode Indicator */}
      {playerView.pendingBoardAction && (
        <div
          style={{
            marginBottom: '16px',
            padding: '16px',
            backgroundColor: '#ea580c',
            borderRadius: '8px',
            border: '2px solid #f97316',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'white' }}>
            {playerView.pendingBoardAction.action === 'swapPieces' && '🔄 Tactical Reposition'}
            {playerView.pendingBoardAction.action === 'placeTrap' && '💣 Trap Field'}
            {playerView.pendingBoardAction.action === 'convertPawn' && '⚡ Conversion'}
          </div>
          <div style={{ fontSize: '14px', color: '#fed7aa', marginTop: '4px' }}>
            {playerView.pendingBoardAction.action === 'swapPieces' && (firstPiecePos ? 'Click a second piece to swap' : 'Click two of your pieces to swap positions')}
            {playerView.pendingBoardAction.action === 'placeTrap' && 'Click an empty square to place trap'}
            {playerView.pendingBoardAction.action === 'convertPawn' && 'Click an opponent pawn to convert'}
          </div>
          <button
            onClick={() => {
              cancelBoardAction();
              setFirstPiecePos(null);
              setLastMessage('Board action cancelled');
            }}
            style={{
              marginTop: '8px',
              padding: '8px 16px',
              backgroundColor: '#7f1d1d',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            ❌ Cancel
          </button>
        </div>
      )}
      
      {/* Spawn Mode Indicator */}
      {spawnMode && (
        <div
          style={{
            marginBottom: '16px',
            padding: '16px',
            backgroundColor: '#0891b2',
            borderRadius: '8px',
            border: '2px solid #06b6d4',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'white' }}>
            🤝 Reinforcements Active
          </div>
          <div style={{ fontSize: '14px', color: '#cffafe', marginTop: '4px' }}>
            {selectedPawnForSpawn ? 'Click an adjacent empty square to spawn a pawn' : 'Click on one of your pawns'}
          </div>
        </div>
      )}
      
      {/* Free Move Mode Indicator */}
      {playerView.freeMoveEnabled && (
        <div
          style={{
            marginBottom: '16px',
            padding: '16px',
            backgroundColor: '#7c3aed',
            borderRadius: '8px',
            border: '2px solid #a78bfa',
            textAlign: 'center',
            animation: 'pulse 2s infinite',
          }}
        >
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'white' }}>
            🎯 Free Move Active
          </div>
          <div style={{ fontSize: '14px', color: '#e9d5ff', marginTop: '4px' }}>
            Click on any of your pieces to see available moves
          </div>
        </div>
      )}
      
      {/* Status Banner */}
      <div
        style={{
          marginBottom: '20px',
          padding: '16px',
          backgroundColor: playerView.currentPlayer === player ? '#10b981' : '#374151',
          borderRadius: '8px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          border: playerView.currentPlayer === player ? '3px solid #34d399' : '2px solid #4b5563',
          boxShadow: playerView.currentPlayer === player 
            ? '0 0 20px rgba(16, 185, 129, 0.5)' 
            : 'none',
          animation: playerView.currentPlayer === player ? 'pulse 2s ease-in-out infinite' : 'none',
        }}
      >
        <div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'white' }}>
            {playerView.currentPlayer === player ? '🎮 YOUR TURN' : '⏳ Opponent\'s Turn'}
          </div>
          <div style={{ fontSize: '14px', color: '#e5e7eb', marginTop: '4px', fontWeight: 500 }}>
            Turn {playerView.turnNumber} • {playerView.status === 'check' ? '⚠️ CHECK!' : playerView.status.toUpperCase()}
          </div>
        </div>
        
        {playerView.deckSize !== undefined && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '14px', color: '#d1d5db', fontWeight: 500 }}>
              📚 Deck: {playerView.deckSize} | 🗑️ Discard: {playerView.discardSize || 0}
            </div>
          </div>
        )}
      </div>
      
      {/* Message Area */}
      <div
        style={{
          marginBottom: '20px',
          padding: '12px',
          backgroundColor: '#1e293b',
          borderRadius: '6px',
          fontSize: '14px',
          color: '#cbd5e1',
        }}
      >
        💬 {lastMessage}
      </div>
      
      {/* Main Game Area */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        {/* Board */}
        <div style={{ flex: '0 0 auto' }}>
          <BoardComponent
            board={playerView.board}
            onSquareClick={handleSquareClick}
            highlightedSquares={highlightedSquares}
            boardEffects={playerView.boardEffects}
          />
        </div>
        
        {/* Hand and Cards Panel */}
        <div style={{ flex: '1', minWidth: '300px' }}>
          {playerView.freeMoveEnabled && (
            <div style={{
              marginBottom: '16px',
              padding: '12px',
              backgroundColor: '#a855f7',
              borderRadius: '8px',
              color: 'white',
              fontWeight: 'bold',
              textAlign: 'center',
            }}>
              🃏 Wild Card Active
              <div style={{ fontSize: '14px', fontWeight: 'normal', marginTop: '4px' }}>
                {selectedPiecePos ? 'Click destination to move' : 'Click any piece to move'}
              </div>
            </div>
          )}
          {spawnMode && (
            <div style={{
              marginBottom: '16px',
              padding: '12px',
              backgroundColor: '#0ea5e9',
              borderRadius: '8px',
              color: 'white',
              fontWeight: 'bold',
              textAlign: 'center',
            }}>
              🎯 Reinforcements Active
              <div style={{ fontSize: '14px', fontWeight: 'normal', marginTop: '4px' }}>
                {selectedPawnForSpawn ? 'Click adjacent square to spawn' : 'Click one of your pawns'}
              </div>
            </div>
          )}
          <DualHand
            moveCards={playerView.myHand.moveCards}
            specialCards={playerView.myHand.specialCards}
            onMoveCardClick={!spawnMode && !playerView.freeMoveEnabled ? handleMoveCardSelect : undefined}
            onSpecialCardClick={!spawnMode && !playerView.freeMoveEnabled ? handleSpecialCardSelect : undefined}
            selectedCardId={selectedCardId ?? undefined}
          />
          
          {/* Hand Stats */}
          <div
            style={{
              marginTop: '16px',
              padding: '12px',
              backgroundColor: '#1e293b',
              borderRadius: '6px',
              fontSize: '14px',
            }}
          >
            <div style={{ color: '#94a3b8', marginBottom: '4px' }}>Hand Stats:</div>
            <div style={{ color: '#cbd5e1' }}>
              Move Cards: {playerView.myHand.moveCards.length}/5
            </div>
            <div style={{ color: '#cbd5e1' }}>
              Special Cards: {playerView.myHand.specialCards.length}/1
            </div>
            <div style={{ color: '#94a3b8', marginTop: '8px' }}>
              Opponent Hand: {playerView.opponentHandSize} cards
            </div>
          </div>
          
          {/* Play Card Button */}
          {selectedCard && !spawnMode && !playerView.freeMoveEnabled && (
            <button
              onClick={handlePlayCardDirect}
              disabled={!playerView.canPlayCard}
              style={{
                marginTop: '16px',
                width: '100%',
                padding: '16px',
                backgroundColor: playerView.canPlayCard ? '#10b981' : '#374151',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: playerView.canPlayCard ? 'pointer' : 'not-allowed',
                fontSize: '16px',
                fontWeight: 'bold',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                if (playerView.canPlayCard) {
                  e.currentTarget.style.backgroundColor = '#059669';
                }
              }}
              onMouseLeave={(e) => {
                if (playerView.canPlayCard) {
                  e.currentTarget.style.backgroundColor = '#10b981';
                }
              }}
            >
              🎯 Play: {selectedCard.name}
            </button>
          )}
        </div>
      </div>
      
      {/* Special Card Decision Dialog */}
      {hasPendingSpecialCardDecision && pendingSpecialCard && (
        <SpecialCardDecisionDialog
          card={pendingSpecialCard}
          onKeep={handleKeepCard}
          onShuffleBack={handleShuffleBack}
        />
      )}
      
      {/* Card Selection Dialog (for Salvage/Recall cards) */}
      {playerView.pendingCardSelection && (
        <CardSelectionDialog
          cards={getDeckInfo().used.filter(card => {
            // Filter out the triggering card to prevent self-selection
            return card.id !== playerView.pendingCardSelection?.triggeringCardId;
          })}
          action={playerView.pendingCardSelection.action}
          maxCount={playerView.pendingCardSelection.maxCount}
          onConfirm={(selectedCardIds) => {
            if (playerView.pendingCardSelection?.action === 'recover') {
              selectCardsFromUsed(selectedCardIds);
            } else if (playerView.pendingCardSelection?.action === 'activate') {
              activateCardFromUsed(selectedCardIds[0]);
            }
          }}
          onCancel={() => {
            cancelCardSelection();
          }}
        />
      )}
      
      {/* Game Over Dialog */}
      {(playerView.status === 'checkmate' || 
        playerView.status === 'stalemate' || 
        playerView.status === 'draw' || 
        playerView.status === 'resigned') && (
        <GameOverDialog
          status={playerView.status as import('../../core/types/common.js').GameStatus}
          winner={
            playerView.status === 'checkmate' || playerView.status === 'resigned'
              ? (playerView.currentPlayer === 'white' ? 'black' : 'white')  // Current player lost
              : undefined  // No winner for stalemate/draw
          }
          onNewGame={() => {
            // Reload the page to start a new game
            window.location.reload();
          }}
          onBackToMenu={() => {
            // Navigate back to main menu (would need routing setup)
            logger.debug('Back to menu - routing not implemented yet');
          }}
        />
      )}
      
      {/* Pawn Promotion Dialog */}
      {pendingPromotion && (
        <PawnPromotionDialog
          color={pendingPromotion.color}
          onChoose={(pieceType: PieceType) => {
            if (pendingPromotion) {
              // Complete the move with the chosen promotion piece
              const moveWithPromotion: Move = {
                ...pendingPromotion.move,
                promotion: pieceType,
              };
              makeFreeMove(moveWithPromotion);
              setPendingPromotion(null);
              setLastMessage(`Pawn promoted to ${pieceType}!`);
            }
          }}
        />
      )}
    </div>
  );
};
