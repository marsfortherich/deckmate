/**
 * Card System Example
 * 
 * Demonstriert die Verwendung des Kartensystems.
 */

import { createInitialGameState } from './core/index.js';
import {
  playCard,
  summonKnightCard,
  summonPawnCard,
  timeFreezeCard,
  doubleTimeCard,
  desperateSummonCard,
  type EffectParams,
  NO_PARAMS,
} from './cards/index.js';
import { getPieceAt } from './core/index.js';

console.log('=== Kartensystem Demo ===\n');

// ===== 1. Spiel initialisieren =====
let gameState = createInitialGameState();
console.log(`Initial State - Spieler: ${gameState.currentPlayer}, Zug: ${gameState.turnNumber}`);
console.log();

// ===== 2. Karte: Summon Pawn =====
console.log('--- Karte: Summon Pawn ---');
console.log(`Name: ${summonPawnCard.name}`);
console.log(`Beschreibung: ${summonPawnCard.description}`);
console.log(`Kosten: ${summonPawnCard.cost.mana} Mana`);
console.log(`Seltenheit: ${summonPawnCard.rarity}`);
console.log();

// Spiele Karte: Spawn Pawn auf d4
const pawnParams: EffectParams = {
  type: 'spawn',
  targetPosition: { row: 3, col: 3 }, // d4
  pieceType: 'pawn',
};

let result = playCard(gameState, summonPawnCard, pawnParams, 'white');
console.log(`Ergebnis: ${result.success ? '✓' : '✗'} - ${result.message}`);

if (result.success) {
  gameState = result.newState;
  const piece = getPieceAt(gameState.boardState.board, { row: 3, col: 3 });
  console.log(`Figur auf d4:`, piece);
}
console.log();

// ===== 3. Karte: Summon Knight =====
console.log('--- Karte: Summon Knight ---');

const knightParams: EffectParams = {
  type: 'spawn',
  targetPosition: { row: 4, col: 4 }, // e5
  pieceType: 'knight',
};

result = playCard(gameState, summonKnightCard, knightParams, 'white');
console.log(`Ergebnis: ${result.success ? '✓' : '✗'} - ${result.message}`);

if (result.success) {
  gameState = result.newState;
  const piece = getPieceAt(gameState.boardState.board, { row: 4, col: 4 });
  console.log(`Figur auf e5:`, piece);
}
console.log();

// ===== 4. Fehlerfall: Feld bereits besetzt =====
console.log('--- Fehlerfall: Feld besetzt ---');

const invalidParams: EffectParams = {
  type: 'spawn',
  targetPosition: { row: 3, col: 3 }, // d4 (bereits besetzt!)
  pieceType: 'pawn',
};

result = playCard(gameState, summonPawnCard, invalidParams, 'white');
console.log(`Ergebnis: ${result.success ? '✓' : '✗'} - ${result.message}`);
console.log();

// ===== 5. Karte: Time Freeze =====
console.log('--- Karte: Time Freeze ---');
console.log(`Name: ${timeFreezeCard.name}`);
console.log(`Beschreibung: ${timeFreezeCard.description}`);

result = playCard(gameState, timeFreezeCard, NO_PARAMS, 'white');
console.log(`Ergebnis: ${result.success ? '✓' : '✗'} - ${result.message}`);

if (result.success) {
  gameState = result.newState;
  console.log(`Aktive Effekte auf dem Brett: ${gameState.boardState.effects.length}`);
  if (gameState.boardState.effects.length > 0) {
    console.log(`Effekt-Typ:`, gameState.boardState.effects[0].type);
  }
}
console.log();

// ===== 6. Karte mit Requirements: Double Time =====
console.log('--- Karte: Double Time (zu früh) ---');
console.log(`Anforderung: Mindestens Zug ${doubleTimeCard.requirements?.minTurn}`);
console.log(`Aktueller Zug: ${gameState.turnNumber}`);

result = playCard(gameState, doubleTimeCard, NO_PARAMS, 'white');
console.log(`Ergebnis: ${result.success ? '✓' : '✗'} - ${result.message}`);
console.log();

// ===== 7. Karte mit Requirements: Desperate Summon =====
console.log('--- Karte: Desperate Summon (kein Schach) ---');
console.log(`Anforderung: Muss im Schach sein`);
console.log(`Im Schach: ${gameState.playerInCheck ? 'Ja' : 'Nein'}`);

const queenParams: EffectParams = {
  type: 'spawn',
  targetPosition: { row: 5, col: 5 },
  pieceType: 'queen',
};

result = playCard(gameState, desperateSummonCard, queenParams, 'white');
console.log(`Ergebnis: ${result.success ? '✓' : '✗'} - ${result.message}`);
console.log();

// ===== 8. Zusammenfassung =====
console.log('=== Zusammenfassung ===');
console.log(`Aktueller Spieler: ${gameState.currentPlayer}`);
console.log(`Zug-Nummer: ${gameState.turnNumber}`);
console.log(`Aktive Effekte: ${gameState.boardState.effects.length}`);
console.log(`Move-History: ${gameState.moveHistory.length}`);
console.log();

console.log('=== Demo abgeschlossen ===');
