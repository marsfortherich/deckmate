/**
 * Karten-Typen
 * 
 * Definiert Karten als Datenobjekte.
 */

import { EffectDefinition } from './effect.js';
import { Color } from '../../core/types/index.js';

/**
 * Karten-Seltenheit
 */
export type CardRarity = 'common' | 'uncommon' | 'rare' | 'legendary';

/**
 * Kosten-Typ (später erweiterbar)
 */
export interface CardCost {
  readonly mana?: number;      // Beispiel: Mana-Kosten
  readonly sacrifice?: boolean; // Muss eine Figur geopfert werden?
}

/**
 * Bedingungen zum Ausspielen
 */
export interface CardRequirements {
  readonly minTurn?: number;           // Frühester Zug
  readonly requiresPiece?: boolean;    // Benötigt Figur auf dem Brett
  readonly requiresCheck?: boolean;    // Nur im Schach spielbar
  readonly playerColor?: Color;        // Nur für bestimmte Farbe
}

/**
 * Karten-Definition
 * 
 * Eine Karte ist ein Datenobjekt mit:
 * - Metadaten (Name, Beschreibung, etc.)
 * - Kosten
 * - Bedingungen
 * - Referenz zu Effekt(en)
 */
export interface Card {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly rarity: CardRarity;
  readonly cost: CardCost;
  readonly requirements?: CardRequirements;
  
  // Der Effekt der Karte
  readonly effect: EffectDefinition;
  
  // Optional: Flavor Text
  readonly flavorText?: string;
  
  // Optional: Artwork/Image-Pfad
  readonly image?: string;
}

/**
 * Karten-Instanz im Spiel
 * Erweitert Card mit Laufzeit-Informationen
 */
export interface CardInstance {
  readonly card: Card;
  readonly instanceId: string;  // Unique ID dieser Instanz
  readonly ownerId: Color;
}

/**
 * Spieler-Hand
 */
export interface Hand {
  readonly cards: readonly CardInstance[];
  readonly maxSize: number;  // Maximale Handkarten-Anzahl
}

/**
 * Deck
 */
export interface Deck {
  readonly cards: readonly Card[];
  readonly remainingCards: readonly CardInstance[];  // Noch zu ziehende Karten
}
