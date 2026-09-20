/**
 * Deck Manager
 * 
 * Verwaltet Deck-Operationen (Ziehen, Mischen, Ablegen).
 * Alle Funktionen sind pure (immutable) für Multiplayer-Tauglichkeit.
 */

import { Card } from '../types/card.js';
import { Color } from '../../core/index.js';
import {
  DeckState,
  DeckConfig,
  DeckMetadata,
  DrawResult,
  DiscardResult,
  ShuffleResult,
  DEFAULT_DECK_CONFIG,
} from './deckTypes.js';

/**
 * Erstellt einen leeren Deck-Zustand
 */
export function createEmptyDeck(owner: Color): DeckState {
  return {
    deck: [],
    hand: [],
    discard: [],
    owner,
    metadata: {
      totalDraws: 0,
      totalShuffles: 0,
      totalDiscards: 0,
    },
  };
}

/**
 * Erstellt einen Deck-Zustand aus einer Kartenliste
 */
export function createDeckFromCards(
  owner: Color,
  cards: ReadonlyArray<Card>,
  _config?: DeckConfig // Reserved for future use
): DeckState {
  const shuffledDeck = shuffleArray([...cards]);
  
  return {
    deck: shuffledDeck,
    hand: [],
    discard: [],
    owner,
    metadata: {
      totalDraws: 0,
      totalShuffles: 1,
      totalDiscards: 0,
      lastAction: 'deck_created',
    },
  };
}

/**
 * Zieht Karten vom Deck
 * 
 * @param state Aktueller Deck-Zustand
 * @param count Anzahl zu ziehender Karten
 * @param config Deck-Konfiguration
 * @returns DrawResult mit neuem Zustand und gezogenen Karten
 */
export function drawCards(
  state: DeckState,
  count: number,
  config: DeckConfig = DEFAULT_DECK_CONFIG
): DrawResult {
  // Hand bereits voll?
  if (state.hand.length >= config.maxHandSize) {
    return {
      newState: state,
      drawnCards: [],
      shuffled: false,
      failed: true,
      reason: 'Hand is full',
    };
  }
  
  // Maximale Anzahl berechnen (nicht über maxHandSize)
  const maxDrawable = config.maxHandSize - state.hand.length;
  const actualCount = Math.min(count, maxDrawable);
  
  let currentDeck = [...state.deck];
  const currentHand = [...state.hand];
  const drawnCards: Card[] = [];
  let shuffled = false;
  
  // Karten ziehen
  for (let i = 0; i < actualCount; i++) {
    // Deck leer? Automatisch mischen wenn konfiguriert
    if (currentDeck.length === 0 && config.autoShuffleOnEmpty && state.discard.length > 0) {
      currentDeck = shuffleArray([...state.discard]);
      shuffled = true;
    }
    
    // Immer noch leer? Abbruch
    if (currentDeck.length === 0) {
      break;
    }
    
    // Oberste Karte ziehen
    const card = currentDeck.shift()!;
    currentHand.push(card);
    drawnCards.push(card);
  }
  
  return {
    newState: {
      ...state,
      deck: currentDeck,
      hand: currentHand,
      discard: shuffled ? [] : state.discard, // Discard leeren wenn gemischt
      metadata: {
        ...state.metadata,
        totalDraws: state.metadata.totalDraws + drawnCards.length,
        totalShuffles: shuffled ? state.metadata.totalShuffles + 1 : state.metadata.totalShuffles,
        lastAction: 'draw',
      },
    },
    drawnCards,
    shuffled,
    failed: drawnCards.length === 0,
    reason: drawnCards.length === 0 ? 'No cards available' : undefined,
  };
}

/**
 * Wirft Karten von der Hand ab
 * 
 * @param state Aktueller Deck-Zustand
 * @param cardIndices Indices der abzuwerfenden Karten
 * @returns DiscardResult mit neuem Zustand
 */
export function discardCards(
  state: DeckState,
  cardIndices: ReadonlyArray<number>
): DiscardResult {
  // Validierung
  const validIndices = cardIndices.filter(
    idx => idx >= 0 && idx < state.hand.length
  );
  
  if (validIndices.length === 0) {
    return {
      newState: state,
      discardedCards: [],
      success: false,
    };
  }
  
  // Karten sammeln und entfernen
  const discardedCards: Card[] = [];
  const newHand = state.hand.filter((card, idx) => {
    if (validIndices.includes(idx)) {
      discardedCards.push(card);
      return false;
    }
    return true;
  });
  
  return {
    newState: {
      ...state,
      hand: newHand,
      discard: [...state.discard, ...discardedCards],
      metadata: {
        ...state.metadata,
        totalDiscards: state.metadata.totalDiscards + discardedCards.length,
        lastAction: 'discard',
      },
    },
    discardedCards,
    success: true,
  };
}

/**
 * Spielt eine Karte von der Hand (entfernt sie, ohne sie abzuwerfen)
 * 
 * @param state Aktueller Deck-Zustand
 * @param cardIndex Index der zu spielenden Karte
 * @returns Neue State und gespielte Karte (oder undefined)
 */
