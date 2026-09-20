/**
 * Deck System Types
 * 
 * Definiert die Datenstrukturen für das Deckbuilding-System.
 * Multiplayer-tauglich durch immutable Struktur.
 */

import { Card } from '../types/card.js';
import { Color } from '../../core/index.js';

/**
 * Zustand eines Spieler-Decks
 * Trennt Deck, Hand und Ablagestapel
 */
export interface DeckState {
  /** Karten im Deck (noch zu ziehen) */
  readonly deck: ReadonlyArray<Card>;
  
  /** Karten auf der Hand */
  readonly hand: ReadonlyArray<Card>;
  
  /** Abgeworfene Karten */
  readonly discard: ReadonlyArray<Card>;
  
  /** Spieler, dem dieses Deck gehört */
  readonly owner: Color;
  
  /** Metadaten (z.B. für Statistiken) */
  readonly metadata: DeckMetadata;
}

/**
 * Metadaten eines Decks
 */
export interface DeckMetadata {
  /** Anzahl gezogener Karten insgesamt */
  readonly totalDraws: number;
  
  /** Anzahl Mischvorgänge */
  readonly totalShuffles: number;
  
  /** Anzahl abgeworfener Karten */
  readonly totalDiscards: number;
  
  /** Zeitstempel der letzten Aktion */
  readonly lastAction?: string;
}

/**
 * Konfiguration für Deck-Verhalten
 */
export interface DeckConfig {
  /** Maximale Handgröße (Standard: 7) */
  readonly maxHandSize: number;
  
  /** Automatisch mischen wenn Deck leer? */
  readonly autoShuffleOnEmpty: boolean;
  
  /** Karten beim Spielstart ziehen */
  readonly initialDrawCount: number;
  
  /** Karten pro Runde ziehen */
  readonly drawPerTurn: number;
  
  /** Mulligan erlaubt? (Hand zurück und neu ziehen) */
  readonly allowMulligan: boolean;
}

/**
 * Standard-Konfiguration
 */
export const DEFAULT_DECK_CONFIG: DeckConfig = {
  maxHandSize: 7,
  autoShuffleOnEmpty: true,
  initialDrawCount: 3,
  drawPerTurn: 1,
  allowMulligan: false,
};

/**
 * Deck-Template für Deck-Building
 * Definiert, welche Karten in welcher Anzahl ins Deck kommen
 */
export interface DeckTemplate {
  /** Name des Deck-Templates */
  readonly name: string;
  
  /** Beschreibung/Strategie */
  readonly description: string;
  
  /** Liste von Karten mit Anzahl */
  readonly cards: ReadonlyArray<DeckCardEntry>;
  
  /** Minimale/maximale Deckgröße */
  readonly minSize: number;
  readonly maxSize: number;
}

/**
 * Eintrag im Deck-Template
 */
export interface DeckCardEntry {
  /** Die Karte */
  readonly card: Card;
  
  /** Anzahl dieser Karte im Deck */
  readonly count: number;
}

/**
 * Ergebnis einer Zieh-Aktion
 */
export interface DrawResult {
  /** Neuer Deck-Zustand */
  readonly newState: DeckState;
  
  /** Gezogene Karten */
  readonly drawnCards: ReadonlyArray<Card>;
  
  /** Wurde gemischt? */
  readonly shuffled: boolean;
  
  /** Fehlgeschlagen? (z.B. Hand voll) */
  readonly failed: boolean;
  
  /** Fehlergrund */
  readonly reason?: string;
}

/**
 * Ergebnis einer Discard-Aktion
 */
export interface DiscardResult {
  /** Neuer Deck-Zustand */
  readonly newState: DeckState;
  
  /** Abgeworfene Karten */
  readonly discardedCards: ReadonlyArray<Card>;
  
  /** Erfolgreich? */
  readonly success: boolean;
}

/**
 * Ergebnis einer Shuffle-Aktion
 */
export interface ShuffleResult {
  /** Neuer Deck-Zustand */
  readonly newState: DeckState;
  
  /** Anzahl gemischter Karten */
  readonly cardCount: number;
  
  /** Von wo wurde gemischt? */
  readonly source: 'deck' | 'discard' | 'both';
}
