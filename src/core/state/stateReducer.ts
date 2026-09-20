/**
 * State-Reducer für Game-State-Transformationen
 * 
 * Alle Zustandsänderungen laufen über reine Reducer-Funktionen.
 * Keine Seiteneffekte, always immutable.
 */

import { GameState, Move, Color, Board, CastlingRights, Position, Piece, PieceType } from '../types/index.js';
import { movePiece, setPieceAt } from '../board/boardUtils.js';

/**
 * Gibt die gegnerische Farbe zurück
 */
export function getOpponentColor(color: Color): Color {
  return color === 'white' ? 'black' : 'white';
}

/**
 * Prüft ob ein Zug eine Rochade ist
 */
function isCastlingMove(move: Move): boolean {
  return move.piece.type === 'king' && Math.abs(move.from.col - move.to.col) === 2;
}

/**
 * Prüft ob ein Zug ein En Passant ist
 */
function isEnPassantMove(move: Move, enPassantTarget?: Position): boolean {
  if (move.piece.type !== 'pawn' || !enPassantTarget) {
    return false;
  }
  
  // Diagonal-Zug auf leeres Feld = En Passant
  const isDiagonal = Math.abs(move.from.col - move.to.col) === 1;
  const isToEnPassantTarget = 
    move.to.row === enPassantTarget.row && 
    move.to.col === enPassantTarget.col;
  
  return isDiagonal && isToEnPassantTarget && !move.capturedPiece;
}

/**
 * Berechnet neues En Passant Ziel nach einem Zug
 */
function calculateEnPassantTarget(move: Move): Position | undefined {
  // Nur bei Bauern-Doppelschritt
  if (move.piece.type !== 'pawn') {
    return undefined;
  }
  
  const rowDiff = Math.abs(move.to.row - move.from.row);
  if (rowDiff !== 2) {
    return undefined;
  }
  
  // En Passant Ziel ist das Feld zwischen Start und Ziel
  return {
    row: (move.from.row + move.to.row) / 2,
    col: move.from.col,
  };
}

/**
 * Prüft ob ein Bauernzug eine Umwandlung erfordert
 */
function requiresPromotion(move: Move): boolean {
  if (move.piece.type !== 'pawn') {
    return false;
  }
  
  // Weiß erreicht Reihe 7 (Index 7), Schwarz erreicht Reihe 0 (Index 0)
  const promotionRank = move.piece.color === 'white' ? 7 : 0;
  return move.to.row === promotionRank;
}

/**
 * Führt Bauernumwandlung aus
 * 
 * @param board - Das Spielbrett nach dem Zug
 * @param position - Position des umzuwandelnden Bauern
 * @param color - Farbe des Bauern
 * @param promotionType - Ziel-Figurentyp (default: queen)
 * @returns Neues Board mit umgewandelter Figur
 */
function executePromotion(
  board: Board,
  position: Position,
  color: Color,
  promotionType: PieceType = 'queen'
): Board {
  const promotedPiece: Piece = {
    type: promotionType,
    color,
    hasMoved: true,
  };
  
  return setPieceAt(board, position, promotedPiece);
}

/**
 * Führt Rochade aus (bewegt König und Turm)
 */
function executeCastling(board: Board, move: Move): Board {
  let newBoard = movePiece(board, move.from, move.to);
  
  // Bestimme Turm-Position und Ziel
  const isKingSide = move.to.col === 6;
  const rookFrom: Position = {
    row: move.from.row,
    col: isKingSide ? 7 : 0,
  };
  const rookTo: Position = {
    row: move.from.row,
    col: isKingSide ? 5 : 3,
  };
  
  // Bewege Turm
  newBoard = movePiece(newBoard, rookFrom, rookTo);
  
  return newBoard;
}

/**
 * Aktualisiert Rochade-Rechte nach einem Zug
 */
function updateCastlingRights(
  rights: CastlingRights,
  move: Move
): CastlingRights {
  const newRights = { ...rights };
  
  // König-Bewegung: Entferne beide Rochade-Rechte für diese Farbe
  if (move.piece.type === 'king') {
    if (move.piece.color === 'white') {
      newRights.whiteKingSide = false;
      newRights.whiteQueenSide = false;
    } else {
      newRights.blackKingSide = false;
      newRights.blackQueenSide = false;
    }
  }
  
  // Turm-Bewegung: Entferne Rochade-Recht für diese Seite
  if (move.piece.type === 'rook') {
    if (move.piece.color === 'white') {
      if (move.from.col === 0) {
        newRights.whiteQueenSide = false;
      } else if (move.from.col === 7) {
        newRights.whiteKingSide = false;
      }
    } else {
      if (move.from.col === 0) {
        newRights.blackQueenSide = false;
      } else if (move.from.col === 7) {
        newRights.blackKingSide = false;
      }
    }
  }
  
  // Turm wird geschlagen: Entferne Rochade-Recht
  if (move.capturedPiece?.type === 'rook') {
    if (move.capturedPiece.color === 'white') {
      if (move.to.col === 0 && move.to.row === 0) {
        newRights.whiteQueenSide = false;
      } else if (move.to.col === 7 && move.to.row === 0) {
        newRights.whiteKingSide = false;
      }
    } else {
      if (move.to.col === 0 && move.to.row === 7) {
        newRights.blackQueenSide = false;
      } else if (move.to.col === 7 && move.to.row === 7) {
        newRights.blackKingSide = false;
      }
    }
  }
  
  return newRights;
}

