/**
 * Beispiel: Verwendung der Schach-Engine
 * 
 * Demonstriert die grundlegende API ohne UI-Abhängigkeiten.
 */

import {
  createInitialGameState,
  applyMove,
  getPieceAt,
  generatePieceMoves,
  validateMove,
  isInCheck,
  isCheckmate,
  positionToAlgebraic,
  algebraicToPosition,
  type GameState,
  type Position,
  type Move,
} from './core/index.js';

// ===== 1. Neues Spiel starten =====
console.log('=== Neues Schachspiel ===\n');

let gameState: GameState = createInitialGameState();
console.log(`Spieler am Zug: ${gameState.currentPlayer}`);
console.log(`Status: ${gameState.status}`);
console.log(`Zug-Nummer: ${gameState.turnNumber}\n`);

// ===== 2. Figur auf dem Brett abfragen =====
const e2: Position = { row: 1, col: 4 }; // e2 (weißer Bauer)
const piece = getPieceAt(gameState.boardState.board, e2);

console.log(`Figur auf ${positionToAlgebraic(e2)}:`, piece);
console.log(); // { type: 'pawn', color: 'white', hasMoved: false }

// ===== 3. Mögliche Züge generieren =====
const possibleMoves = generatePieceMoves(gameState.boardState.board, e2);
console.log(`Mögliche Züge von ${positionToAlgebraic(e2)}:`);
possibleMoves.forEach((pos: Position) => {
  console.log(`  - ${positionToAlgebraic(pos)}`);
});
console.log(); // e3, e4 (Bauer kann 1 oder 2 Felder vorwärts da noch nicht bewegt)

// ===== 4. Zug validieren =====
const e4: Position = { row: 3, col: 4 }; // e4
const validation = validateMove(
  gameState.boardState.board,
  e2,
  e4,
  gameState.currentPlayer
);

console.log(`Ist e2-e4 gültig? ${validation.isValid}`);
if (!validation.isValid) {
  console.log(`Grund: ${validation.reason}`);
}
console.log();

// ===== 5. Zug ausführen =====
if (validation.isValid && piece) {
  const move: Move = {
    from: e2,
    to: e4,
    piece: piece,
  };
  
  gameState = applyMove(gameState, move);
  
  console.log(`Zug ausgeführt: e2 -> e4`);
  console.log(`Aktueller Spieler: ${gameState.currentPlayer}`);
  console.log(`Zug-Historie Länge: ${gameState.moveHistory.length}`);
  console.log();
}

// ===== 6. Schach prüfen =====
const whiteInCheck = isInCheck(gameState.boardState.board, 'white');
const blackInCheck = isInCheck(gameState.boardState.board, 'black');

console.log(`Weiß im Schach? ${whiteInCheck}`);
console.log(`Schwarz im Schach? ${blackInCheck}`);
console.log();

// ===== 7. Schachmatt prüfen =====
const whiteCheckmated = isCheckmate(gameState.boardState.board, 'white');
const blackCheckmated = isCheckmate(gameState.boardState.board, 'black');

console.log(`Weiß Schachmatt? ${whiteCheckmated}`);
console.log(`Schwarz Schachmatt? ${blackCheckmated}`);
console.log();

// ===== 8. Algebraische Notation verwenden =====
const pos = algebraicToPosition('d4');
console.log(`Position von 'd4':`, pos); // { row: 3, col: 3 }

if (pos) {
  const figur = getPieceAt(gameState.boardState.board, pos);
  console.log(`Figur auf d4:`, figur); // null (leer)
}
console.log();

console.log('=== Beispiel abgeschlossen ===');

/**
 * Erwartete Ausgabe:
 * 
 * === Neues Schachspiel ===
 * 
 * Spieler am Zug: white
 * Status: active
 * Zug-Nummer: 1
 * 
 * Figur auf e2: { type: 'pawn', color: 'white', hasMoved: false }
 * 
 * Mögliche Züge von e2:
 *   - e3
 * 
 * Ist e2-e4 gültig? true
 * 
 * Zug ausgeführt: e2 -> e4
 * Aktueller Spieler: black
 * Zug-Historie Länge: 1
 * 
 * Weiß im Schach? false
 * Schwarz im Schach? false
 * 
 * Weiß Schachmatt? false
 * Schwarz Schachmatt? false
 * 
 * Position von 'd4': { row: 3, col: 3 }
 * Figur auf d4: null
 * 
 * === Beispiel abgeschlossen ===
 */