export function playCardFromDeck(
  state: DeckState,
  cardIndex: number
): { newState: DeckState; playedCard?: Card } {
  if (cardIndex < 0 || cardIndex >= state.hand.length) {
    return { newState: state };
  }
  
  const playedCard = state.hand[cardIndex];
  const newHand = state.hand.filter((_, idx) => idx !== cardIndex);
  
  return {
    newState: {
      ...state,
      hand: newHand,
      metadata: {
        ...state.metadata,
        lastAction: 'play_card',
      },
    },
    playedCard,
  };
}

/**
 * Mischt das Deck
 * 
 * @param state Aktueller Deck-Zustand
 * @param source Woher mischen? 'deck', 'discard' oder 'both'
 * @returns ShuffleResult mit neuem Zustand
 */
export function shuffleDeck(
  state: DeckState,
  source: 'deck' | 'discard' | 'both' = 'deck'
): ShuffleResult {
  let cardsToShuffle: Card[] = [];
  let newDiscard = [...state.discard];
  let newDeck = [...state.deck];
  
  if (source === 'deck') {
    cardsToShuffle = [...state.deck];
    newDeck = [];
  } else if (source === 'discard') {
    cardsToShuffle = [...state.discard];
    newDiscard = [];
  } else {
    // both
    cardsToShuffle = [...state.deck, ...state.discard];
    newDeck = [];
    newDiscard = [];
  }
  
  const shuffled = shuffleArray(cardsToShuffle);
  
  return {
    newState: {
      ...state,
      deck: [...newDeck, ...shuffled],
      discard: newDiscard,
      metadata: {
        ...state.metadata,
        totalShuffles: state.metadata.totalShuffles + 1,
        lastAction: 'shuffle',
      },
    },
    cardCount: cardsToShuffle.length,
    source,
  };
}

/**
 * Mulligan: Hand zurück ins Deck und neu ziehen
 * 
 * @param state Aktueller Deck-Zustand
 * @param config Deck-Konfiguration
 * @returns DrawResult mit neuer Hand
 */
export function mulligan(
  state: DeckState,
  config: DeckConfig = DEFAULT_DECK_CONFIG
): DrawResult {
  if (!config.allowMulligan) {
    return {
      newState: state,
      drawnCards: [],
      shuffled: false,
      failed: true,
      reason: 'Mulligan not allowed',
    };
  }
  
  // Hand zurück ins Deck
  const cardsToReturn = state.hand.length;
  const stateWithoutHand: DeckState = {
    ...state,
    hand: [],
    deck: [...state.deck, ...state.hand],
  };
  
  // Mischen
  const shuffleResult = shuffleDeck(stateWithoutHand, 'deck');
  
  // Neu ziehen
  return drawCards(shuffleResult.newState, cardsToReturn, config);
}

/**
 * Fügt Karten zum Deck hinzu (z.B. für dynamisch generierte Karten)
 * 
 * @param state Aktueller Deck-Zustand
 * @param cards Hinzuzufügende Karten
 * @param target Wo hinzufügen? 'deck', 'hand' oder 'discard'
 * @returns Neuer Zustand
 */
export function addCards(
  state: DeckState,
  cards: ReadonlyArray<Card>,
  target: 'deck' | 'hand' | 'discard' = 'deck'
): DeckState {
  if (target === 'hand') {
    return {
      ...state,
      hand: [...state.hand, ...cards],
      metadata: {
        ...state.metadata,
        lastAction: 'add_to_hand',
      },
    };
  } else if (target === 'discard') {
    return {
      ...state,
      discard: [...state.discard, ...cards],
      metadata: {
        ...state.metadata,
        lastAction: 'add_to_discard',
      },
    };
  } else {
    return {
      ...state,
      deck: [...state.deck, ...cards],
      metadata: {
        ...state.metadata,
        lastAction: 'add_to_deck',
      },
    };
  }
}

/**
 * Gibt Statistiken über das Deck zurück
 */
export function getDeckStats(state: DeckState): {
  deckSize: number;
  handSize: number;
  discardSize: number;
  totalCards: number;
  metadata: DeckMetadata;
} {
  return {
    deckSize: state.deck.length,
    handSize: state.hand.length,
    discardSize: state.discard.length,
    totalCards: state.deck.length + state.hand.length + state.discard.length,
    metadata: state.metadata,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Fisher-Yates Shuffle (deterministisch mit Seed für Multiplayer)
 * 
 * Für echtes Multiplayer: Seed von Server/Game-State nutzen!
 * Aktuell: Math.random() für lokales Spiel
 */
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  
  for (let i = result.length - 1; i > 0; i--) {
    // Für Multiplayer: Hier deterministischen RNG mit Seed nutzen
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  
  return result;
}

/**
 * Deterministisches Shuffle mit Seed (für Multiplayer)
 * 
 * Nutzt simple LCG (Linear Congruential Generator)
 * Für Production: Besseren RNG nutzen (z.B. seedrandom library)
 */
export function shuffleArrayWithSeed<T>(array: T[], seed: number): T[] {
  const result = [...array];
  let currentSeed = seed;
  
  // Simple LCG: a = 1664525, c = 1013904223, m = 2^32
  const random = () => {
    currentSeed = (1664525 * currentSeed + 1013904223) % 4294967296;
    return currentSeed / 4294967296;
  };
  
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  
  return result;
}
