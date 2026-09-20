/**
 * useSharedGameState Hook
 * 
 * Manages shared game state synchronized with Firebase Realtime Database
 * for online multiplayer games
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { EnhancedGameController } from '../../cards/enhancedGameController';
import { PlayerView } from '../../cards/gameController/IGameController';
import { Card } from '../../cards/types/card';
import { Color, Position, Move } from '../../core/types';
import { EffectParams, NO_PARAMS } from '../../cards/types/effect';
import {
  subscribeToGameState,
  updateGameState,
  getGameState,
  initializeGameState,
} from '../../services/realtimeGameService';
import {
  serializeGameState,
  deserializeGameState,
} from '../../services/gameStateSerializer';
import { logger } from '../../utils/logger';

export interface UseSharedGameStateReturn {
  // State
  playerView: PlayerView | null;
  hasPendingSpecialCardDecision: boolean;
  pendingSpecialCard: Card | null;
  loading: boolean;
  
  // Actions
  playCard: (cardId: string, params?: EffectParams, isMoveCard?: boolean) => Promise<void>;
  handleSpecialCardDecision: (keepCard: boolean) => Promise<void>;
  
  // Free move actions
  getAvailableMovesForPiece: (from: Position) => Position[];
  makeFreeMove: (move: Move) => Promise<void>;
  
  // Special card actions
  getRetreatatablePawns: () => Position[];
  getBackwardPosition: (pawnPos: Position) => Position;
  choosePieceType: (pieceType: string) => Promise<void>;
  
  // Deck information
  getDeckInfo: () => { deck: readonly Card[]; used: readonly Card[] };
  getOpponentDeckInfo: () => { deck: readonly Card[]; used: readonly Card[] };
  getPlayHistory: () => readonly { player: Color; card: Card; turnNumber: number; isMoveCard: boolean }[];
  
  // Card selection from used pile
  selectCardsFromUsed: (cardIds: string[]) => Promise<void>;
  activateCardFromUsed: (cardId: string) => Promise<void>;
  cancelCardSelection: () => Promise<void>;
  
  // Board actions
  completeSwapPieces: (position1: Position, position2: Position) => Promise<void>;
  completePlaceTrap: (targetPosition: Position) => Promise<void>;
  completeConvertPawn: (targetPosition: Position) => Promise<void>;
  cancelBoardAction: () => Promise<void>;
  
  // Helpers
  refresh: () => void;
}

/**
 * Custom Hook for Shared Game State Management
 * Synchronizes game state via Firebase Realtime Database
 */
