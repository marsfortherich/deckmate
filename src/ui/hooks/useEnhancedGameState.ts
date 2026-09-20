/**
 * Custom Hook: useEnhancedGameState
 * 
 * Enhanced version with deck-building support
 */

import { useState, useCallback, useMemo } from 'react';
import { EnhancedGameController } from '../../cards/enhancedGameController.js';
import { PlayerView } from '../../cards/gameController/IGameController.js';
import { Card } from '../../cards/types/card.js';
import { Color, Position, Move } from '../../core/index.js';
import { EffectParams, NO_PARAMS } from '../../cards/types/effect.js';

/**
 * Enhanced Game State Hook Return Type
 */
export interface UseEnhancedGameStateReturn {
  // State
  playerView: PlayerView;
  hasPendingSpecialCardDecision: boolean;
  pendingSpecialCard: Card | null;
  
  // Actions
  playCard: (cardId: string, params?: EffectParams, isMoveCard?: boolean) => void;
  handleSpecialCardDecision: (keepCard: boolean) => void;
  
  // Free move actions
  getAvailableMovesForPiece: (from: Position) => Position[];
  makeFreeMove: (move: Move) => void;
  
  // Special card actions
  getRetreatatablePawns: () => Position[];
  getBackwardPosition: (pawnPos: Position) => Position;
  choosePieceType: (pieceType: string) => void;
  
  // Deck information
  getDeckInfo: () => { deck: readonly Card[]; used: readonly Card[] };
  getOpponentDeckInfo: () => { deck: readonly Card[]; used: readonly Card[] };
  getPlayHistory: () => readonly { player: Color; card: Card; turnNumber: number; isMoveCard: boolean }[];
  
  // Card selection from used pile
  selectCardsFromUsed: (cardIds: string[]) => void;
  activateCardFromUsed: (cardId: string) => void;
  cancelCardSelection: () => void;
  
  // Board actions
  completeSwapPieces: (position1: Position, position2: Position) => void;
  completePlaceTrap: (targetPosition: Position) => void;
  completeConvertPawn: (targetPosition: Position) => void;
  cancelBoardAction: () => void;
  
  // Helpers
  refresh: () => void;
}

/**
 * Custom Hook for Enhanced Game State Management with Deck Building
 * 
 * @param player - Player color (white/black)
 * @param whiteDeck - Optional white player's custom deck
 * @param blackDeck - Optional black player's custom deck
 * @returns Game state and actions
 */
