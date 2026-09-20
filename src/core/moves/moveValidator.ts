/**
 * Move-Validierung
 * 
 * Prüft ob ein Zug legal ist unter Berücksichtigung aller Regeln.
 */

import { Board, Position, MoveValidation, Color } from '../types/index.js';
import { getPieceAt, positionsEqual, movePiece } from '../board/boardUtils.js';
import { generatePieceMoves } from './moveGenerator.js';

/**
 * Prüft ob ein Zug grundsätzlich gültig ist
 * (ohne Schach-Prüfung)
 * 
 * @param board - Das Spielbrett
 * @param from - Startposition
 * @param to - Zielposition
 * @param playerColor - Farbe des ziehenden Spielers
 * @returns Validierungsergebnis
 */
export function validateMoveBasic(
  board: Board,
  from: Position,
  to: Position,
  playerColor: Color
): MoveValidation {
  const piece = getPieceAt(board, from);
  
  // Keine Figur an Startposition
  if (!piece) {
    return {
      isValid: false,
      reason: 'No piece at start position',
    };
  }
  
  // Falsche Farbe
  if (piece.color !== playerColor) {
    return {
      isValid: false,
      reason: 'Cannot move opponent piece',
    };
  }
  
  // Start = Ziel
  if (positionsEqual(from, to)) {
    return {
      isValid: false,
      reason: 'Start and destination are the same',
    };
  }
  
  // Ist das Ziel in den möglichen Zügen?
  const possibleMoves = generatePieceMoves(board, from);
  const isMoveAllowed = possibleMoves.some((pos: Position) => 
    positionsEqual(pos, to)
  );
  
  if (!isMoveAllowed) {
    return {
      isValid: false,
      reason: 'Move not allowed for this piece',
    };
  }
  
  return { isValid: true };
}

/**
 * Findet die Position des Königs einer Farbe
 * 
 * @param board - Das Spielbrett
 * @param color - Farbe des Königs
 * @returns Position des Königs oder null
 */
export function findKing(board: Board, color: Color): Position | null {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = getPieceAt(board, { row, col });
      if (piece && piece.type === 'king' && piece.color === color) {
        return { row, col };
      }
    }
  }
  return null;
}

/**
 * Prüft ob eine Position von einem Gegner angegriffen wird
 * 
 * @param board - Das Spielbrett
 * @param position - Zu prüfende Position
 * @param attackerColor - Farbe des Angreifers
 * @returns true wenn Position angegriffen wird
 */
export function isPositionAttacked(
  board: Board,
  position: Position,
  attackerColor: Color
): boolean {
  // Prüfe alle gegnerischen Figuren
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = getPieceAt(board, { row, col });
      
      if (piece && piece.color === attackerColor) {
        const moves = generatePieceMoves(board, { row, col });
        
        // Kann diese Figur die Position angreifen?
        if (moves.some((pos: Position) => positionsEqual(pos, position))) {
          return true;
        }
      }
    }
  }
  
  return false;
}

/**
 * Prüft ob ein Spieler im Schach steht
 * 
 * @param board - Das Spielbrett
 * @param color - Farbe des Spielers
 * @returns true wenn König im Schach steht
 */
export function isInCheck(board: Board, color: Color): boolean {
  const kingPos = findKing(board, color);
  
  if (!kingPos) {
    return false; // Kein König (sollte nicht vorkommen)
  }
  
  const opponentColor = color === 'white' ? 'black' : 'white';
  return isPositionAttacked(board, kingPos, opponentColor);
}

/**
 * Prüft ob ein Zug den eigenen König in Schach setzen würde
 * 
 * @param board - Das Spielbrett
 * @param from - Startposition
 * @param to - Zielposition
 * @param color - Farbe des ziehenden Spielers
 * @returns true wenn Zug illegal (König in Schach)
 */
export function wouldExposeKing(
  board: Board,
  from: Position,
  to: Position,
  color: Color
): boolean {
  // Simuliere den Zug
  const newBoard = movePiece(board, from, to);
  
  // Prüfe ob König im Schach steht
  return isInCheck(newBoard, color);
}

/**
 * Vollständige Move-Validierung
 * Prüft alle Regeln inkl. Schach
 * 
 * @param board - Das Spielbrett
 * @param from - Startposition
 * @param to - Zielposition
 * @param playerColor - Farbe des ziehenden Spielers
 * @returns Validierungsergebnis
 */
export function validateMove(
  board: Board,
  from: Position,
  to: Position,
  playerColor: Color
): MoveValidation {
  // Basis-Validierung
  const basicValidation = validateMoveBasic(board, from, to, playerColor);
  
  if (!basicValidation.isValid) {
    return basicValidation;
  }
  
  // Würde der Zug den eigenen König in Schach setzen?
  if (wouldExposeKing(board, from, to, playerColor)) {
    return {
      isValid: false,
      reason: 'Move would expose king to check',
    };
  }
  
  return { isValid: true };
}

/**
 * Prüft ob ein Spieler im Schachmatt ist
 * 
 * @param board - Das Spielbrett
 * @param color - Farbe des Spielers
 * @returns true wenn Schachmatt
 */
export function isCheckmate(board: Board, color: Color): boolean {
  // Muss im Schach sein
  if (!isInCheck(board, color)) {
    return false;
  }
  
  // Gibt es einen legalen Zug?
  return !hasLegalMove(board, color);
}

/**
 * Prüft ob ein Spieler im Patt ist
 * 
 * @param board - Das Spielbrett
 * @param color - Farbe des Spielers
 * @returns true wenn Patt
 */
export function isStalemate(board: Board, color: Color): boolean {
  // Darf NICHT im Schach sein
  if (isInCheck(board, color)) {
    return false;
  }
  
  // Keine legalen Züge mehr
  return !hasLegalMove(board, color);
}

/**
 * Prüft ob ein Spieler mindestens einen legalen Zug hat
 * 
 * @param board - Das Spielbrett
 * @param color - Farbe des Spielers
 * @returns true wenn mindestens ein legaler Zug existiert
 */
export function hasLegalMove(board: Board, color: Color): boolean {
  // Prüfe alle eigenen Figuren
  for (let fromRow = 0; fromRow < 8; fromRow++) {
    for (let fromCol = 0; fromCol < 8; fromCol++) {
      const piece = getPieceAt(board, { row: fromRow, col: fromCol });
      
      if (piece && piece.color === color) {
        const moves = generatePieceMoves(board, { row: fromRow, col: fromCol });
        
        // Prüfe jeden möglichen Zug
        for (const to of moves) {
          const validation = validateMove(
            board,
            { row: fromRow, col: fromCol },
            to,
            color
          );
          
          if (validation.isValid) {
            return true; // Mindestens ein legaler Zug gefunden
          }
        }
      }
    }
  }
  
  return false; // Keine legalen Züge
}
