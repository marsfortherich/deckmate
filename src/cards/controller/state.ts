/**
 * Enhanced game state and the deck primitives that operate on it.
 *
 * This module holds the shape of a match plus the small pure helpers that
 * manipulate a special-card deck. It exists separately from the controller so
 * that the controller's extracted behaviours (effect metadata, turn lifecycle,
 * board actions) can share these without importing the controller itself,
 * which would be circular.
 *
 * Everything here is pure: no method mutates its argument.
 */

import { GameState, Color } from '../../core/index.js';
import { Card } from '../types/index.js';
import { PlayerHand } from '../moveCards/handManagerV2.js';

/**
 * Simple deck state for special cards
 */
export interface SpecialCardDeck {
  readonly deck: readonly Card[]; // Cards in deck
  readonly used: readonly Card[]; // Cards that have been played
}

/**
 * Vollständiger Spiel-Zustand mit Decks
 */
export interface EnhancedGameState {
  readonly gameState: GameState;
  readonly whiteHand: PlayerHand;
  readonly blackHand: PlayerHand;
  readonly whiteDeck: SpecialCardDeck;
  readonly blackDeck: SpecialCardDeck;
  readonly pendingSpecialCardDecision: {
    player: Color;
    card: Card;
  } | null; // Pending decision for current special card
  readonly whiteDrawModifier: number; // Temporary modifier to draw count
  readonly blackDrawModifier: number;
  readonly skipNextTurn: Color | null; // Which player should skip their next turn
  readonly skipTurnAfterNext: Color | null; // Which player should skip after one turn (Time Warp)
  readonly freeMoveEnabled: Color | null; // Which player has free move enabled this turn
  readonly whiteFocusedPieceType: string | null; // Which piece type white should draw moves for
  readonly blackFocusedPieceType: string | null; // Which piece type black should draw moves for
  readonly pendingPieceTypeChoice: {
    // Awaiting piece type choice for Focus Strategy
    player: Color;
    cardId: string;
  } | null;
  readonly pendingCardSelection: {
    // Awaiting card selection from used pile
    player: Color;
    action: 'recover' | 'activate';
    maxCount: number; // Max number of cards to select (2 for recover, 1 for activate)
    triggeringCardId: string; // The card that triggered this selection (to exclude from selection)
  } | null;
  readonly pendingBoardAction: {
    // Awaiting board position selection
    player: Color;
    action: 'swapPieces' | 'placeTrap' | 'convertPawn';
    cardId: string;
  } | null;
  readonly playHistory: readonly {
    player: Color;
    card: Card;
    turnNumber: number;
    isMoveCard: boolean;
  }[]; // History of all cards played
}

/**
 * Create empty deck
 */
export function createEmptyDeck(): SpecialCardDeck {
  return {
    deck: [],
    used: [],
  };
}

/**
 * Create deck from cards
 */
export function createDeckFromCards(cards: readonly Card[]): SpecialCardDeck {
  // Shuffle cards
  const shuffled = [...cards].sort(() => Math.random() - 0.5);
  return {
    deck: shuffled,
    used: [],
  };
}

/**
 * Draw card from deck
 */
export function drawFromDeck(deck: SpecialCardDeck): {
  newDeck: SpecialCardDeck;
  drawnCard: Card | null;
} {
  if (deck.deck.length === 0) {
    // Deck is empty - no reshuffling from used pile
    return { newDeck: deck, drawnCard: null };
  }

  const [drawnCard, ...remaining] = deck.deck;
  return {
    newDeck: {
      ...deck,
      deck: remaining,
    },
    drawnCard: drawnCard || null,
  };
}

/**
 * Add card to used pile
 */
export function addToUsed(deck: SpecialCardDeck, card: Card): SpecialCardDeck {
  return {
    ...deck,
    used: [...deck.used, card],
  };
}

/**
 * Shuffle card back into deck
 */
export function shuffleCardBack(deck: SpecialCardDeck, card: Card): SpecialCardDeck {
  const newDeck = [...deck.deck, card].sort(() => Math.random() - 0.5);
  return {
    ...deck,
    deck: newDeck,
  };
}

/** The other player. */
export function opponentOf(player: Color): Color {
  return player === 'white' ? 'black' : 'white';
}
