/**
 * Basic Cards
 * 
 * Beispiel-Karten für das Kartensystem.
 * Zeigt wie neue Karten einfach hinzugefügt werden können.
 */

import { Card } from '../types/card.js';
import { skipTurnEffect } from '../effects/skipTurn.js';
import { spawnPieceEffect } from '../effects/spawnPiece.js';
import { extraMoveEffect } from '../effects/extraMove.js';

/**
 * Time Freeze
 * 
 * Überspringt den nächsten Zug des Gegners.
 */
export const timeFreezeCard: Card = {
  id: 'time-freeze',
  name: 'Time Freeze',
  description: 'Your opponent skips their next turn',
  rarity: 'rare',
  cost: {
    mana: 4,
  },
  effect: skipTurnEffect,
  flavorText: 'Time stands still for those who dare to wait.',
};

/**
 * Summon Knight
 * 
 * Beschwört einen Springer auf einem leeren Feld.
 */
export const summonKnightCard: Card = {
  id: 'summon-knight',
  name: 'Summon Knight',
  description: 'Spawn a knight on any empty square',
  rarity: 'uncommon',
  cost: {
    mana: 3,
  },
  effect: spawnPieceEffect,
  flavorText: 'From the shadows, a warrior emerges.',
};

/**
 * Summon Pawn
 * 
 * Beschwört einen Bauern (günstiger als Springer).
 */
export const summonPawnCard: Card = {
  id: 'summon-pawn',
  name: 'Summon Pawn',
  description: 'Spawn a pawn on any empty square',
  rarity: 'common',
  cost: {
    mana: 1,
  },
  effect: spawnPieceEffect,
  flavorText: 'Even the smallest piece can turn the tide.',
};

/**
 * Double Time
 * 
 * Gibt dem Spieler einen zusätzlichen Zug.
 */
export const doubleTimeCard: Card = {
  id: 'double-time',
  name: 'Double Time',
  description: 'Take an additional turn after this one',
  rarity: 'legendary',
  cost: {
    mana: 6,
  },
  requirements: {
    minTurn: 5,  // Erst ab Zug 5 spielbar
  },
  effect: extraMoveEffect,
  flavorText: 'Strike twice before they can react.',
};

/**
 * Desperate Summon
 * 
 * Beschwört eine Dame, aber nur wenn im Schach.
 */
export const desperateSummonCard: Card = {
  id: 'desperate-summon',
  name: 'Desperate Summon',
  description: 'Spawn a queen on an empty square. Can only be played while in check.',
  rarity: 'legendary',
  cost: {
    mana: 7,
  },
  requirements: {
    requiresCheck: true,  // Nur im Schach spielbar
  },
  effect: spawnPieceEffect,
  flavorText: 'In dire times, the queen answers the call.',
};

/**
 * Export aller Basis-Karten
 */
export const basicCards: Card[] = [
  timeFreezeCard,
  summonKnightCard,
  summonPawnCard,
  doubleTimeCard,
  desperateSummonCard,
];

/**
 * Hilfsfunktion: Finde Karte nach ID
 */
export function getCardById(id: string): Card | undefined {
  return basicCards.find((card) => card.id === id);
}
