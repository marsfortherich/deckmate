/**
 * Utility-Funktionen für Board-Operationen
 * 
 * Reine Funktionen für häufige Board-Operationen.
 * Alle Funktionen sind immutable und haben keine Seiteneffekte.
 */

import { Board, BoardState, Piece, Position } from '../types/index.js';
import { BOARD_SIZE, BOARD_MIN } from '../constants.js';

/**
 * Prüft, ob eine Position innerhalb des Bretts liegt
 */
export function isValidPosition(pos: Position): boolean {
  return pos.row >= BOARD_MIN && pos.row < BOARD_SIZE && 
         pos.col >= BOARD_MIN && pos.col < BOARD_SIZE;
}

/**
 * Type Guard: Prüft ob Position definiert und valid ist
 */
export function isPosition(value: unknown): value is Position {
  if (!value || typeof value !== 'object') return false;
  const pos = value as any;
  return typeof pos.row === 'number' && 
         typeof pos.col === 'number' &&
         isValidPosition(pos);
}

/**
 * Assertion: Wirft Error wenn Position ungültig
 */
export function assertValidPosition(pos: Position, context?: string): asserts pos is Position {
  if (!isValidPosition(pos)) {
    const msg = context 
      ? `Invalid position in ${context}: (${pos.row}, ${pos.col})`
      : `Invalid position: (${pos.row}, ${pos.col})`;
    throw new Error(msg);
  }
}

/**
 * Holt eine Figur von einer Position
 * 
 * @returns Die Figur oder null, falls das Feld leer oder ungültig ist
 */
export function getPieceAt(board: Board, pos: Position): Piece | null {
  if (!isValidPosition(pos)) {
    return null;
  }
  return board[pos.row][pos.col];
}

/**
 * Setzt eine Figur auf eine Position
 * 
 * WICHTIG: Erzeugt ein neues Board (immutable)
 * 
 * @returns Neues Board mit der Figur an der Position
 */
export function setPieceAt(
  board: Board,
  pos: Position,
  piece: Piece | null
): Board {
  if (!isValidPosition(pos)) {
    return board; // Ungültige Position = keine Änderung
  }

  // Erstelle neues Board durch Kopie
  return board.map((row: ReadonlyArray<Piece | null>, rowIndex: number): ReadonlyArray<Piece | null> =>
    rowIndex === pos.row
      ? row.map((cell: Piece | null, colIndex: number): Piece | null =>
          colIndex === pos.col ? piece : cell
        )
      : row
  );
}

/**
 * Bewegt eine Figur von einer Position zu einer anderen
 * 
 * WICHTIG: Erzeugt ein neues Board (immutable)
 * Setzt hasMoved auf true
 * 
 * @returns Neues Board nach der Bewegung
 */
export function movePiece(
  board: Board,
  from: Position,
  to: Position
): Board {
  const piece = getPieceAt(board, from);
  
  if (!piece) {
    return board; // Keine Figur zum Bewegen
  }

  // Markiere Figur als bewegt
  const movedPiece: Piece = {
    ...piece,
    hasMoved: true,
  };

  // Entferne von Startposition, setze auf Zielposition
  let newBoard = setPieceAt(board, from, null);
  newBoard = setPieceAt(newBoard, to, movedPiece);

  return newBoard;
}

/**
 * Vergleicht zwei Positionen auf Gleichheit
 */
export function positionsEqual(a: Position, b: Position): boolean {
  return a.row === b.row && a.col === b.col;
}

/**
 * Erstellt eine Position (mit Validierung)
 */
export function createPosition(row: number, col: number): Position | null {
  const pos = { row, col };
  return isValidPosition(pos) ? pos : null;
}

/**
 * Konvertiert algebraische Notation (z.B. "e4") zu Position
 * 
 * @example "e4" -> { row: 3, col: 4 }
 */
export function algebraicToPosition(algebraic: string): Position | null {
  if (algebraic.length !== 2) {
    return null;
  }

  const col = algebraic.charCodeAt(0) - 'a'.charCodeAt(0);
  const row = parseInt(algebraic[1], 10) - 1;

  return createPosition(row, col);
}

/**
 * Konvertiert Position zu algebraischer Notation
 * 
 * @example { row: 3, col: 4 } -> "e4"
 */
export function positionToAlgebraic(pos: Position): string {
  if (!isValidPosition(pos)) {
    return '??';
  }

  const col = String.fromCharCode('a'.charCodeAt(0) + pos.col);
  const row = (pos.row + 1).toString();

  return col + row;
}

/**
 * Erstellt ein leeres BoardState mit Standard-Rochade-Rechten
 */
export function createEmptyBoardState(board: Board): BoardState {
  return {
    board,
    castlingRights: {
      whiteKingSide: true,
      whiteQueenSide: true,
      blackKingSide: true,
      blackQueenSide: true,
    },
    effects: [],
  };
}
