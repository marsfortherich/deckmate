/**
 * Hand Manager (Refactored)
 * 
 * Service-Klasse für Hand-Management.
 * Reduziert Abhängigkeiten und verbessert Testbarkeit.
 */

import { Card } from '../types/card.js';
import { HandStats } from '../types/handStats.js';
import { GameState, Color } from '../../core/index.js';
import { generateMoveCards } from './moveCardGenerator.js';
import { removeItem, addIfSpace, takeRandom } from '../../core/utils/arrayUtils.js';
import { DEFAULT_MAX_MOVE_CARDS, DEFAULT_MAX_SPECIAL_CARDS, DEFAULT_DRAW_MOVE_CARDS } from '../../core/constants.js';

/**
 * Hand-Konfiguration
 */
export interface HandConfig {
  readonly maxMoveCards: number;
  readonly maxSpecialCards: number;
  readonly drawMoveCardsPerTurn: number;
}

/**
 * Standard-Konfiguration
 */
export const DEFAULT_HAND_CONFIG: HandConfig = {
  maxMoveCards: DEFAULT_MAX_MOVE_CARDS,
  maxSpecialCards: DEFAULT_MAX_SPECIAL_CARDS,
  drawMoveCardsPerTurn: DEFAULT_DRAW_MOVE_CARDS,
};

/**
 * Player Hand State
 */
export interface PlayerHand {
  readonly moveCards: readonly Card[];
  readonly specialCards: readonly Card[];
  readonly config: HandConfig;
}

/**
 * Hand Manager - Service Klasse
 * 
 * Kapselt alle Hand-Operationen.
 * Reduziert GameController Abhängigkeiten von 9 auf 1.
 */
export class HandManager {
  /**
   * Erstellt eine leere Hand
   */
  static createEmpty(config: HandConfig = DEFAULT_HAND_CONFIG): PlayerHand {
    return {
      moveCards: [],
      specialCards: [],
      config,
    };
  }
  
  /**
   * Zieht Zugkarten für einen Spieler
   */
  static drawMoveCards(
    state: GameState,
    color: Color,
    hand: PlayerHand,
    ignoreMax: boolean = false
  ): PlayerHand {
    const allMoveCards = generateMoveCards(state.boardState, color);
    
    const currentCount = hand.moveCards.length;
    const maxCards = hand.config.maxMoveCards;
    
    let canDraw: number;
    if (ignoreMax) {
      // Allow drawing beyond max (for bonus cards)
      canDraw = hand.config.drawMoveCardsPerTurn;
    } else {
      // Normal draw - respect max limit
      canDraw = Math.min(
        hand.config.drawMoveCardsPerTurn,
        maxCards - currentCount
      );
    }
    
    if (canDraw <= 0 || allMoveCards.length === 0) {
      return hand;
    }
    
    const drawn = takeRandom(allMoveCards, canDraw);
    
    return {
      ...hand,
      moveCards: [...hand.moveCards, ...drawn],
    };
  }
  
  /**
   * Spielt eine Karte aus der Hand
   * 
   * Nutzt Array-Utils statt Code-Duplizierung
   */
  static playCard(
    hand: PlayerHand,
    cardId: string,
    isMoveCard: boolean = true
  ): { newHand: PlayerHand; playedCard: Card | null } {
    if (isMoveCard) {
      const [newMoveCards, playedCard] = removeItem(
        hand.moveCards,
        (c) => c.id === cardId
      );
      
      return {
        newHand: { ...hand, moveCards: newMoveCards },
        playedCard,
      };
    } else {
      const [newSpecialCards, playedCard] = removeItem(
        hand.specialCards,
        (c) => c.id === cardId
      );
      
      return {
        newHand: { ...hand, specialCards: newSpecialCards },
        playedCard,
      };
    }
  }
  
  /**
   * Fügt eine Spezialkarte hinzu
   */
  static addSpecialCard(hand: PlayerHand, card: Card): PlayerHand {
    const newSpecialCards = addIfSpace(
      hand.specialCards,
      card,
      hand.config.maxSpecialCards
    );
    
    if (!newSpecialCards) {
      return hand; // Hand voll
    }
    
    return {
      ...hand,
      specialCards: newSpecialCards,
    };
  }
  
  /**
   * Entfernt alle Zugkarten
   */
  static clearMoveCards(hand: PlayerHand): PlayerHand {
    return {
      ...hand,
      moveCards: [],
    };
  }
  
  /**
   * Entfernt alle Spezialkarten
   */
  static clearSpecialCards(hand: PlayerHand): PlayerHand {
    return {
      ...hand,
      specialCards: [],
    };
  }
  
  /**
   * Gibt Hand-Statistiken zurück
   */
  static getStats(hand: PlayerHand): HandStats {
    return {
      totalCards: hand.moveCards.length + hand.specialCards.length,
      moveCards: hand.moveCards.length,
      specialCards: hand.specialCards.length,
      hasPlayableCards: hand.moveCards.length > 0 || hand.specialCards.length > 0,
    };
  }
}

// Legacy Exports (für Rückwärtskompatibilität)
export const createEmptyHand = HandManager.createEmpty;
export const drawMoveCards = HandManager.drawMoveCards;
export const playCardFromHand = HandManager.playCard;
export const addSpecialCard = HandManager.addSpecialCard;
export const clearMoveCards = HandManager.clearMoveCards;
export const clearSpecialCards = HandManager.clearSpecialCards;
export const getHandStats = HandManager.getStats;
