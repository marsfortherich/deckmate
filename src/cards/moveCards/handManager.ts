/**
 * Hand Management
 * 
 * Verwaltet die Karten-Hand eines Spielers.
 * Kombiniert Zugkarten + Spezialkarten.
 */

import { Card } from '../types/card.js';
import { GameState, Color } from '../../core/types/index.js';
import { generateMoveCards } from './moveCardGenerator.js';

/**
 * Hand-Konfiguration
 */
export interface HandConfig {
  readonly maxMoveCards: number;      // Max. Zugkarten in Hand
  readonly maxSpecialCards: number;   // Max. Spezialkarten in Hand
  readonly drawMoveCardsPerTurn: number;  // Wie viele Zugkarten pro Zug ziehen
}

/**
 * Standard-Konfiguration
 */
export const DEFAULT_HAND_CONFIG: HandConfig = {
  maxMoveCards: 5,           // Max 5 Zugkarten
  maxSpecialCards: 1,        // Max 1 Spezialkarte
  drawMoveCardsPerTurn: 5,   // Ziehe bis zu 5 Zugkarten pro Zug
};

/**
 * Player Hand State
 * Trennt Zug- und Spezialkarten
 */
export interface PlayerHand {
  readonly moveCards: readonly Card[];      // Zugkarten (generiert)
  readonly specialCards: readonly Card[];   // Spezialkarten (Deck)
  readonly config: HandConfig;
}

/**
 * Erstellt eine leere Hand
 */
export function createEmptyHand(config: HandConfig = DEFAULT_HAND_CONFIG): PlayerHand {
  return {
    moveCards: [],
    specialCards: [],
    config,
  };
}

/**
 * Zieht Zugkarten für einen Spieler
 * 
 * Generiert aus legalen Zügen eine Auswahl von Zugkarten.
 * 
 * @param state - Aktueller GameState
 * @param color - Farbe des Spielers
 * @param hand - Aktuelle Hand
 * @returns Neue Hand mit gezogenen Karten
 */
export function drawMoveCards(
  state: GameState,
  color: Color,
  hand: PlayerHand
): PlayerHand {
  // Generiere ALLE möglichen Zugkarten
  const allMoveCards = generateMoveCards(state.boardState, color);
  
  // Wie viele Karten kann der Spieler noch ziehen?
  const currentCount = hand.moveCards.length;
  const maxCards = hand.config.maxMoveCards;
  const canDraw = Math.min(
    hand.config.drawMoveCardsPerTurn,
    maxCards - currentCount
  );
  
  if (canDraw <= 0 || allMoveCards.length === 0) {
    return hand; // Hand voll oder keine Züge verfügbar
  }
  
  // Zufällige Auswahl (oder strategische Auswahl)
  const shuffled = [...allMoveCards].sort(() => Math.random() - 0.5);
  const drawn = shuffled.slice(0, canDraw);
  
  return {
    ...hand,
    moveCards: [...hand.moveCards, ...drawn],
  };
}

/**
 * Spielt eine Karte aus der Hand
 * 
 * @param hand - Aktuelle Hand
 * @param cardId - ID der zu spielenden Karte
 * @param isMoveCard - Ist es eine Zugkarte?
 * @returns Neue Hand ohne die gespielte Karte
 */
export function playCardFromHand(
  hand: PlayerHand,
  cardId: string,
  isMoveCard: boolean = true
): { newHand: PlayerHand; playedCard: Card | null } {
  if (isMoveCard) {
    const cardIndex = hand.moveCards.findIndex((c) => c.id === cardId);
    if (cardIndex === -1) {
      return { newHand: hand, playedCard: null };
    }
    
    const playedCard = hand.moveCards[cardIndex];
    const newMoveCards = hand.moveCards.filter((_, i) => i !== cardIndex);
    
    return {
      newHand: {
        ...hand,
        moveCards: newMoveCards,
      },
      playedCard,
    };
  } else {
    const cardIndex = hand.specialCards.findIndex((c) => c.id === cardId);
    if (cardIndex === -1) {
      return { newHand: hand, playedCard: null };
    }
    
    const playedCard = hand.specialCards[cardIndex];
    const newSpecialCards = hand.specialCards.filter((_, i) => i !== cardIndex);
    
    return {
      newHand: {
        ...hand,
        specialCards: newSpecialCards,
      },
      playedCard,
    };
  }
}

/**
 * Clears all special cards from hand (for turn end cleanup)
 * 
 * @param hand - Current hand
 * @returns Hand with special cards removed
 */
export function clearSpecialCards(hand: PlayerHand): PlayerHand {
  return {
    ...hand,
    specialCards: [],
  };
}

/**
 * Fügt eine Spezialkarte zur Hand hinzu
 * 
 * @param hand - Aktuelle Hand
 * @param card - Hinzuzufügende Karte
 * @returns Neue Hand mit Karte
 */
export function addSpecialCard(
  hand: PlayerHand,
  card: Card
): PlayerHand {
  if (hand.specialCards.length >= hand.config.maxSpecialCards) {
    return hand; // Hand voll
  }
  
  return {
    ...hand,
    specialCards: [...hand.specialCards, card],
  };
}

/**
 * Entfernt alle Zugkarten (z.B. nach Zug-Wechsel)
 * 
 * Zugkarten sind positionsbezogen und werden nach jedem Zug neu generiert.
 */
export function clearMoveCards(hand: PlayerHand): PlayerHand {
  return {
    ...hand,
    moveCards: [],
  };
}

/**
 * Gibt Hand-Statistiken zurück
 */
export function getHandStats(hand: PlayerHand): {
  totalCards: number;
  moveCards: number;
  specialCards: number;
  hasPlayableCards: boolean;
} {
  return {
    totalCards: hand.moveCards.length + hand.specialCards.length,
    moveCards: hand.moveCards.length,
    specialCards: hand.specialCards.length,
    hasPlayableCards: hand.moveCards.length > 0,
  };
}
