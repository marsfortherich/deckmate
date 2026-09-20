/**
 * Game State Serializer
 * 
 * Handles serialization/deserialization of EnhancedGameState for Firebase Realtime Database.
 * Firebase doesn't support functions, so we need to strip/restore Card objects.
 */

import { EnhancedGameState } from '../cards/enhancedGameController';
import { Card } from '../cards/types/card';
import { GameState, Position, PieceType } from '../core/types';
import { PlayerHand } from '../cards/moveCards/handManagerV2';
import { createMoveCard } from '../cards/moveCards/moveCardGenerator';
import { logger } from '../utils/logger';

/**
 * Serializable version of EnhancedGameState
 * Cards are stored as IDs only (special cards) or move data (move cards)
 * Functions are removed for Firebase compatibility
 */
export interface SerializedGameState {
  gameState: GameState;
  whiteHand: {
    moveCards: SerializedMoveCard[];  // Store move data, not Card objects
    specialCardIds: string[];
  };
  blackHand: {
    moveCards: SerializedMoveCard[];
    specialCardIds: string[];
  };
  whiteDeck: {
    deckCardIds: string[];
    usedCardIds: string[];
  };
  blackDeck: {
    deckCardIds: string[];
    usedCardIds: string[];
  };
  pendingSpecialCardDecision: {
    player: string;
    cardId: string;
  } | null;
  whiteDrawModifier: number;
  blackDrawModifier: number;
  skipNextTurn: string | null;
  skipTurnAfterNext: string | null;
  freeMoveEnabled: string | null;
  whiteFocusedPieceType: string | null;
  blackFocusedPieceType: string | null;
  pendingPieceTypeChoice: {
    player: string;
    cardId: string;
  } | null;
  pendingCardSelection: {
    player: string;
    action: 'recover' | 'activate';
    maxCount: number;
    triggeringCardId: string;
  } | null;
  pendingBoardAction: {
    player: string;
    action: 'swapPieces' | 'placeTrap' | 'convertPawn';
    cardId: string;
  } | null;
  playHistory: {
    player: string;
    cardId: string;
    turnNumber: number;
    isMoveCard: boolean;
  }[];
}

/**
 * Serialized move card (stores move data instead of Card object)
 */
export interface SerializedMoveCard {
  id: string;
  name: string;
  description: string;
  from: { row: number; col: number };
  to: { row: number; col: number };
  pieceType: string;
  isCapture: boolean;
  promotion?: string;  // For pawn promotion
}

/**
 * Create a card lookup map from deck
 */
function createCardLookup(deck: readonly Card[]): Map<string, Card> {
  const lookup = new Map<string, Card>();
  for (const card of deck) {
    lookup.set(card.id, card);
  }
  return lookup;
}

/**
 * Serialize a move card to serializable format
 */
function serializeMoveCard(card: Card): SerializedMoveCard {
  // Extract move data from card ID (format: move-a2-a4 or move-a2-a4-queen)
  const parts = card.id.split('-');
  const fromAlg = parts[1]; // e.g. "a2"
  const toAlg = parts[2];   // e.g. "a4"
  const promotion = parts.length > 3 ? parts[3] : null;
  
  // Convert algebraic notation to position
  const from = algebraicToPosition(fromAlg);
  const to = algebraicToPosition(toAlg);
  
  const serialized: SerializedMoveCard = {
    id: card.id,
    name: card.name,
    description: card.description,
    from,
    to,
    pieceType: '', // Will be determined from board when deserializing
    isCapture: card.description.includes('captures'),
  };
  
  // Only add promotion if it exists (Firebase doesn't like undefined)
  if (promotion) {
    serialized.promotion = promotion;
  }
  
  return serialized;
}

/**
 * Convert algebraic notation to position
 * Board is stored with white at bottom (row 0 = rank 1, row 7 = rank 8)
 */
function algebraicToPosition(algebraic: string): { row: number; col: number } {
  const col = algebraic.charCodeAt(0) - 'a'.charCodeAt(0);
  const row = parseInt(algebraic[1]) - 1;  // rank 2 = row index 1
  return { row, col };
}

/**
 * Clean object by removing undefined values (Firebase doesn't allow undefined)
 * Recursively processes nested objects and arrays
 */
function cleanUndefined(obj: any): any {
  if (obj === null || obj === undefined) {
    return null;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(cleanUndefined);
  }
  
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const key in obj) {
      if (obj[key] !== undefined) {
        cleaned[key] = cleanUndefined(obj[key]);
      }
    }
    return cleaned;
  }
  
  return obj;
}

/**
 * Serialize EnhancedGameState to a Firebase-safe format
 */
