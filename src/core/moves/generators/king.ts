/**
 * König-Move-Generator
 * 
 * König bewegt sich ein Feld in alle Richtungen.
 * Unterstützt Rochade (Castling).
 */

import { Board, Position, Color, BoardState } from '../../types/index.js';
import { generateMultiDirectionalMoves, ALL_DIRECTIONS } from '../moveUtils.js';
import { getPieceAt } from '../../board/boardUtils.js';
import { isPositionAttacked } from '../moveValidator.js';

/**
 * Generiert mögliche König-Züge (inkl. Rochade)
 * 
 * König bewegt sich ein Feld in alle 8 Richtungen.
 * Bei Rochade bewegt sich der König 2 Felder zur Seite.
 * 
 * @param board - Das Spielbrett
 * @param position - Position des Königs
 * @param color - Farbe des Königs
 * @param boardState - Vollständiger BoardState (für Rochade-Rechte)
 * @returns Array von möglichen Zielpositionen
 */
export function generateKingMoves(
  board: Board,
  position: Position,
  color: Color,
  boardState?: BoardState
): Position[] {
  // Normale König-Züge (ein Feld in alle Richtungen)
  const normalMoves = generateMultiDirectionalMoves(
    board,
    position,
    ALL_DIRECTIONS,
    color,
    1  // Nur ein Feld weit
  );

  // Füge Rochade hinzu (falls BoardState verfügbar)
  if (boardState) {
    const castlingMoves = generateCastlingMoves(board, position, color, boardState);
    return [...normalMoves, ...castlingMoves];
  }

  return normalMoves;
}

/**
 * Generiert mögliche Rochade-Züge
 * 
 * Rochade-Bedingungen:
 * - König und Turm haben noch nicht gezogen
 * - Keine Figuren zwischen König und Turm
 * - König steht nicht im Schach
 * - König zieht nicht durch Schach
 * - König landet nicht im Schach
 * 
 * @param board - Das Spielbrett
 * @param kingPos - Position des Königs
 * @param color - Farbe des Königs
 * @param boardState - BoardState mit Rochade-Rechten
 * @returns Array von Rochade-Zielpositionen
 */
function generateCastlingMoves(
  board: Board,
  kingPos: Position,
  color: Color,
  boardState: BoardState
): Position[] {
  const moves: Position[] = [];
  const { castlingRights } = boardState;
  const opponentColor = color === 'white' ? 'black' : 'white';
  
  // König darf nicht im Schach stehen
  if (isPositionAttacked(board, kingPos, opponentColor)) {
    return moves;
  }

  // Rochade kurz (Königsseite)
  if (color === 'white' && castlingRights.whiteKingSide) {
    const target = { row: 0, col: 6 };
    if (canCastleKingSide(board, color, opponentColor)) {
      moves.push(target);
    }
  } else if (color === 'black' && castlingRights.blackKingSide) {
    const target = { row: 7, col: 6 };
    if (canCastleKingSide(board, color, opponentColor)) {
      moves.push(target);
    }
  }

  // Rochade lang (Damenseite)
  if (color === 'white' && castlingRights.whiteQueenSide) {
    const target = { row: 0, col: 2 };
    if (canCastleQueenSide(board, color, opponentColor)) {
      moves.push(target);
    }
  } else if (color === 'black' && castlingRights.blackQueenSide) {
    const target = { row: 7, col: 2 };
    if (canCastleQueenSide(board, color, opponentColor)) {
      moves.push(target);
    }
  }

  return moves;
}

/**
 * Prüft ob Rochade kurz (Königsseite) möglich ist
 */
function canCastleKingSide(board: Board, color: Color, opponentColor: Color): boolean {
  const row = color === 'white' ? 0 : 7;
  
  // Felder zwischen König und Turm müssen leer sein
  const f1 = { row, col: 5 };
  const g1 = { row, col: 6 };
  
  if (getPieceAt(board, f1) !== null || getPieceAt(board, g1) !== null) {
    return false;
  }

  // König darf nicht durch Schach ziehen
  if (isPositionAttacked(board, f1, opponentColor) || isPositionAttacked(board, g1, opponentColor)) {
    return false;
  }

  return true;
}

/**
 * Prüft ob Rochade lang (Damenseite) möglich ist
 */
function canCastleQueenSide(board: Board, color: Color, opponentColor: Color): boolean {
  const row = color === 'white' ? 0 : 7;
  
  // Felder zwischen König und Turm müssen leer sein
  const d1 = { row, col: 3 };
  const c1 = { row, col: 2 };
  const b1 = { row, col: 1 };
  
  if (getPieceAt(board, d1) !== null || getPieceAt(board, c1) !== null || getPieceAt(board, b1) !== null) {
    return false;
  }

  // König darf nicht durch Schach ziehen (b1 muss nicht geprüft werden)
  if (isPositionAttacked(board, d1, opponentColor) || isPositionAttacked(board, c1, opponentColor)) {
    return false;
  }

  return true;
}
