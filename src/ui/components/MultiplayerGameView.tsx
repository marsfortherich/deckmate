/**
 * MultiplayerGameView Component
 * 
 * Hot seat multiplayer view that shows the current player's perspective
 */

import React, { useState, useEffect } from 'react';
import { useEnhancedGameState } from '../hooks/useEnhancedGameState.js';
import { BoardComponent, BoardInfo } from './Board.js';
import { DualHand } from './Card.js';
import { SpecialCardDecisionDialog } from './SpecialCardDecisionDialog.js';
import { CardSelectionDialog } from './CardSelectionDialog.js';
import { DeckViewerDialog } from './DeckViewerDialog.js';
import { CardHistoryPanel } from './CardHistoryPanel.js';
import { GameOverDialog } from './GameOverDialog.js';
import { PawnPromotionDialog } from './PawnPromotionDialog.js';
import { Color, Position, Move, PieceType } from '../../core/index.js';
import { NO_PARAMS } from '../../cards/types/effect.js';
import { Card } from '../../cards/types/card.js';

interface MultiplayerGameViewProps {
  whiteDeck?: readonly Card[];
  blackDeck?: readonly Card[];
  onBackToMenu?: () => void;
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

export const MultiplayerGameView: React.FC<MultiplayerGameViewProps> = ({
  whiteDeck,
  blackDeck,
  onBackToMenu,
}) => {
  // Track current player and whether to show pass device screen
  const [currentPlayer, setCurrentPlayer] = useState<Color>('white');
  const [showPassDevice, setShowPassDevice] = useState(false);
  
  // Game state from enhanced hook for current player
  const {
    playerView,
    hasPendingSpecialCardDecision,
    pendingSpecialCard,
    playCard,
    handleSpecialCardDecision,
    getAvailableMovesForPiece,
    makeFreeMove,
    getRetreatatablePawns,
    getBackwardPosition,
    choosePieceType,
    getDeckInfo,
    getOpponentDeckInfo,
    getPlayHistory,
    selectCardsFromUsed,
    activateCardFromUsed,
    cancelCardSelection,
    completeSwapPieces,
    completePlaceTrap,
    completeConvertPawn,
    cancelBoardAction,
    refresh,
  } = useEnhancedGameState(currentPlayer, whiteDeck, blackDeck);
  
  // Local UI state
  const [selectedMoveCard, setSelectedMoveCard] = useState<string | null>(null);
  const [selectedSpecialCard, setSelectedSpecialCard] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  
  // Deck viewer state
  const [showDeckViewer, setShowDeckViewer] = useState(false);
  
  // History panel state
  const [showHistory, setShowHistory] = useState(false);
  
  // Free move state
  const [selectedPiecePos, setSelectedPiecePos] = useState<Position | null>(null);
  const [availableMoves, setAvailableMoves] = useState<Position[]>([]);
  
  // Spawn mode state (for Reinforcements card)
  const [spawnMode, setSpawnMode] = useState(false);
  const [spawnCardId, setSpawnCardId] = useState<string | null>(null);
  const [selectedPawnForSpawn, setSelectedPawnForSpawn] = useState<Position | null>(null);
  const [spawnPositions, setSpawnPositions] = useState<Position[]>([]);

  // Retreat mode state (for Tactical Retreat card)
  const [retreatMode, setRetreatMode] = useState(false);
  const [retreatCardId, setRetreatCardId] = useState<string | null>(null);
  const [selectedPawnForRetreat, setSelectedPawnForRetreat] = useState<Position | null>(null);
  const [retreatPosition, setRetreatPosition] = useState<Position | null>(null);
  const [retreatablePawns, setRetreatablePawns] = useState<Position[]>([]);
  
  // Board action state (for Tactical Reposition, Trap Field, Conversion)
  const [firstPiecePos, setFirstPiecePos] = useState<Position | null>(null);
  
  // Pawn promotion state
  const [pendingPromotion, setPendingPromotion] = useState<{ move: Move; color: Color } | null>(null);
  
  // Detect when current player changes and show pass device screen
  useEffect(() => {
    const gameCurrentPlayer = playerView?.currentPlayer;
    const gameStatus = playerView?.status;
    
    // Don't show pass device if game is over
    if (gameStatus === 'checkmate' || gameStatus === 'stalemate' || 
        gameStatus === 'draw' || gameStatus === 'resigned') {
      return;
    }
    
    if (gameCurrentPlayer && gameCurrentPlayer !== currentPlayer) {
      // Turn has changed
      setCurrentPlayer(gameCurrentPlayer);
      setShowPassDevice(true);
      
      // Clear selections when switching players
      setSelectedMoveCard(null);
      setSelectedSpecialCard(null);
      setSpawnMode(false);
      setSpawnCardId(null);
      setSelectedPawnForSpawn(null);
      setSpawnPositions([]);
      setRetreatMode(false);
      setRetreatCardId(null);
      setSelectedPawnForRetreat(null);
      setRetreatPosition(null);
      setRetreatablePawns([]);
      setFirstPiecePos(null);
    }
  }, [playerView?.currentPlayer, playerView?.status, currentPlayer]);
  
  // Refresh view periodically to catch state changes
  useEffect(() => {
    const interval = setInterval(() => {
      refresh();
    }, 100);
    return () => clearInterval(interval);
  }, [refresh]);
  
  const handleContinueGame = () => {
    setShowPassDevice(false);
    refresh();
  };
  
  const handleMoveCardSelect = (cardId: string, _index: number) => {
    setSelectedMoveCard(cardId === selectedMoveCard ? null : cardId);
    setSelectedSpecialCard(null);
  };
  
  const handleSpecialCardSelect = (cardId: string, _index: number) => {
    setSelectedSpecialCard(cardId === selectedSpecialCard ? null : cardId);
    setSelectedMoveCard(null);
  };
  
  const handleBoardClick = (position: Position) => {
    if (!isCurrentPlayer) return;
    
    // Board action mode (Tactical Reposition, Trap Field, Conversion)
    if (playerView.pendingBoardAction) {
      const action = playerView.pendingBoardAction.action;
      const piece = playerView.board[position.row][position.col];
      
      if (action === 'swapPieces') {
        // Need to select 2 own pieces
        if (!firstPiecePos) {
          // Select first piece
          if (piece && piece.color === currentPlayer) {
            setFirstPiecePos(position);
            setStatusMessage(`First piece selected - click another piece to swap`);
          } else {
            setStatusMessage(`Please select one of your pieces`);
          }
        } else {
          // Select second piece
          if (piece && piece.color === currentPlayer) {
            completeSwapPieces(firstPiecePos, position);
            setFirstPiecePos(null);
            setStatusMessage(`Pieces swapped!`);
            setTimeout(() => setStatusMessage(''), 2000);
          } else {
            setStatusMessage(`Please select one of your pieces`);
          }
        }
        return;
      }
      
      if (action === 'placeTrap') {
        // Need to select empty square
        if (!piece) {
          completePlaceTrap(position);
          setStatusMessage(`Trap placed!`);
          setTimeout(() => setStatusMessage(''), 2000);
        } else {
          setStatusMessage(`Please select an empty square`);
        }
        return;
      }
      
      if (action === 'convertPawn') {
        // Need to select opponent pawn
        const opponentColor = currentPlayer === 'white' ? 'black' : 'white';
        if (piece && piece.type === 'pawn' && piece.color === opponentColor) {
          completeConvertPawn(position);
          setStatusMessage(`Pawn converted!`);
          setTimeout(() => setStatusMessage(''), 2000);
        } else {
          setStatusMessage(`Please select an opponent pawn`);
        }
        return;
      }
    }
    
    // Retreat mode (Tactical Retreat card)
    if (retreatMode) {
      const piece = playerView.board[position.row][position.col];
      
      // Step 1: Select a retreatable pawn
      if (!selectedPawnForRetreat) {
        const isRetreatablePawn = retreatablePawns.some(
          p => p.row === position.row && p.col === position.col
        );
        
        if (piece && piece.type === 'pawn' && piece.color === currentPlayer && isRetreatablePawn) {
          setSelectedPawnForRetreat(position);
          const backwardPos = getBackwardPosition(position);
          setRetreatPosition(backwardPos);
          setStatusMessage(`Pawn selected - click the backwards square to retreat`);
        } else {
          setStatusMessage(`Please select a pawn that can move backwards`);
        }
        return;
      }
      
      // Step 2: Select retreat position (must be the backwards square)
      if (selectedPawnForRetreat && retreatPosition && retreatCardId) {
        const isRetreatPosition = 
          position.row === retreatPosition.row && 
          position.col === retreatPosition.col;
        
        if (isRetreatPosition) {
          // Execute retreat by playing the card with the pawn position as target
          playCard(retreatCardId, { 
            type: 'spawn',  // The effect expects this type
            targetPosition: selectedPawnForRetreat,
          }, false);
          
          // Reset state
          setRetreatMode(false);
          setRetreatCardId(null);
          setSelectedPawnForRetreat(null);
          setRetreatPosition(null);
          setRetreatablePawns([]);
          setStatusMessage('Pawn retreated!');
          setTimeout(() => setStatusMessage(''), 2000);
          return;
        }
      }
      
      // Clear retreat selection if clicking elsewhere
      setSelectedPawnForRetreat(null);
      setRetreatPosition(null);
      setStatusMessage('Retreat cancelled - select a pawn');
      return;
    }
    
    // Spawn mode (Reinforcements card)
    if (spawnMode) {
      const piece = playerView.board[position.row][position.col];
      
      // Step 1: Select a pawn
      if (!selectedPawnForSpawn) {
        if (piece && piece.type === 'pawn' && piece.color === currentPlayer) {
          setSelectedPawnForSpawn(position);
          
          // Calculate adjacent empty squares
          const adjacent: Position[] = [];
          const directions = [
            { row: -1, col: -1 }, { row: -1, col: 0 }, { row: -1, col: 1 },
            { row: 0, col: -1 },                        { row: 0, col: 1 },
            { row: 1, col: -1 },  { row: 1, col: 0 },  { row: 1, col: 1 },
          ];
          
          for (const dir of directions) {
            const newRow = position.row + dir.row;
            const newCol = position.col + dir.col;
            
            if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
              const adjPiece = playerView.board[newRow][newCol];
              if (!adjPiece) {
                adjacent.push({ row: newRow, col: newCol });
              }
            }
          }
          
          setSpawnPositions(adjacent);
          setStatusMessage(`Pawn selected - click an adjacent empty square to spawn`);
        } else {
          setStatusMessage(`Please select one of your pawns`);
        }
        return;
      }
      
      // Step 2: Select spawn position
      if (selectedPawnForSpawn && spawnPositions.length > 0) {
        const validSpawn = spawnPositions.find(
          pos => pos.row === position.row && pos.col === position.col
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
          setStatusMessage('Pawn spawned!');
          setTimeout(() => setStatusMessage(''), 2000);
          return;
        }
      }
      
      // Clear spawn selection if clicking elsewhere
      setSelectedPawnForSpawn(null);
      setSpawnPositions([]);
      setStatusMessage('Spawn cancelled - select a pawn');
      return;
    }
    
    // Free move mode
    if (playerView.freeMoveEnabled) {
      const piece = playerView.board[position.row][position.col];
      
      // If clicking on own piece, select it and show available moves
      if (piece && piece.color === currentPlayer) {
        setSelectedPiecePos(position);
        const moves = getAvailableMovesForPiece(position);
        setAvailableMoves(moves);
        setStatusMessage(`Selected ${piece.type} - click destination to move`);
        return;
      }
      
      // If we have a selected piece, check if this is a valid destination
      if (selectedPiecePos && availableMoves.length > 0) {
        const targetPos = availableMoves.find(
          pos => pos.row === position.row && pos.col === position.col
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
              setStatusMessage('Choose promotion piece');
              return;
            }
            
            makeFreeMove(move);
            setSelectedPiecePos(null);
            setAvailableMoves([]);
            setStatusMessage('Free move executed!');
            setTimeout(() => setStatusMessage(''), 2000);
            return;
          }
        }
      }
      
