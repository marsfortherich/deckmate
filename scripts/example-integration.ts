/**
 * Integration Example: Schach + Karten
 * 
 * Demonstriert das Zusammenspiel von Schach-Engine und Kartensystem.
 */

import {
  createInitialGameState,
  applyMove,
  getPieceAt,
  validateMove,
  generatePieceMoves,
  type GameState,
  type Move,
} from '../src/core/index.js';

import {
  playCard,
  summonKnightCard,
  timeFreezeCard,
  type EffectParams,
  NO_PARAMS,
} from '../src/cards/index.js';

console.log('=== Schach + Karten Integration ===\n');

// ===== Setup =====
let state: GameState = createInitialGameState();
console.log(`Spiel gestartet: ${state.currentPlayer} am Zug\n`);

// ===== Runde 1: Normaler Schachzug =====
console.log('--- Runde 1: Weiß zieht e2-e4 ---');

const e2 = { row: 1, col: 4 };
const e4 = { row: 3, col: 4 };
const piece = getPieceAt(state.boardState.board, e2);

const validation = validateMove(state.boardState.board, e2, e4, 'white');
console.log(`Zug-Validierung: ${validation.isValid ? '✓' : '✗'}`);

if (validation.isValid && piece) {
  const move: Move = {
    from: e2,
    to: e4,
    piece,
  };
  
  state = applyMove(state, move);
  console.log(`Zug ausgeführt: e2->e4`);
  console.log(`Nächster Spieler: ${state.currentPlayer}\n`);
}

// ===== Runde 2: Schwarz spielt Karte statt Zug =====
console.log('--- Runde 2: Schwarz spielt "Time Freeze" Karte ---');
console.log(`Karte: ${timeFreezeCard.name}`);
console.log(`Effekt: ${timeFreezeCard.description}\n`);

let result = playCard(state, timeFreezeCard, NO_PARAMS, 'black');
console.log(`Karten-Effekt: ${result.success ? '✓' : '✗'} - ${result.message}`);

if (result.success) {
  state = result.newState;
  console.log(`Aktive Board-Effekte: ${state.boardState.effects.length}`);
  
  // Zeige Effekt-Details
  if (state.boardState.effects.length > 0) {
    const effect = state.boardState.effects[0];
    console.log(`  → Typ: ${effect.type}`);
    console.log(`  → Verbleibende Runden: ${effect.remainingTurns}\n`);
  }
}

// ===== Runde 3: Weiß versucht zu ziehen (sollte übersprungen werden) =====
console.log('--- Runde 3: Effekt aktiv ---');
console.log(`Time Freeze aktiv: Weiß überspringt theoretisch den Zug`);
console.log(`(In echter Implementierung würde Game-Loop das Skip-Flag auswerten)\n`);

// ===== Runde 4: Schwarz spielt Summon Knight Karte =====
console.log('--- Runde 4: Schwarz spielt "Summon Knight" Karte ---');

const knightParams: EffectParams = {
  type: 'spawn',
  targetPosition: { row: 5, col: 2 }, // c6
  pieceType: 'knight',
};

result = playCard(state, summonKnightCard, knightParams, 'black');
console.log(`Karten-Effekt: ${result.success ? '✓' : '✗'} - ${result.message}`);

if (result.success) {
  state = result.newState;
  const spawnedPiece = getPieceAt(state.boardState.board, { row: 5, col: 2 });
  console.log(`Gespawnte Figur:`, spawnedPiece);
  console.log();
}

// ===== Zeige mögliche Züge des gespawnten Springers =====
console.log('--- Springer-Züge von c6 ---');
const knightMoves = generatePieceMoves(state.boardState.board, { row: 5, col: 2 });
console.log(`Mögliche Züge: ${knightMoves.length}`);
knightMoves.slice(0, 4).forEach((pos, i) => {
  const col = String.fromCharCode('a'.charCodeAt(0) + pos.col);
  const row = pos.row + 1;
  console.log(`  ${i + 1}. ${col}${row}`);
});
if (knightMoves.length > 4) {
  console.log(`  ... +${knightMoves.length - 4} weitere`);
}
console.log();

// ===== Finale Statistiken =====
console.log('=== Zusammenfassung ===');
console.log(`Aktueller Spieler: ${state.currentPlayer}`);
console.log(`Zug-Nummer: ${state.turnNumber}`);
console.log(`Gespielte Züge: ${state.moveHistory.length}`);
console.log(`Aktive Karten-Effekte: ${state.boardState.effects.length}`);
console.log(`Status: ${state.status}`);
console.log();

console.log('Das System ermöglicht:');
console.log('  ✓ Normale Schachzüge mit vollständiger Validierung');
console.log('  ✓ Karten-Effekte die den GameState kontrolliert ändern');
console.log('  ✓ Kombination von Zügen und Karten in einer Partie');
console.log('  ✓ Effekte mit Dauer (z.B. Skip Turn für X Runden)');
console.log('  ✓ Board-Modifikation durch Karten (Spawn Pieces)');
console.log();

console.log('=== Demo abgeschlossen ===');
