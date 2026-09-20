/**
 * OnlineMultiplayerGameView Component
 * 
 * Online multiplayer view with Realtime Database synchronization
 * Each player sees only their own perspective
 * Full feature parity with hot seat multiplayer mode
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { BoardComponent } from './Board';
import { DualHand } from './Card';
import { SpecialCardDecisionDialog } from './SpecialCardDecisionDialog';
import { CardSelectionDialog } from './CardSelectionDialog';
import { DeckViewerDialog } from './DeckViewerDialog';
import { CardHistoryPanel } from './CardHistoryPanel';
import { GameOverDialog } from './GameOverDialog';
import { PawnPromotionDialog } from './PawnPromotionDialog';
import {
  subscribeToMatch,
} from '../../services/matchService';
import { Color, Position, Move, PieceType } from '../../core/types';
import { Card } from '../../cards/types/card';
import { useSharedGameState } from '../hooks/useSharedGameState';
import { NO_PARAMS } from '../../cards/types/effect';

/**
 * Extract move positions from move card
 */
function getMovePositionsFromCard(card: Card): { from: Position; to: Position } | null {
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

export const OnlineMultiplayerGameView: React.FC = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playerColor, setPlayerColor] = useState<Color | null>(null);
  const [playerDecks, setPlayerDecks] = useState<{ white: Card[]; black: Card[] } | null>(null);

  // Subscribe to match to get player colors and decks
  useEffect(() => {
    if (!matchId || !user) return;

    console.log('🎮 Subscribing to match:', matchId);

    const unsubscribe = subscribeToMatch(matchId, (matchData) => {
      if (!matchData) {
        setError('Match not found');
        setLoading(false);
        return;
      }

      console.log('📨 Match update:', { matchId, status: matchData.status });

      // Determine player color
      const color = matchData.players[0] === user.uid ? 'white' : 'black';
      setPlayerColor(color);
      console.log('🎨 Player color:', color);

      // Get decks
      if (matchData.playerDecks) {
        const whiteUid = matchData.players[0];
        const blackUid = matchData.players[1];
        
        const whiteDeck = matchData.playerDecks[whiteUid]?.cards || [];
        const blackDeck = matchData.playerDecks[blackUid]?.cards || [];

        setPlayerDecks({ white: whiteDeck, black: blackDeck });
        console.log('🃏 Player decks loaded');
      }

      setLoading(false);
    });

    return () => {
      console.log('🔌 Unsubscribing from match');
      unsubscribe();
    };
  }, [matchId, user]);

  // Use shared game state hook
  const gameState = useSharedGameState(
    matchId || '',
    playerColor || 'white',
    playerDecks?.white,
    playerDecks?.black
  );

  const {
    playerView,
    hasPendingSpecialCardDecision,
    pendingSpecialCard,
    loading: gameLoading,
    playCard,
    handleSpecialCardDecision,
    getAvailableMovesForPiece,
    makeFreeMove,
    getDeckInfo,
    getOpponentDeckInfo,
    getRetreatatablePawns,
    getBackwardPosition,
    choosePieceType,
    getPlayHistory,
    selectCardsFromUsed,
    activateCardFromUsed,
    cancelCardSelection,
    completeSwapPieces,
    completePlaceTrap,
    completeConvertPawn,
    cancelBoardAction,
  } = gameState;

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
  const [selectedPawnForRetreat, setSelectedPawnForRetreat] = useState<Position | null>(null);
  const [retreatPosition, setRetreatPosition] = useState<Position | null>(null);
  const [retreatablePawns, setRetreatablePawns] = useState<Position[]>([]);
  
  // Board action state (for Tactical Reposition, Trap Field, Conversion)
  const [firstPiecePos, setFirstPiecePos] = useState<Position | null>(null);
  
  // Pawn promotion state
  const [pendingPromotion, setPendingPromotion] = useState<{ move: Move; color: Color } | null>(null);

  // No need for refresh interval - Firebase handles real-time updates via subscribeToGameState
  // The refresh() is only needed if we want to re-render without state changes

  if (loading || gameLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#0f172a',
        color: 'white',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '16px' }}>Loading game...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#0f172a',
        color: 'white',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '16px', color: '#ef4444' }}>{error}</div>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '12px 24px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  if (!playerView) {
    return null;
  }

  const isMyTurn = playerView.currentPlayer === playerColor;
  const deckInfo = getDeckInfo();
  const opponentDeckInfo = getOpponentDeckInfo();
  const gameOver = playerView.status === 'checkmate' || 
                   playerView.status === 'stalemate' || 
                   playerView.status === 'draw' || 
                   playerView.status === 'resigned';

  const handleBackToMenu = () => {
    navigate('/');
  };

  const handleMoveCardSelect = (cardId: string, _index: number) => {
    setSelectedMoveCard(cardId === selectedMoveCard ? null : cardId);
    setSelectedSpecialCard(null);
  };

  const handleSpecialCardSelect = (cardId: string, _index: number) => {
    setSelectedSpecialCard(cardId === selectedSpecialCard ? null : cardId);
    setSelectedMoveCard(null);
  };

  const handlePlayCard = async () => {
    if (selectedMoveCard) {
      const card = playerView.myHand.moveCards.find(c => c.id === selectedMoveCard);
      if (!card) return;
      
      await playCard(selectedMoveCard, NO_PARAMS, true);
      setSelectedMoveCard(null);
      setStatusMessage('Move card played!');
      setTimeout(() => setStatusMessage(''), 2000);
    } else if (selectedSpecialCard) {
      const card = playerView.myHand.specialCards.find(c => c.id === selectedSpecialCard);
      if (!card) return;
      
      // Special handling for cards that need UI interaction
      if (card.id.startsWith('free-move-')) {
        // Wild Card - enable free move mode
        await playCard(selectedSpecialCard, NO_PARAMS, false);
        setSelectedSpecialCard(null);
        setStatusMessage(`${card.name}: Click on any piece to move`);
        setTimeout(() => setStatusMessage(''), 3000);
        return;
      }
      
      if (card.id.startsWith('move-backward-')) {
        // Tactical Retreat - enter retreat mode
        const pawns = getRetreatatablePawns();
        if (pawns.length === 0) {
          setStatusMessage('No pawns can retreat!');
          setTimeout(() => setStatusMessage(''), 2000);
          return;
        }
        await playCard(selectedSpecialCard, NO_PARAMS, false);
        setSelectedSpecialCard(null);
        setRetreatMode(true);
        setRetreatablePawns(pawns);
        setStatusMessage(`${card.name}: Select a pawn to move backwards`);
        return;
      }
      
      if (card.id.startsWith('spawn-pawn-') || card.id.startsWith('spawn-piece-')) {
        // Reinforcements - enter spawn mode (don't play card yet)
        setSelectedSpecialCard(null);
        setSpawnMode(true);
        setSpawnCardId(card.id);
        setStatusMessage(`${card.name}: Select an allied pawn to spawn a piece adjacent to it`);
        return;
      }
      
      if (card.id.startsWith('focus-strategy-')) {
        // Focus Strategy - play card, dialog will show automatically
        await playCard(selectedSpecialCard, NO_PARAMS, false);
        setSelectedSpecialCard(null);
        return;
      }
      
      // Default: Play card normally
      await playCard(selectedSpecialCard, NO_PARAMS, false);
      setSelectedSpecialCard(null);
      setStatusMessage('Special card played!');
      setTimeout(() => setStatusMessage(''), 2000);
    }
  };

  const handleBoardClick = async (position: Position) => {
    if (!isMyTurn) return;

    const piece = playerView.board[position.row][position.col];

    // Board action mode (Tactical Reposition, Trap Field, Conversion)
    if (playerView.pendingBoardAction) {
      const action = playerView.pendingBoardAction.action;
      
      if (action === 'swapPieces') {
        if (!firstPiecePos) {
          if (piece && piece.color === playerColor) {
            setFirstPiecePos(position);
            setStatusMessage(`First piece selected - click another piece to swap`);
          } else {
            setStatusMessage(`Please select one of your pieces`);
          }
        } else {
          if (piece && piece.color === playerColor) {
            await completeSwapPieces(firstPiecePos, position);
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
        if (!piece) {
          await completePlaceTrap(position);
          setStatusMessage(`Trap placed!`);
          setTimeout(() => setStatusMessage(''), 2000);
        } else {
          setStatusMessage(`Please select an empty square`);
        }
        return;
      }
      
      if (action === 'convertPawn') {
        if (piece && piece.type === 'pawn' && piece.color !== playerColor) {
          await completeConvertPawn(position);
          setStatusMessage(`Pawn converted!`);
          setTimeout(() => setStatusMessage(''), 2000);
        } else {
          setStatusMessage(`Please select an opponent's pawn`);
        }
        return;
      }
    }
    
    // Spawn mode
    if (spawnMode) {
      if (!selectedPawnForSpawn) {
        if (piece && piece.type === 'pawn' && piece.color === playerColor) {
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
          setStatusMessage('Pawn selected - click an adjacent empty square to spawn');
        } else {
          setStatusMessage('Please select one of your pawns');
        }
      } else if (spawnPositions.some(p => p.row === position.row && p.col === position.col)) {
        // Execute spawn with the card
        if (spawnCardId) {
          await playCard(spawnCardId, { 
            type: 'spawn', 
            targetPosition: position,
            pieceType: 'pawn'
          } as any, false);
          
          setSpawnMode(false);
          setSpawnCardId(null);
          setSelectedPawnForSpawn(null);
          setSpawnPositions([]);
          setStatusMessage('Pawn spawned!');
          setTimeout(() => setStatusMessage(''), 2000);
        }
      }
      return;
    }
    
    // Retreat mode
    if (retreatMode) {
      if (!selectedPawnForRetreat) {
        if (retreatablePawns.some(p => p.row === position.row && p.col === position.col)) {
          setSelectedPawnForRetreat(position);
          const backPos = getBackwardPosition(position);
          setRetreatPosition(backPos);
        }
      } else if (retreatPosition && position.row === retreatPosition.row && position.col === retreatPosition.col) {
        const move: Move = {
          from: selectedPawnForRetreat,
          to: retreatPosition,
          piece: playerView.board[selectedPawnForRetreat.row][selectedPawnForRetreat.col]!,
        };
        await makeFreeMove(move);
        setRetreatMode(false);

        setSelectedPawnForRetreat(null);
        setRetreatPosition(null);
        setRetreatablePawns([]);
        setStatusMessage('Pawn retreated!');
        setTimeout(() => setStatusMessage(''), 2000);
      }
      return;
    }
    
    // Free move mode
    if (playerView.freeMoveEnabled) {
      if (!selectedPiecePos) {
        if (piece && piece.color === playerColor) {
          setSelectedPiecePos(position);
          const moves = getAvailableMovesForPiece(position);
          setAvailableMoves(moves);
        }
      } else {
        const isValidMove = availableMoves.some(m => m.row === position.row && m.col === position.col);
        if (isValidMove) {
          const movingPiece = playerView.board[selectedPiecePos.row][selectedPiecePos.col];
          if (movingPiece) {
            const move: Move = {
              from: selectedPiecePos,
              to: position,
              piece: movingPiece,
              capturedPiece: piece || undefined,
            };
            
            // Check for pawn promotion
            if (movingPiece.type === 'pawn') {
              const isPromotion = (movingPiece.color === 'white' && position.row === 7) ||
                                (movingPiece.color === 'black' && position.row === 0);
              if (isPromotion) {
                setPendingPromotion({ move, color: movingPiece.color });
                setSelectedPiecePos(null);
                setAvailableMoves([]);
                return;
              }
            }
            
            await makeFreeMove(move);
            setSelectedPiecePos(null);
            setAvailableMoves([]);
            setStatusMessage('Move completed!');
            setTimeout(() => setStatusMessage(''), 2000);
          }
        } else {
          setSelectedPiecePos(null);
          setAvailableMoves([]);
        }
      }
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0f172a',
      color: 'white',
      padding: '20px',
    }}>
      {/* Header */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <h2 style={{ margin: 0 }}>
          Online Multiplayer - Playing as {playerColor === 'white' ? 'White ♔' : 'Black ♚'}
        </h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setShowDeckViewer(true)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#475569',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            View Decks
          </button>
          <button
            onClick={handleBackToMenu}
            style={{
              padding: '8px 16px',
              backgroundColor: '#475569',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Back to Menu
          </button>
        </div>
      </div>

      {/* Game Area */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'flex',
        gap: '20px',
        justifyContent: 'center',
      }}>
        {/* Left Panel - Opponent Info */}
        <div style={{ width: '250px' }}>
          <div
            style={{
              padding: '16px',
              backgroundColor: '#1e293b',
              borderRadius: '8px',
              border: '2px solid #334155',
              marginBottom: '16px',
            }}
          >
            <h3 style={{ margin: '0 0 12px 0' }}>Opponent</h3>
            <div style={{ fontSize: '14px', color: '#94a3b8' }}>
              <div>Hand: {playerView.opponentHandSize} cards</div>
              <div>Deck: {opponentDeckInfo.deck.length} cards</div>
              <div>Used: {opponentDeckInfo.used.length} cards</div>
            </div>
          </div>

          {/* Turn Indicator */}
          <div
            style={{
              padding: '16px',
              backgroundColor: isMyTurn ? '#16a34a' : '#dc2626',
              borderRadius: '8px',
              textAlign: 'center',
              fontWeight: 'bold',
              fontSize: '16px',
            }}
          >
            {isMyTurn ? "Your Turn" : "Opponent's Turn"}
          </div>
        </div>

        {/* Center - Board */}
        <div>
          <BoardComponent
            board={playerView.board}
            highlightedSquares={(() => {
              const highlighted: Position[] = [];
              
              // Highlight for board actions
              if (playerView.pendingBoardAction) {
                if (firstPiecePos) {
                  highlighted.push(firstPiecePos);
                }
                // For swap mode, highlight all own pieces
                if (playerView.pendingBoardAction.action === 'swapPieces') {
                  for (let row = 0; row < 8; row++) {
                    for (let col = 0; col < 8; col++) {
                      const piece = playerView.board[row][col];
                      if (piece && piece.color === playerColor) {
                        highlighted.push({ row, col });
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
                        highlighted.push({ row, col });
                      }
                    }
                  }
                }
                // For convert mode, highlight opponent pawns
                if (playerView.pendingBoardAction.action === 'convertPawn') {
                  const opponentColor = playerColor === 'white' ? 'black' : 'white';
                  for (let row = 0; row < 8; row++) {
                    for (let col = 0; col < 8; col++) {
                      const piece = playerView.board[row][col];
                      if (piece && piece.type === 'pawn' && piece.color === opponentColor) {
                        highlighted.push({ row, col });
                      }
                    }
                  }
                }
              } else if (retreatMode && retreatablePawns.length > 0) {
                // Highlight all retreatable pawns
                highlighted.push(...retreatablePawns);
                // Highlight the retreat position if a pawn is selected
                if (selectedPawnForRetreat && retreatPosition) {
                  highlighted.push(retreatPosition);
                }
              } else if (spawnMode && spawnPositions.length > 0) {
                highlighted.push(...spawnPositions);
                if (selectedPawnForSpawn) {
                  highlighted.push(selectedPawnForSpawn);
                }
              } else if (playerView.freeMoveEnabled && availableMoves.length > 0) {
                // Wild Card mode - highlight available moves
                highlighted.push(...availableMoves);
                if (selectedPiecePos) {
                  highlighted.push(selectedPiecePos);
                }
              } else if (selectedMoveCard && playerView?.myHand?.moveCards) {
                // Highlight the from and to positions of the selected move card
                const card = playerView.myHand.moveCards.find(c => c.id === selectedMoveCard);
                if (card) {
                  const movePos = getMovePositionsFromCard(card);
                  if (movePos) {
                    highlighted.push(movePos.from);
                    highlighted.push(movePos.to);
                  }
                }
              }
              
              return highlighted;
            })()}
            onSquareClick={handleBoardClick}
          />
        </div>

        {/* Right Panel - Player Info */}
        <div style={{ width: '250px' }}>
          <div
            style={{
              padding: '16px',
              backgroundColor: '#1e293b',
              borderRadius: '8px',
              border: '2px solid #334155',
            }}
          >
            <h3 style={{ margin: '0 0 12px 0' }}>You</h3>
            <div style={{ fontSize: '14px', color: '#94a3b8' }}>
              <div>Deck: {deckInfo.deck.length} cards</div>
              <div>Used: {deckInfo.used.length} cards</div>
            </div>
          </div>
        </div>
      </div>

      {/* Hand */}
      <div style={{ marginTop: '20px', maxWidth: '1400px', margin: '20px auto 0' }}>
        {statusMessage && (
          <div style={{
            padding: '12px',
            backgroundColor: '#1e40af',
            color: 'white',
            borderRadius: '6px',
            textAlign: 'center',
            marginBottom: '16px',
            fontWeight: '500',
          }}>
            {statusMessage}
          </div>
        )}
        
        {/* Active Mode Banners */}
        {playerView.pendingBoardAction && (
          <div style={{
            marginBottom: '16px',
            padding: '12px',
            backgroundColor: '#dc2626',
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
              onClick={async () => {
                await cancelBoardAction();
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
          onMoveCardClick={isMyTurn && !playerView.freeMoveEnabled && !spawnMode && !retreatMode ? handleMoveCardSelect : undefined}
          onSpecialCardClick={isMyTurn && !playerView.freeMoveEnabled && !spawnMode && !retreatMode ? handleSpecialCardSelect : undefined}
          selectedCardId={selectedMoveCard || selectedSpecialCard || undefined}
        />
        
        {isMyTurn && !playerView.freeMoveEnabled && !spawnMode && !retreatMode && (selectedMoveCard || selectedSpecialCard) && (
          <button
            onClick={handlePlayCard}
            style={{
              width: '100%',
              marginTop: '16px',
              padding: '12px',
              backgroundColor: playerColor === 'white' ? '#3b82f6' : '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
            }}
          >
            Play Card
          </button>
        )}
      </div>

      {/* Dialogs */}
      {hasPendingSpecialCardDecision && pendingSpecialCard && (
        <SpecialCardDecisionDialog
          card={pendingSpecialCard}
          onKeep={async () => await handleSpecialCardDecision(true)}
          onShuffleBack={async () => await handleSpecialCardDecision(false)}
        />
      )}

      {showDeckViewer && (() => {
        const opponentColor: Color = playerColor === 'white' ? 'black' : 'white';
        return (
          <DeckViewerDialog
            myDeck={deckInfo.deck}
            myUsed={deckInfo.used}
            myColor={playerColor!}
            opponentDeck={opponentDeckInfo.deck}
            opponentUsed={opponentDeckInfo.used}
            opponentColor={opponentColor}
            onClose={() => setShowDeckViewer(false)}
          />
        );
      })()}

      <CardHistoryPanel
        history={getPlayHistory()}
        isExpanded={showHistory}
        onToggle={() => setShowHistory(!showHistory)}
      />
      
      {playerView.pendingCardSelection && (
        <CardSelectionDialog
          cards={getDeckInfo().used.filter(card => {
            return card.id !== playerView.pendingCardSelection?.triggeringCardId;
          })}
          action={playerView.pendingCardSelection.action}
          maxCount={playerView.pendingCardSelection.maxCount}
          onConfirm={async (selectedCardIds) => {
            if (playerView.pendingCardSelection?.action === 'recover') {
              await selectCardsFromUsed(selectedCardIds);
            } else if (playerView.pendingCardSelection?.action === 'activate') {
              await activateCardFromUsed(selectedCardIds[0]);
            }
          }}
          onCancel={async () => {
            await cancelCardSelection();
          }}
        />
      )}
      
      {gameOver && (
        <GameOverDialog
          status={playerView.status}
          winner={playerView.status === 'checkmate' || playerView.status === 'resigned'
            ? (playerView.currentPlayer === 'white' ? 'black' : 'white')
            : undefined
          }
          onNewGame={handleBackToMenu}
          onBackToMenu={handleBackToMenu}
        />
      )}
      
      {pendingPromotion && (
        <PawnPromotionDialog
          color={pendingPromotion.color}
          onChoose={async (pieceType: PieceType) => {
            if (pendingPromotion) {
              const moveWithPromotion: Move = {
                ...pendingPromotion.move,
                promotion: pieceType,
              };
              await makeFreeMove(moveWithPromotion);
              setPendingPromotion(null);
              setStatusMessage(`Pawn promoted to ${pieceType}!`);
              setTimeout(() => setStatusMessage(''), 2000);
            }
          }}
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
                  onClick={async () => await choosePieceType(pieceType as PieceType)}
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
    </div>
  );
};