export function useEnhancedGameState(
  player: Color,
  whiteDeck?: readonly Card[],
  blackDeck?: readonly Card[]
): UseEnhancedGameStateReturn {
  // Controller: Create with custom decks
  const controller = useMemo(
    () => new EnhancedGameController(undefined, undefined, whiteDeck, blackDeck),
    [whiteDeck, blackDeck]
  );
  
  // State: PlayerView from controller
  const [playerView, setPlayerView] = useState<PlayerView>(() =>
    controller.getPlayerView(player)
  );
  
  const [hasPendingDecision, setHasPendingDecision] = useState<boolean>(false);
  const [pendingCard, setPendingCard] = useState<Card | null>(null);
  
  /**
   * Refresh: Get current view from controller
   */
  const refresh = useCallback(() => {
    const newView = controller.getPlayerView(player);
    setPlayerView(newView);
    
    // Check for pending special card decision
    const hasPending = controller.hasPendingSpecialCardDecision(player);
    setHasPendingDecision(hasPending);
    
    if (hasPending) {
      const card = controller.getPendingSpecialCard(player);
      setPendingCard(card);
    } else {
      setPendingCard(null);
    }
  }, [controller, player]);
  
  /**
   * Play a card
   */
  const playCard = useCallback(
    (cardId: string, params: EffectParams = NO_PARAMS, isMoveCard: boolean = true) => {
      const result = controller.playCardAction(player, cardId, params, isMoveCard);
      
      if (result.success) {
        refresh();
      } else {
        console.error('Failed to play card:', result.message);
      }
    },
    [controller, player, refresh]
  );
  
  /**
   * Handle special card keep/discard decision
   */
  const handleSpecialCardDecision = useCallback(
    (keepCard: boolean) => {
      const result = controller.handleSpecialCardDecision(player, keepCard);
      
      if (result.success) {
        refresh();
      } else {
        console.error('Failed to handle special card decision:', result.message);
      }
    },
    [controller, player, refresh]
  );
  
  /**
   * Get available moves for a piece (when free move is active)
   */
  const getAvailableMovesForPiece = useCallback(
    (from: Position): Position[] => {
      return controller.getAvailableMovesForPiece(player, from);
    },
    [controller, player]
  );
  
  /**
   * Make a free move
   */
  const makeFreeMove = useCallback(
    (move: Move) => {
      const result = controller.makeFreeMove(player, move);
      
      if (result.success) {
        refresh();
      } else {
        console.error('Failed to make free move:', result.message);
      }
    },
    [controller, player, refresh]
  );

  /**
   * Get pawns that can move backwards
   */
  const getRetreatatablePawns = useCallback(
    (): Position[] => {
      return controller.getRetreatatablePawns(player);
    },
    [controller, player]
  );

  /**
   * Get backward position for a pawn
   */
  const getBackwardPosition = useCallback(
    (pawnPos: Position): Position => {
      return controller.getBackwardPosition(player, pawnPos);
    },
    [controller, player]
  );

  /**
   * Choose piece type for Focus Strategy
   */
  const choosePieceType = useCallback(
    (pieceType: string) => {
      const result = controller.choosePieceType(player, pieceType);
      
      if (result.success) {
        refresh();
      } else {
        console.error('Failed to choose piece type:', result.message);
      }
    },
    [controller, player, refresh]
  );

  /**
   * Get deck information
   */
  const getDeckInfo = useCallback(
    () => {
      return controller.getDeckInfo(player);
    },
    [controller, player]
  );

  /**
   * Get opponent's deck information
   */
  const getOpponentDeckInfo = useCallback(
    () => {
      return controller.getOpponentDeckInfo(player);
    },
    [controller, player]
  );

  /**
   * Get play history
   */
  const getPlayHistory = useCallback(
    () => {
      return controller.getPlayHistory();
    },
    [controller]
  );

  /**
   * Select cards from used pile to recover
   */
  const selectCardsFromUsed = useCallback(
    (cardIds: string[]) => {
      const result = controller.selectCardsFromUsed(player, cardIds);
      
      if (result.success) {
        refresh();
      } else {
        console.error('Failed to select cards from used:', result.message);
      }
    },
    [controller, player, refresh]
  );

  /**
   * Activate a card from used pile
   */
  const activateCardFromUsed = useCallback(
    (cardId: string) => {
      const result = controller.activateCardFromUsed(player, cardId);
      
      if (result.success) {
        refresh();
      } else {
        console.error('Failed to activate card from used:', result.message);
      }
    },
    [controller, player, refresh]
  );

  /**
   * Cancel card selection from used pile
   */
  const cancelCardSelection = useCallback(
    () => {
      const result = controller.cancelCardSelection(player);
      
      if (result.success) {
        refresh();
      } else {
        console.error('Failed to cancel card selection:', result.message);
      }
    },
    [controller, player, refresh]
  );

  /**
   * Complete swap pieces action
   */
  const completeSwapPieces = useCallback(
    (position1: Position, position2: Position) => {
      const result = controller.completeSwapPieces(player, position1, position2);
      
      if (result.success) {
        refresh();
      } else {
        console.error('Failed to swap pieces:', result.message);
      }
    },
    [controller, player, refresh]
  );

  /**
   * Complete place trap action
   */
  const completePlaceTrap = useCallback(
    (targetPosition: Position) => {
      const result = controller.completePlaceTrap(player, targetPosition);
      
      if (result.success) {
        refresh();
      } else {
        console.error('Failed to place trap:', result.message);
      }
    },
    [controller, player, refresh]
  );

  /**
   * Complete convert pawn action
   */
  const completeConvertPawn = useCallback(
    (targetPosition: Position) => {
      const result = controller.completeConvertPawn(player, targetPosition);
      
      if (result.success) {
        refresh();
      } else {
        console.error('Failed to convert pawn:', result.message);
      }
    },
    [controller, player, refresh]
  );

  /**
   * Cancel board action
   */
  const cancelBoardAction = useCallback(
    () => {
      const result = controller.cancelBoardAction(player);
      
      if (result.success) {
        refresh();
      } else {
        console.error('Failed to cancel board action:', result.message);
      }
    },
    [controller, player, refresh]
  );
  
  return {
    playerView,
    hasPendingSpecialCardDecision: hasPendingDecision,
    pendingSpecialCard: pendingCard,
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
  };
}