export function serializeGameState(
  state: EnhancedGameState
): SerializedGameState {
  logger.debug('🔍 Serializing state - move cards:', {
    whiteMoveCards: state.whiteHand.moveCards.length,
    blackMoveCards: state.blackHand.moveCards.length,
  });
  
  // Build the serialized state
  const serialized = {
    gameState: state.gameState,
    whiteHand: {
      moveCards: state.whiteHand.moveCards.map(serializeMoveCard),
      specialCardIds: state.whiteHand.specialCards.map(c => c.id),
    },
    blackHand: {
      moveCards: state.blackHand.moveCards.map(serializeMoveCard),
      specialCardIds: state.blackHand.specialCards.map(c => c.id),
    },
    whiteDeck: {
      deckCardIds: state.whiteDeck.deck.map(c => c.id),
      usedCardIds: state.whiteDeck.used.map(c => c.id),
    },
    blackDeck: {
      deckCardIds: state.blackDeck.deck.map(c => c.id),
      usedCardIds: state.blackDeck.used.map(c => c.id),
    },
    pendingSpecialCardDecision: state.pendingSpecialCardDecision ? {
      player: state.pendingSpecialCardDecision.player,
      cardId: state.pendingSpecialCardDecision.card.id,
    } : null,
    whiteDrawModifier: state.whiteDrawModifier,
    blackDrawModifier: state.blackDrawModifier,
    skipNextTurn: state.skipNextTurn,
    skipTurnAfterNext: state.skipTurnAfterNext,
    freeMoveEnabled: state.freeMoveEnabled,
    whiteFocusedPieceType: state.whiteFocusedPieceType,
    blackFocusedPieceType: state.blackFocusedPieceType,
    pendingPieceTypeChoice: state.pendingPieceTypeChoice,
    pendingCardSelection: state.pendingCardSelection,
    pendingBoardAction: state.pendingBoardAction,
    playHistory: state.playHistory.map(h => ({
      player: h.player,
      cardId: h.card.id,
      turnNumber: h.turnNumber,
      isMoveCard: h.isMoveCard,
    })),
  };
  
  // Clean all undefined values (Firebase doesn't allow undefined)
  const cleaned = cleanUndefined(serialized) as SerializedGameState;

  // `cleanUndefined` walks the whole tree, and a board that comes back as an
  // object instead of an array is the failure mode worth catching here.
  if (!Array.isArray(cleaned.gameState.boardState.board)) {
    logger.error('Serialization corrupted the board: expected an array', {
      received: typeof cleaned.gameState.boardState.board,
    });
  }

  return cleaned;
}

/**
 * Deserialize a move card from serialized format
 */
function deserializeMoveCard(
  serialized: SerializedMoveCard,
  board: any,
  color: 'white' | 'black'
): Card | null {
  const from: Position = serialized.from;
  const to: Position = serialized.to;
  
  // Check what piece is at the from position
  const pieceAtFrom = board[from.row]?.[from.col];
  logger.debug('🔍 Deserializing move card:', {
    id: serialized.id,
    from: serialized.from,
    to: serialized.to,
    color,
    promotion: serialized.promotion,
    pieceAtFrom: pieceAtFrom,
    pieceColor: pieceAtFrom?.color,
    pieceType: pieceAtFrom?.type,
    pieceHasMoved: pieceAtFrom?.hasMoved,
    colorMatch: pieceAtFrom?.color === color,
  });
  
  // Get promotion piece if any
  const promotionPiece = serialized.promotion as PieceType | undefined;
  
  // Recreate the move card
  const card = createMoveCard(board, from, to, color, promotionPiece);
  
  if (!card) {
    console.error('❌ createMoveCard returned null for:', {
      from,
      to,
      color,
      pieceAtFrom,
      pieceColor: pieceAtFrom?.color,
      colorMatch: pieceAtFrom?.color === color,
      promotion: promotionPiece,
    });
  }
  
  return card;
}

/**
 * Deserialize SerializedGameState back to EnhancedGameState
 */