export function useSharedGameState(
  matchId: string,
  player: Color,
  whiteDeck?: readonly Card[],
  blackDeck?: readonly Card[]
): UseSharedGameStateReturn {
  const [loading, setLoading] = useState(true);
  const [playerView, setPlayerView] = useState<PlayerView | null>(null);
  const [hasPendingDecision, setHasPendingDecision] = useState(false);
  const [pendingCard, setPendingCard] = useState<Card | null>(null);
  const [controllerReady, setControllerReady] = useState(false);
  
  const controllerRef = useRef<EnhancedGameController | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);
  const isUpdatingRef = useRef(false);

  // Refresh view from controller
  const refreshView = useCallback(() => {
    if (!controllerRef.current) return;

    const newView = controllerRef.current.getPlayerView(player);
    setPlayerView(newView);
    
    const hasPending = controllerRef.current.hasPendingSpecialCardDecision(player);
    setHasPendingDecision(hasPending);
    
    if (hasPending) {
      const card = controllerRef.current.getPendingSpecialCard(player);
      setPendingCard(card);
    } else {
      setPendingCard(null);
    }
  }, [player]);

  // Initialize controller
  useEffect(() => {
    if (!whiteDeck || !blackDeck) {
      logger.debug('⏳ Waiting for decks to initialize controller');
      return;
    }

    const initController = async () => {
      logger.debug('🎮 Initializing game controller', { matchId, player });
      try {
        // Try to load existing state from RTDB
        const onlineState = await getGameState(matchId);
        
        if (onlineState && onlineState.gameState) {
          // Create controller with existing state
          logger.debug('📖 Loaded existing game state from RTDB');
          logger.debug('🔍 Serialized state structure:', {
            hasWhiteHand: !!onlineState.gameState.whiteHand,
            hasBlackHand: !!onlineState.gameState.blackHand,
            whiteHandKeys: onlineState.gameState.whiteHand ? Object.keys(onlineState.gameState.whiteHand) : [],
            blackHandKeys: onlineState.gameState.blackHand ? Object.keys(onlineState.gameState.blackHand) : [],
          });
          
          const controller = new EnhancedGameController(
            undefined,
            undefined,
            whiteDeck,
            blackDeck
          );
          // Deserialize and set the loaded state
          try {
            const deserializedState = deserializeGameState(
              onlineState.gameState,
              whiteDeck,
              blackDeck
            );
            controller.setState(deserializedState);
            controllerRef.current = controller;
            setControllerReady(true);
            logger.debug('✅ Controller initialized from existing state');
          } catch (err) {
            console.error('❌ Failed to deserialize state:', err);
            console.error('📦 Problematic state:', JSON.stringify(onlineState.gameState, null, 2));
            // Fallback: create new controller and save it
            logger.debug('🔄 Falling back to new controller');
            const initialState = controller.getState();
            const serializedState = serializeGameState(initialState);
            await initializeGameState(matchId, serializedState);
            controllerRef.current = controller;
            setControllerReady(true);
            logger.debug('✅ Controller initialized with fallback');
          }
        } else {
          // Create new controller and save initial state
          logger.debug('🆕 Creating new game controller');
          const controller = new EnhancedGameController(
            undefined,
            undefined,
            whiteDeck,
            blackDeck
          );
          controllerRef.current = controller;
          
          // Save initial state to RTDB (serialized)
          const initialState = controller.getState();
          const serializedState = serializeGameState(initialState);
          await initializeGameState(matchId, serializedState);
          setControllerReady(true);
          logger.debug('💾 Saved initial state to RTDB');
          logger.debug('✅ Controller initialized from scratch');
        }
        
        setLoading(false);
        refreshView();
      } catch (err) {
        console.error('❌ Failed to initialize controller:', err);
        // Create new controller on error
        controllerRef.current = new EnhancedGameController(
          undefined,
          undefined,
          whiteDeck,
          blackDeck
        );
        setControllerReady(true);
        setLoading(false);
        refreshView();
        logger.debug('✅ Controller initialized after error');
      }
    };

    initController();
  }, [matchId, whiteDeck, blackDeck, refreshView]);

  // Subscribe to RTDB updates
  useEffect(() => {
    logger.debug('🎯 Subscribe useEffect triggered', {
      hasMatchId: !!matchId,
      controllerReady,
      hasWhiteDeck: !!whiteDeck,
      hasBlackDeck: !!blackDeck,
    });
    
    if (!matchId || !controllerReady) {
      logger.debug('⚠️ Skipping subscribe setup - missing requirements', {
        matchId,
        controllerReady,
      });
      return;
    }

    logger.debug('🔍 Setting up Firebase subscription:', matchId);

    const unsubscribe = subscribeToGameState(matchId, (onlineState) => {
      logger.debug('🔔 Firebase callback triggered', {
        hasState: !!onlineState,
        hasController: !!controllerRef.current,
      });
      
      if (!onlineState || !controllerRef.current) return;

      // Skip if we're currently updating (prevents race conditions during our own update)
      if (isUpdatingRef.current) {
        logger.debug('⏭️ Skipping update - currently updating');
        return;
      }

      const timeSinceLastUpdate = Date.now() - lastUpdateTimeRef.current;
      logger.debug('📨 Received game state update from RTDB', {
        updatedAt: onlineState.updatedAt,
        lastUpdate: lastUpdateTimeRef.current,
        timeDiff: timeSinceLastUpdate,
      });
      
      // Skip if this update is too recent (likely our own update echoing back)
      // Only skip if we made an update recently (within last 200ms)
      if (timeSinceLastUpdate < 200 && lastUpdateTimeRef.current > 0) {
        const ageOfUpdate = Date.now() - onlineState.updatedAt;
        logger.debug('⏭️ Checking if echo update', {
          timeSinceOurUpdate: timeSinceLastUpdate,
          ageOfIncomingUpdate: ageOfUpdate,
        });
        
        // Only skip if the update timestamp is close to our last update
        if (Math.abs(onlineState.updatedAt - lastUpdateTimeRef.current) < 100) {
          logger.debug('⏭️ Confirmed echo - skipping');
          return;
        }
      }
      
      // Validate state structure before deserializing
      if (!onlineState.gameState) {
        console.warn('⚠️ No gameState in update');
        return;
      }
      
      logger.debug('🔍 Validating state structure', {
        hasWhiteHand: !!onlineState.gameState.whiteHand,
        hasBlackHand: !!onlineState.gameState.blackHand,
        whiteHandKeys: onlineState.gameState.whiteHand ? Object.keys(onlineState.gameState.whiteHand) : null,
        blackHandKeys: onlineState.gameState.blackHand ? Object.keys(onlineState.gameState.blackHand) : null,
      });
      
      // Firebase may remove empty arrays, so we need to handle missing hands
      // They will be reconstructed during deserialization
      if (!onlineState.gameState.whiteHand || !onlineState.gameState.blackHand) {
        console.warn('⚠️ Missing hand data in update (will be reconstructed)', {
          hasWhiteHand: !!onlineState.gameState.whiteHand,
          hasBlackHand: !!onlineState.gameState.blackHand,
        });
        // Don't return - let deserializer handle it with defaults
      }
      
      // Deserialize and update controller with new state
      try {
        const deserializedState = deserializeGameState(
          onlineState.gameState,
          whiteDeck as readonly Card[],
          blackDeck as readonly Card[]
        );
        controllerRef.current.setState(deserializedState);
        refreshView();
        logger.debug('✅ Applied state update from RTDB');
      } catch (err) {
        console.error('❌ Failed to deserialize state update:', err);
        console.warn('⚠️ Skipping corrupted state update');
      }
    });

    return () => {
      logger.debug('🔌 Unsubscribing from game state');
      unsubscribe();
    };
  }, [matchId, controllerReady, refreshView, whiteDeck, blackDeck]);


  // Sync state to RTDB
  const syncToRTDB = useCallback(async (action: string, data: any) => {
    if (!controllerRef.current) return;

    try {
      isUpdatingRef.current = true;
      lastUpdateTimeRef.current = Date.now();

      // Get current complete state and serialize it
      const currentState = controllerRef.current.getState();
      const serializedState = serializeGameState(currentState);

      await updateGameState(matchId, serializedState, {
        action: action as any,
        player,
        data,
        timestamp: Date.now(),
      });

      logger.debug('✅ Synced state to RTDB:', action);
    } catch (err) {
      console.error('❌ Failed to sync state:', err);
    } finally {
      // Immediately allow incoming updates after our sync completes
      isUpdatingRef.current = false;
    }
  }, [matchId, player]);

  // Play card
  const playCard = useCallback(async (cardId: string, params: EffectParams = NO_PARAMS, isMoveCard = false) => {
    if (!controllerRef.current) return;

    const result = controllerRef.current.playCardAction(player, cardId, params, isMoveCard);
    
    if (result.success) {
      refreshView();
      await syncToRTDB('card', { cardId, params, isMoveCard });
    }
  }, [player, refreshView, syncToRTDB]);

  // Handle special card decision
  const handleSpecialCardDecision = useCallback(async (keepCard: boolean) => {
    if (!controllerRef.current) return;

    const result = controllerRef.current.handleSpecialCardDecision(player, keepCard);
    
    if (result.success) {
      refreshView();
      await syncToRTDB('decision', { keepCard });
    }
  }, [player, refreshView, syncToRTDB]);

  // Make free move
  const makeFreeMove = useCallback(async (move: Move) => {
    if (!controllerRef.current) return;

    const result = controllerRef.current.makeFreeMove(player, move);
    
    if (result.success) {
      refreshView();
      await syncToRTDB('move', { move });
    }
  }, [player, refreshView, syncToRTDB]);

  // Get available moves for piece
  const getAvailableMovesForPiece = useCallback((from: Position): Position[] => {
    if (!controllerRef.current) return [];
    return controllerRef.current.getAvailableMovesForPiece(player, from);
  }, [player]);

  // Get retreatable pawns
  const getRetreatatablePawns = useCallback((): Position[] => {
    if (!controllerRef.current) return [];
    return controllerRef.current.getRetreatatablePawns(player);
  }, [player]);

  // Get deck info
  const getDeckInfo = useCallback(() => {
    if (!controllerRef.current) {
      return { deck: [] as readonly Card[], used: [] as readonly Card[] };
    }
    return controllerRef.current.getDeckInfo(player);
  }, [player]);

  // Get opponent deck info
  const getOpponentDeckInfo = useCallback(() => {
    if (!controllerRef.current) {
      return { deck: [] as readonly Card[], used: [] as readonly Card[] };
    }
    const opponentColor = player === 'white' ? 'black' : 'white';
    return controllerRef.current.getDeckInfo(opponentColor);
  }, [player]);

  // Get backward position
  const getBackwardPosition = useCallback((pawnPos: Position): Position => {
    if (!controllerRef.current) {
      return pawnPos;
    }
    return controllerRef.current.getBackwardPosition(player, pawnPos);
  }, [player]);

  // Choose piece type (for Focus Strategy)
  const choosePieceType = useCallback(async (pieceType: string) => {
    if (!controllerRef.current) return;

    const result = controllerRef.current.choosePieceType(player, pieceType);
    if (result.success) {
      refreshView();
      await syncToRTDB('choosePieceType', { pieceType });
    }
  }, [player, refreshView, syncToRTDB]);

  // Get play history
  const getPlayHistory = useCallback(() => {
    if (!controllerRef.current) {
      return [] as readonly { player: Color; card: Card; turnNumber: number; isMoveCard: boolean }[];
    }
    return controllerRef.current.getPlayHistory();
  }, []);

  // Select cards from used pile (for Salvage)
  const selectCardsFromUsed = useCallback(async (cardIds: string[]) => {
    if (!controllerRef.current) return;

    const result = controllerRef.current.selectCardsFromUsed(player, cardIds);
    if (result.success) {
      refreshView();
      await syncToRTDB('selectCardsFromUsed', { cardIds });
    }
  }, [player, refreshView, syncToRTDB]);

  // Activate card from used pile (for Recall)
  const activateCardFromUsed = useCallback(async (cardId: string) => {
    if (!controllerRef.current) return;

    const result = controllerRef.current.activateCardFromUsed(player, cardId);
    if (result.success) {
      refreshView();
      await syncToRTDB('activateCardFromUsed', { cardId });
    }
  }, [player, refreshView, syncToRTDB]);

  // Cancel card selection
  const cancelCardSelection = useCallback(async () => {
    if (!controllerRef.current) return;

    const result = controllerRef.current.cancelCardSelection(player);
    if (result.success) {
      refreshView();
      await syncToRTDB('cancelCardSelection', {});
    }
  }, [player, refreshView, syncToRTDB]);

  // Complete swap pieces (for Tactical Reposition)
  const completeSwapPieces = useCallback(async (position1: Position, position2: Position) => {
    if (!controllerRef.current) return;

    const result = controllerRef.current.completeSwapPieces(player, position1, position2);
    if (result.success) {
      refreshView();
      await syncToRTDB('swapPieces', { position1, position2 });
    }
  }, [player, refreshView, syncToRTDB]);

  // Complete place trap (for Trap Field)
  const completePlaceTrap = useCallback(async (targetPosition: Position) => {
    if (!controllerRef.current) return;

    const result = controllerRef.current.completePlaceTrap(player, targetPosition);
    if (result.success) {
      refreshView();
      await syncToRTDB('placeTrap', { targetPosition });
    }
  }, [player, refreshView, syncToRTDB]);

  // Complete convert pawn (for Conversion)
  const completeConvertPawn = useCallback(async (targetPosition: Position) => {
    if (!controllerRef.current) return;

    const result = controllerRef.current.completeConvertPawn(player, targetPosition);
    if (result.success) {
      refreshView();
      await syncToRTDB('convertPawn', { targetPosition });
    }
  }, [player, refreshView, syncToRTDB]);

  // Cancel board action
  const cancelBoardAction = useCallback(async () => {
    if (!controllerRef.current) return;

    const result = controllerRef.current.cancelBoardAction(player);
    if (result.success) {
      refreshView();
      await syncToRTDB('cancelBoardAction', {});
    }
  }, [player, refreshView, syncToRTDB]);

  return {
    playerView,
    hasPendingSpecialCardDecision: hasPendingDecision,
    pendingSpecialCard: pendingCard,
    loading,
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
    refresh: refreshView,
  };
}