/**
 * Führt einen Zug aus und gibt den neuen GameState zurück
 * 
 * WICHTIG: Keine Validierung hier! Diese Funktion geht davon aus,
 * dass der Move bereits validiert wurde.
 * 
 * @param state - Aktueller GameState
 * @param move - Validierter Move
 * @returns Neuer GameState nach dem Zug
 */
export function applyMove(state: GameState, move: Move): GameState {
  // Prüfe Spezialzüge
  const isCastling = isCastlingMove(move);
  const isEnPassant = isEnPassantMove(move, state.boardState.enPassantTarget);
  const needsPromotion = requiresPromotion(move);
  
  // Bewege Figur(en) auf dem Brett
  let newBoard: Board;
  if (isCastling) {
    newBoard = executeCastling(state.boardState.board, move);
  } else {
    newBoard = movePiece(state.boardState.board, move.from, move.to);
    
    // Bei En Passant: Entferne den geschlagenen Bauern
    if (isEnPassant && state.boardState.enPassantTarget) {
      const capturedPawnRow = move.piece.color === 'white' 
        ? state.boardState.enPassantTarget.row - 1
        : state.boardState.enPassantTarget.row + 1;
      const capturedPawnPos: Position = {
        row: capturedPawnRow,
        col: state.boardState.enPassantTarget.col,
      };
      newBoard = setPieceAt(newBoard, capturedPawnPos, null);
    }
    
    // Bei Bauernumwandlung: Ersetze Bauer durch gewählte Figur
    if (needsPromotion) {
      const promotionType = move.promotion || 'queen'; // Default: Queen
      newBoard = executePromotion(newBoard, move.to, move.piece.color, promotionType);
    }
  }

  // Aktualisiere Rochade-Rechte
  const newCastlingRights = updateCastlingRights(
    state.boardState.castlingRights,
    move
  );

  // Berechne neues En Passant Ziel (nur gültig für einen Zug)
  const newEnPassantTarget = calculateEnPassantTarget(move);

  // Check for trap at destination
  const trapAtDestination = state.boardState.effects.find(
    effect => effect.type === 'trap' && 
              effect.targetPosition?.row === move.to.row && 
              effect.targetPosition?.col === move.to.col
  );
  
  // If trap exists, destroy the piece that moved there
  if (trapAtDestination) {
    newBoard = setPieceAt(newBoard, move.to, null);
  }

  // Dekrementiere aktive Effekte und entferne abgelaufene
  // Also remove triggered traps
  const updatedEffects = state.boardState.effects
    .filter(effect => {
      // Remove trap if it was triggered
      if (effect.type === 'trap' && trapAtDestination && effect.id === trapAtDestination.id) {
        return false;
      }
      return true;
    })
    .map(effect => ({
      ...effect,
      remainingTurns: effect.remainingTurns - 1,
    }))
    .filter(effect => effect.remainingTurns > 0);

  // Aktualisiere BoardState
  const newBoardState = {
    ...state.boardState,
    board: newBoard,
    castlingRights: newCastlingRights,
    enPassantTarget: newEnPassantTarget,
    effects: updatedEffects,
  };

  // Wechsle Spieler
  const nextPlayer = getOpponentColor(state.currentPlayer);

  // Erhöhe Turn-Number nach Schwarz
  const newTurnNumber = 
    state.currentPlayer === 'black' 
      ? state.turnNumber + 1 
      : state.turnNumber;

  // Update HalfMoveClock (für 50-Züge-Regel)
  const isCapture = move.capturedPiece !== undefined || isEnPassant;
  const isPawnMove = move.piece.type === 'pawn';
  const newHalfMoveClock = 
    isCapture || isPawnMove 
      ? 0 
      : state.halfMoveClock + 1;

  // Füge Move zur History hinzu (markiere Spezialzüge)
  const enrichedMove: Move = {
    ...move,
    isCastling,
    isEnPassant,
    promotion: needsPromotion ? (move.promotion || 'queen') : undefined,
  };
  const newMoveHistory = [...state.moveHistory, enrichedMove];

  return {
    ...state,
    boardState: newBoardState,
    currentPlayer: nextPlayer,
    moveHistory: newMoveHistory,
    turnNumber: newTurnNumber,
    halfMoveClock: newHalfMoveClock,
    // status wird separat durch Check-Detection aktualisiert
  };
}

/**
 * Setzt den Spielstatus
 * 
 * @param state - Aktueller GameState
 * @param status - Neuer Status
 * @returns Neuer GameState
 */
export function setGameStatus(
  state: GameState,
  status: GameState['status']
): GameState {
  return {
    ...state,
    status,
  };
}

/**
 * Setzt den Schach-Status
 * 
 * @param state - Aktueller GameState  
 * @param playerInCheck - Spieler im Schach (oder undefined)
 * @returns Neuer GameState
 */
export function setPlayerInCheck(
  state: GameState,
  playerInCheck: Color | undefined
): GameState {
  return {
    ...state,
    playerInCheck,
    status: playerInCheck ? 'check' : state.status,
  };
}