export function deserializeGameState(
  serialized: SerializedGameState,
  whiteDeck: readonly Card[],
  blackDeck: readonly Card[]
): EnhancedGameState {
  // Debug: Check board structure on deserialization
  logger.debug('🔍 Deserializing - board structure:', {
    isArray: Array.isArray(serialized.gameState?.boardState?.board),
    type: typeof serialized.gameState?.boardState?.board,
    length: serialized.gameState?.boardState?.board?.length,
    keys: typeof serialized.gameState?.boardState?.board === 'object' 
      ? Object.keys(serialized.gameState.boardState.board) 
      : 'N/A',
  });
  
  // Log what Firebase actually stored at each index
  if (serialized.gameState?.boardState?.board) {
    const board = serialized.gameState.boardState.board;
    logger.debug('🔍 Raw board data from Firebase:', {
      row0: board[0]?.[0], // Should be white rook
      row1: board[1]?.[0], // Should be white pawn
      row6: board[6]?.[0], // Should be black pawn
      row7: board[7]?.[0], // Should be black rook
    });
  }
  
  // Fix Firebase array corruption: convert object with numeric keys back to array
  // OR fix sparse arrays where Firebase removed empty/null rows
  let gameState = serialized.gameState;
  if (serialized.gameState?.boardState?.board) {
    const boardData = serialized.gameState.boardState.board;
    const boardArray: any[] = [];
    
    // Check if this is a sparse array (Firebase removed null rows)
    const isObject = !Array.isArray(boardData);
    const keys = Object.keys(boardData);
    logger.debug('🔍 Board reconstruction:', {
      isObject,
      keys,
      isSparse: keys.length < 8,
    });
    
    // Always reconstruct the full 8x8 board
    for (let i = 0; i < 8; i++) {
      if (boardData[i] !== undefined && boardData[i] !== null) {
        // Row exists - check if it's an array or object
        if (!Array.isArray(boardData[i])) {
          // Row is an object, convert to array
          const rowObj = boardData[i] as any;
          const rowArray: any[] = [];
          for (let j = 0; j < 8; j++) {
            rowArray[j] = rowObj[j] !== undefined ? rowObj[j] : null;
          }
          boardArray[i] = rowArray;
        } else {
          // Row is already an array, but ensure it has 8 elements
          const row = boardData[i] as any[];
          const rowArray: any[] = [];
          for (let j = 0; j < 8; j++) {
            rowArray[j] = row[j] !== undefined ? row[j] : null;
          }
          boardArray[i] = rowArray;
        }
      } else {
        // Row is missing (Firebase sparse array) - create empty row
        boardArray[i] = Array(8).fill(null);
      }
    }
    
    // Create new game state with corrected board and ensure required fields
    gameState = {
      ...serialized.gameState,
      boardState: {
        ...serialized.gameState.boardState,
        board: boardArray as any,
        // Ensure effects array exists (Firebase may remove empty arrays)
        effects: serialized.gameState.boardState.effects || [],
        // Ensure castlingRights exists with defaults if missing
        castlingRights: serialized.gameState.boardState.castlingRights || {
          whiteKingSide: true,
          whiteQueenSide: true,
          blackKingSide: true,
          blackQueenSide: true,
        },
      },
      // Ensure moveHistory array exists
      moveHistory: serialized.gameState.moveHistory || [],
    };
    logger.debug('✅ Fixed board structure - always 8x8:', {
      isArray: Array.isArray(boardArray),
      length: boardArray.length,
      rowLengths: boardArray.map(row => row?.length),
      hasEffects: !!gameState.boardState.effects,
      effectsCount: gameState.boardState.effects?.length || 0,
      hasMoveHistory: !!gameState.moveHistory,
    });
  } else {
    // Even if board doesn't need fixing, ensure required fields exist
    const needsFieldFix = !serialized.gameState.boardState.effects || 
                          !serialized.gameState.boardState.castlingRights ||
                          !serialized.gameState.moveHistory;
    if (needsFieldFix) {
      gameState = {
        ...serialized.gameState,
        boardState: {
          ...serialized.gameState.boardState,
          effects: serialized.gameState.boardState.effects || [],
          castlingRights: serialized.gameState.boardState.castlingRights || {
            whiteKingSide: true,
            whiteQueenSide: true,
            blackKingSide: true,
            blackQueenSide: true,
          },
        },
        moveHistory: serialized.gameState.moveHistory || [],
      };
    }
  }
  
  // Create card lookups
  const whiteLookup = createCardLookup(whiteDeck);
  const blackLookup = createCardLookup(blackDeck);
  const allLookup = new Map([...whiteLookup, ...blackLookup]);

  // Helper to find card
  const findCard = (id: string): Card => {
    const card = allLookup.get(id);
    if (!card) {
      throw new Error(`Card not found: ${id}`);
    }
    return card;
  };
  
  // Defensive checks for data integrity
  if (!serialized) {
    throw new Error('Invalid serialized state: state is null or undefined');
  }
  
  // Provide defaults for missing hand data (backwards compatibility with old state format)
  if (!serialized.whiteHand || !serialized.blackHand) {
    console.warn('⚠️ Missing hand data, initializing with defaults:', {
      hasWhiteHand: !!serialized.whiteHand,
      hasBlackHand: !!serialized.blackHand,
    });
  }
  
  // Provide defaults for missing arrays (backwards compatibility)
  const whiteHand = serialized.whiteHand ? {
    moveCards: serialized.whiteHand.moveCards || [],
    specialCardIds: serialized.whiteHand.specialCardIds || [],
  } : {
    moveCards: [],
    specialCardIds: [],
  };
  
  const blackHand = serialized.blackHand ? {
    moveCards: serialized.blackHand.moveCards || [],
    specialCardIds: serialized.blackHand.specialCardIds || [],
  } : {
    moveCards: [],
    specialCardIds: [],
  };
  
  const whiteDeckData = {
    deckCardIds: serialized.whiteDeck?.deckCardIds || [],
    usedCardIds: serialized.whiteDeck?.usedCardIds || [],
  };
  
  const blackDeckData = {
    deckCardIds: serialized.blackDeck?.deckCardIds || [],
    usedCardIds: serialized.blackDeck?.usedCardIds || [],
  };
  
  if (!gameState || !gameState.boardState || !gameState.boardState.board) {
    throw new Error('Invalid serialized state: missing gameState or board');
  }
  
  // Deserialize move cards
  const whiteMoveCards = whiteHand.moveCards
    .map(mc => deserializeMoveCard(mc, gameState.boardState.board, 'white'))
    .filter((c): c is Card => c !== null);
  
  const blackMoveCards = blackHand.moveCards
    .map(mc => deserializeMoveCard(mc, gameState.boardState.board, 'black'))
    .filter((c): c is Card => c !== null);

  logger.debug('🔍 Deserialized move cards:', {
    whiteCount: whiteMoveCards.length,
    blackCount: blackMoveCards.length,
    whiteSample: whiteMoveCards[0]?.id,
    serializedWhiteCount: whiteHand.moveCards.length,
    serializedBlackCount: blackHand.moveCards.length,
  });

  return {
    gameState: gameState,
    whiteHand: {
      moveCards: whiteMoveCards,
      specialCards: whiteHand.specialCardIds.map(findCard),
      config: { drawMoveCardsPerTurn: 5, maxMoveCards: 5, maxSpecialCards: 1 },
    } as PlayerHand,
    blackHand: {
      moveCards: blackMoveCards,
      specialCards: blackHand.specialCardIds.map(findCard),
      config: { drawMoveCardsPerTurn: 5, maxMoveCards: 5, maxSpecialCards: 1 },
    } as PlayerHand,
    whiteDeck: {
      deck: whiteDeckData.deckCardIds.map((id: string) => whiteLookup.get(id)!).filter((c: Card | undefined) => c !== undefined),
      used: whiteDeckData.usedCardIds.map((id: string) => whiteLookup.get(id)!).filter((c: Card | undefined) => c !== undefined),
    },
    blackDeck: {
      deck: blackDeckData.deckCardIds.map((id: string) => blackLookup.get(id)!).filter((c: Card | undefined) => c !== undefined),
      used: blackDeckData.usedCardIds.map((id: string) => blackLookup.get(id)!).filter((c: Card | undefined) => c !== undefined),
    },
    pendingSpecialCardDecision: serialized.pendingSpecialCardDecision ? {
      player: serialized.pendingSpecialCardDecision.player as any,
      card: findCard(serialized.pendingSpecialCardDecision.cardId),
    } : null,
    whiteDrawModifier: serialized.whiteDrawModifier || 0,
    blackDrawModifier: serialized.blackDrawModifier || 0,
    skipNextTurn: serialized.skipNextTurn as any,
    skipTurnAfterNext: serialized.skipTurnAfterNext as any,
    freeMoveEnabled: serialized.freeMoveEnabled as any,
    whiteFocusedPieceType: serialized.whiteFocusedPieceType || null,
    blackFocusedPieceType: serialized.blackFocusedPieceType || null,
    pendingPieceTypeChoice: serialized.pendingPieceTypeChoice as any,
    pendingCardSelection: serialized.pendingCardSelection ? {
      ...serialized.pendingCardSelection,
      player: serialized.pendingCardSelection.player as any,
    } : null,
    pendingBoardAction: serialized.pendingBoardAction as any,
    playHistory: (serialized.playHistory || []).map(h => {
      // Move cards aren't in the deck - create a minimal Card from the ID
      if (h.isMoveCard) {
        return {
          player: h.player as any,
          card: {
            id: h.cardId,
            name: h.cardId.replace('move-', '').toUpperCase(),
            description: `Move: ${h.cardId}`,
            rarity: 'common' as const,
            cost: { mana: 0 },
            effect: {
              id: `effect-${h.cardId}`,
              name: 'Move Effect',
              description: 'Historical move - not executable',
              type: 'instant' as const,
              timing: 'immediate' as const,
              execute: () => ({ success: false, message: 'History card - not executable' }),
            },
          },
          turnNumber: h.turnNumber,
          isMoveCard: h.isMoveCard,
        };
      }
      // Special cards can be found in the deck
      return {
        player: h.player as any,
        card: findCard(h.cardId),
        turnNumber: h.turnNumber,
        isMoveCard: h.isMoveCard,
      };
    }) as any,
  };
}