      // Clear selection if clicking elsewhere
      setSelectedPiecePos(null);
      setAvailableMoves([]);
      return;
    }
  };
  
  // Calculate highlighted squares
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
          if (piece && piece.color === currentPlayer) {
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
      const opponentColor = currentPlayer === 'white' ? 'black' : 'white';
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const piece = playerView.board[row][col];
          if (piece && piece.type === 'pawn' && piece.color === opponentColor) {
            highlightedSquares.push({ row, col });
          }
        }
      }
    }
  } else if (retreatMode && retreatablePawns.length > 0) {
    // Highlight all retreatable pawns
    highlightedSquares.push(...retreatablePawns);
    // Highlight the retreat position if a pawn is selected
    if (selectedPawnForRetreat && retreatPosition) {
      highlightedSquares.push(retreatPosition);
    }
  } else if (spawnMode && spawnPositions.length > 0) {
    highlightedSquares.push(...spawnPositions);
    if (selectedPawnForSpawn) {
      highlightedSquares.push(selectedPawnForSpawn);
    }
  } else if (playerView.freeMoveEnabled && availableMoves.length > 0) {
    highlightedSquares.push(...availableMoves);
    if (selectedPiecePos) {
      highlightedSquares.push(selectedPiecePos);
    }
  } else if (selectedMoveCard && playerView?.myHand?.moveCards) {
    // Highlight the from and to positions of the selected move card
    const card = playerView.myHand.moveCards.find(c => c.id === selectedMoveCard);
    if (card) {
      const movePos = getMovePositionsFromCard(card);
      if (movePos) {
        highlightedSquares.push(movePos.from);
        highlightedSquares.push(movePos.to);
      }
    }
  }
  
  const handlePlayCard = () => {
    if (selectedMoveCard) {
      const card = playerView?.myHand?.moveCards.find(c => c.id === selectedMoveCard);
      if (!card) return;
      
      // Move cards have the move embedded - no params needed
      playCard(selectedMoveCard, NO_PARAMS, true);
      setSelectedMoveCard(null);
      setStatusMessage('Move card played!');
      setTimeout(() => setStatusMessage(''), 2000);
    } else if (selectedSpecialCard) {
      const card = playerView?.myHand?.specialCards.find(c => c.id === selectedSpecialCard);
      
      // Special handling for Reinforcements card - enter spawn mode
      if (card && card.id.startsWith('spawn-pawn')) {
        setSpawnMode(true);
        setSpawnCardId(selectedSpecialCard);
        setSelectedSpecialCard(null); // Clear selection to hide card and button
        setStatusMessage(`${card.name}: Click on one of your pawns`);
        return;
      }
      
      // Special handling for Wild Card - clear selection after playing
      if (card && card.id.startsWith('free-move-')) {
        playCard(selectedSpecialCard, NO_PARAMS, false);
        setSelectedSpecialCard(null); // Clear selection to hide card and button
        setStatusMessage(`${card.name}: Click on any piece to move`);
        return;
      }
      
      // Special handling for Tactical Retreat card - enter retreat mode
      if (card && card.id.startsWith('move-backward-')) {
        const pawns = getRetreatatablePawns();
        if (pawns.length === 0) {
          setStatusMessage('No pawns can retreat!');
          setTimeout(() => setStatusMessage(''), 2000);
          return;
        }
        setRetreatMode(true);
        setRetreatCardId(selectedSpecialCard);
        setRetreatablePawns(pawns);
        setSelectedSpecialCard(null); // Clear selection to hide card and button
        setStatusMessage(`${card.name}: Click on a pawn to move backwards`);
        return;
      }
      
      playCard(selectedSpecialCard, NO_PARAMS, false);
      setSelectedSpecialCard(null);
      setStatusMessage('Special card played!');
      setTimeout(() => setStatusMessage(''), 2000);
    }
  };
  
  // Pass device screen
  if (showPassDevice) {
    const nextPlayerName = currentPlayer === 'white' ? 'White' : 'Black';
    const nextPlayerColor = currentPlayer === 'white' ? '#f1f5f9' : '#1e293b';
    const nextPlayerBorder = currentPlayer === 'white' ? '#3b82f6' : '#8b5cf6';
    
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0f172a',
        padding: '24px',
      }}>
        <div style={{
          textAlign: 'center',
          padding: '48px',
          backgroundColor: '#1e293b',
          borderRadius: '16px',
          border: `4px solid ${nextPlayerBorder}`,
          maxWidth: '500px',
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '24px',
          }}>
            🔄
          </div>
          
          <h2 style={{
            fontSize: '32px',
            marginBottom: '16px',
            color: nextPlayerColor,
          }}>
            {nextPlayerName}'s Turn
          </h2>
          
          <p style={{
            fontSize: '18px',
            color: '#94a3b8',
            marginBottom: '32px',
          }}>
            Pass the device to the {nextPlayerName.toLowerCase()} player
          </p>
          
          <button
            onClick={handleContinueGame}
            style={{
              padding: '16px 32px',
              fontSize: '18px',
              fontWeight: 'bold',
              backgroundColor: nextPlayerBorder,
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            I'm Ready - Continue
          </button>
        </div>
      </div>
    );
  }
  
  // Main game view
  if (!playerView) {
    return <div>Loading...</div>;
  }
  
  const isCurrentPlayer = playerView.currentPlayer === currentPlayer;
  const playerName = currentPlayer === 'white' ? 'White' : 'Black';
  const playerColor = currentPlayer === 'white' ? '#3b82f6' : '#8b5cf6';
  
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0f172a',
      padding: '24px',
    }}>
      {/* Spawn Mode Indicator */}
      {spawnMode && isCurrentPlayer && (
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
      {playerView.freeMoveEnabled && isCurrentPlayer && (
        <div
          style={{
            marginBottom: '16px',
            padding: '16px',
            backgroundColor: '#7c3aed',
            borderRadius: '8px',
            border: '2px solid #a78bfa',
            textAlign: 'center',
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
      
      {/* Header */}
      <div style={{
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <h1 style={{
            fontSize: '28px',
            margin: '0 0 8px 0',
            color: playerColor,
          }}>
            Hot Seat Multiplayer
          </h1>
          <p style={{
            margin: 0,
            color: '#94a3b8',
            fontSize: '16px',
          }}>
            Current Player: <span style={{ color: playerColor, fontWeight: 'bold' }}>{playerName}</span>
            {!isCurrentPlayer && <span style={{ color: '#ef4444', marginLeft: '12px' }}>⏳ Waiting for turn...</span>}
          </p>
          {/* Deck Info Button */}
          <button
            onClick={() => setShowDeckViewer(true)}
            style={{
              marginTop: '8px',
              padding: '8px 16px',
              backgroundColor: '#1e293b',
              color: '#60a5fa',
              border: '2px solid #334155',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>🎴</span>
            <span>Deck: {playerView.deckSize || 0}</span>
            <span style={{ color: '#94a3b8' }}>|</span>
            <span>Used: {playerView.discardSize || 0}</span>
            <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '4px' }}>(special cards)</span>
          </button>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          {onBackToMenu && (
            <button
              onClick={onBackToMenu}
              style={{
                padding: '12px 24px',
                backgroundColor: '#374151',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              ← Back to Menu
            </button>
          )}
        </div>
      </div>
      
      {/* Status Message */}
      {statusMessage && (
        <div style={{
          marginBottom: '16px',
          padding: '12px 24px',
          backgroundColor: '#16213e',
          borderRadius: '8px',
          color: '#10b981',
          textAlign: 'center',
        }}>
          {statusMessage}
        </div>
      )}
      
      {/* Main Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        gap: '24px',
        alignItems: 'start',
      }}>
        {/* Left: Board Info */}
        <div>
          <BoardInfo
            currentPlayer={playerView.currentPlayer}
            turnNumber={playerView.turnNumber}
            status={playerView.status}
          />
        </div>
        
        {/* Center: Board */}
        <div>
          <BoardComponent
            board={playerView.board}
            onSquareClick={handleBoardClick}
            highlightedSquares={highlightedSquares}
            boardEffects={playerView.boardEffects}
          />
        </div>
        
        {/* Right: Player's Hand */}
        <div style={{
          backgroundColor: '#1e293b',
          borderRadius: '12px',
          padding: '24px',
          border: `2px solid ${playerColor}`,
        }}>
          <h2 style={{
            fontSize: '20px',
            marginTop: 0,
            marginBottom: '16px',
            color: playerColor,
          }}>
            Your Hand
          </h2>
          
          {playerView.myHand && (
            <>
              {playerView.pendingBoardAction && (
                <div style={{
                  marginBottom: '16px',
                  padding: '12px',
                  backgroundColor: '#ea580c',
                  borderRadius: '8px',
                  color: 'white',
                  fontWeight: 'bold',
                  textAlign: 'center',
                }}>
                  {playerView.pendingBoardAction.action === 'swapPieces' && '🔄 Tactical Reposition'}
                  {playerView.pendingBoardAction.action === 'placeTrap' && '💣 Trap Field'}
                  {playerView.pendingBoardAction.action === 'convertPawn' && '⚡ Conversion'}
                  <div style={{ fontSize: '14px', fontWeight: 'normal', marginTop: '4px' }}>
                    {playerView.pendingBoardAction.action === 'swapPieces' && (firstPiecePos ? 'Click a second piece to swap' : 'Click two of your pieces to swap')}
                    {playerView.pendingBoardAction.action === 'placeTrap' && 'Click an empty square to place trap'}
                    {playerView.pendingBoardAction.action === 'convertPawn' && 'Click an opponent pawn to convert'}
                  </div>
                  <button
                    onClick={() => {
                      cancelBoardAction();
                      setFirstPiecePos(null);
                      setStatusMessage('Board action cancelled');
                      setTimeout(() => setStatusMessage(''), 2000);
                    }}
                    style={{
                      marginTop: '8px',
                      padding: '6px 12px',
                      backgroundColor: '#7f1d1d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    ❌ Cancel
                  </button>
                </div>
              )}
              {retreatMode && (
                <div style={{
                  marginBottom: '16px',
                  padding: '12px',
                  backgroundColor: '#f59e0b',
                  borderRadius: '8px',
                  color: 'white',
                  fontWeight: 'bold',
                  textAlign: 'center',
                }}>
                  ⬅️ Tactical Retreat Active
                  <div style={{ fontSize: '14px', fontWeight: 'normal', marginTop: '4px' }}>
                    {selectedPawnForRetreat ? 'Click backwards square to retreat' : 'Click a pawn to move backwards'}
                  </div>
                </div>
              )}
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
                onMoveCardClick={isCurrentPlayer && !spawnMode && !retreatMode && !playerView.freeMoveEnabled ? handleMoveCardSelect : undefined}
                onSpecialCardClick={isCurrentPlayer && !spawnMode && !retreatMode && !playerView.freeMoveEnabled ? handleSpecialCardSelect : undefined}
                selectedCardId={selectedMoveCard || selectedSpecialCard || undefined}
              />
              
              {isCurrentPlayer && !spawnMode && !retreatMode && !playerView.freeMoveEnabled && (selectedMoveCard || selectedSpecialCard) && (() => {
                // Check if Tactical Retreat card is selected but no pawns can retreat
                const card = selectedSpecialCard ? playerView.myHand.specialCards.find(c => c.id === selectedSpecialCard) : null;
                const isTacticalRetreat = card && card.id.startsWith('move-backward-');
                const canRetreat = isTacticalRetreat ? getRetreatatablePawns().length > 0 : true;
                
                return (
                  <button
                    onClick={handlePlayCard}
                    disabled={!canRetreat}
                    style={{
                      width: '100%',
                      marginTop: '16px',
                      padding: '12px',
                      backgroundColor: canRetreat ? playerColor : '#6b7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: canRetreat ? 'pointer' : 'not-allowed',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      opacity: canRetreat ? 1 : 0.5,
                    }}
                  >
                    {isTacticalRetreat && !canRetreat ? 'No Pawns Can Retreat' : 'Play Card'}
                  </button>
                );
              })()}
            </>
          )}
        </div>
      </div>
      
      {/* Special Card Decision Dialog */}
      {hasPendingSpecialCardDecision && pendingSpecialCard && (
        <SpecialCardDecisionDialog
          card={pendingSpecialCard}
          onKeep={() => handleSpecialCardDecision(true)}
          onShuffleBack={() => handleSpecialCardDecision(false)}
        />
      )}
      
      {/* Piece Type Choice Dialog (Focus Strategy) */}
      {playerView.pendingPieceTypeChoice && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: '#1e293b',
            padding: '32px',
            borderRadius: '12px',
            maxWidth: '600px',
            border: '2px solid #3b82f6',
          }}>
            <h2 style={{
              color: '#f1f5f9',
              marginBottom: '16px',
              fontSize: '24px',
              textAlign: 'center',
            }}>
              🎯 Focus Strategy
            </h2>
            
            <p style={{
              color: '#cbd5e1',
              marginBottom: '24px',
              textAlign: 'center',
              fontSize: '16px',
            }}>
              Choose a piece type for your next turn's move cards
            </p>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
            }}>
              {['pawn', 'knight', 'bishop', 'rook', 'queen', 'king'].map(pieceType => (
                <button
                  key={pieceType}
                  onClick={() => choosePieceType(pieceType)}
                  style={{
                    padding: '16px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    textTransform: 'capitalize',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#2563eb';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#3b82f6';
                  }}
                >
                  {pieceType.charAt(0).toUpperCase() + pieceType.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Deck Viewer Dialog */}
      {showDeckViewer && (() => {
        const myDeckInfo = getDeckInfo();
        const opponentDeckInfo = getOpponentDeckInfo();
        const opponentColor: Color = currentPlayer === 'white' ? 'black' : 'white';
        
        return (
          <DeckViewerDialog
            myDeck={myDeckInfo.deck}
            myUsed={myDeckInfo.used}
            myColor={currentPlayer}
            opponentDeck={opponentDeckInfo.deck}
            opponentUsed={opponentDeckInfo.used}
            opponentColor={opponentColor}
            onClose={() => setShowDeckViewer(false)}
          />
        );
      })()}

      {/* Card History Panel */}
      <CardHistoryPanel
        history={getPlayHistory()}
        isExpanded={showHistory}
        onToggle={() => setShowHistory(!showHistory)}
      />
      
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
          onBackToMenu={onBackToMenu}
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
              setStatusMessage(`Pawn promoted to ${pieceType}!`);
              setTimeout(() => setStatusMessage(''), 2000);
            }
          }}
        />
      )}
    </div>
  );
};
