/**
 * Move Card System
 * 
 * Konvertiert legale Schachzüge in Zugkarten.
 * Spieler spielen Karten statt direkt Züge zu machen.
 */

import { Board, BoardState, Position, Move, Color, PieceType } from '../../core/types/index.js';
import { Card } from '../types/card.js';
import { EffectDefinition, EffectContext, EffectResult } from '../types/effect.js';
import { generatePieceMoves, getPieceAt, positionToAlgebraic } from '../../core/index.js';
import { applyMove } from '../../core/index.js';
import { wouldExposeKing } from '../../core/moves/moveValidator.js';

/**
 * Beschreibender Name für einen Zug
 * z.B. "Knight to e4", "Pawn captures on d5"
 */
export function describeMoveCard(
  pieceType: PieceType,
  from: Position,
  to: Position,
  isCapture: boolean
): string {
  const pieceNames = {
    pawn: 'Pawn',
    knight: 'Knight',
    bishop: 'Bishop',
    rook: 'Rook',
    queen: 'Queen',
    king: 'King',
  };
  
  const fromAlg = positionToAlgebraic(from);
  const toAlg = positionToAlgebraic(to);
  const pieceName = pieceNames[pieceType];
  
  if (isCapture) {
    return `${pieceName} ${fromAlg} captures ${toAlg}`;
  }
  
  return `${pieceName} ${fromAlg} → ${toAlg}`;
}

/**
 * Erstellt einen Effekt der einen spezifischen Zug ausführt
 * 
 * @param move - Der auszuführende Zug
 * @returns EffectDefinition die diesen Zug ausführt
 */
function createMoveEffect(move: Move): EffectDefinition {
  return {
    id: `move-${Date.now()}-${Math.random()}`,
    name: 'Execute Move',
    description: 'Executes a chess move',
    type: 'board-modification',
    timing: 'immediate',
    
    execute: (context: EffectContext): EffectResult => {
      const { state, playerId } = context;
      
      // Validiere dass der Spieler am Zug ist
      if (state.currentPlayer !== playerId) {
        return {
          newState: state,
          success: false,
          message: 'Not your turn',
        };
      }
      
      // Führe Zug aus
      const newState = applyMove(state, move);
      
      return {
        newState,
        success: true,
        message: `Move executed: ${positionToAlgebraic(move.from)} to ${positionToAlgebraic(move.to)}`,
      };
    },
    
    validate: (context: EffectContext) => {
      // Prüfe ob Spieler am Zug
      if (context.state.currentPlayer !== context.playerId) {
        return {
          isValid: false,
          reason: 'Not your turn',
        };
      }
      
      return { isValid: true };
    },
  };
}

/**
 * Konvertiert einen Zug in eine Zugkarte
 * 
 * @param board - Das Spielbrett
 * @param from - Startposition
 * @param to - Zielposition
 * @param color - Farbe des Spielers
 * @param promotionPiece - Optional: piece type for pawn promotion
 * @returns Card die diesen Zug ausführt
 */
export function createMoveCard(
  board: Board,
  from: Position,
  to: Position,
  color: Color,
  promotionPiece?: PieceType
): Card | null {
  const piece = getPieceAt(board, from);
  if (!piece || piece.color !== color) {
    return null;
  }
  
  const targetPiece = getPieceAt(board, to);
  const isCapture = targetPiece !== null;
  
  const move: Move = {
    from,
    to,
    piece,
    capturedPiece: targetPiece || undefined,
    promotion: promotionPiece,
  };
  
  let cardName = describeMoveCard(piece.type, from, to, isCapture);
  
  // Add promotion indicator to card name
  if (promotionPiece) {
    const promotionNames = {
      queen: '♛ Queen',
      rook: '♜ Rook', 
      bishop: '♝ Bishop',
      knight: '♞ Knight',
      pawn: 'Pawn',
      king: 'King',
    };
    cardName += ` → ${promotionNames[promotionPiece]}`;
  }
  
  return {
    id: promotionPiece 
      ? `move-${positionToAlgebraic(from)}-${positionToAlgebraic(to)}-${promotionPiece}`
      : `move-${positionToAlgebraic(from)}-${positionToAlgebraic(to)}`,
    name: cardName,
    description: `Move from ${positionToAlgebraic(from)} to ${positionToAlgebraic(to)}${promotionPiece ? `, promote to ${promotionPiece}` : ''}`,
    rarity: promotionPiece ? 'rare' : 'common',
    cost: { mana: 0 }, // Zugkarten kosten nichts
    effect: createMoveEffect(move),
    flavorText: isCapture ? '⚔️ Capture!' : (promotionPiece ? '👑 Promotion!' : undefined),
  };
}

/**
 * Generiert alle möglichen Zugkarten für einen Spieler
 * 
 * WICHTIG: Filtert nach legalen Zügen (keine Schach-Selbstgefährdung)
 * 
 * @param boardState - Der vollständige BoardState (für Spezialregeln)
 * @param color - Farbe des Spielers
 * @returns Array von Zugkarten
 */
export function generateMoveCards(
  boardState: BoardState,
  color: Color
): Card[] {
  const cards: Card[] = [];
  const board = boardState.board;
  
  // Durchlaufe alle Figuren des Spielers
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const from: Position = { row, col };
      const piece = getPieceAt(board, from);
      
      if (piece && piece.color === color) {
        // Generiere mögliche Züge für diese Figur (inkl. Spezialregeln)
        const moves = generatePieceMoves(board, from, boardState);
        
        // Konvertiere jeden Zug in eine Karte
        for (const to of moves) {
          // Filter out moves that would leave king in check
          if (wouldExposeKing(board, from, to, color)) {
            continue; // Skip illegal moves
          }
          
          // Check if this is a pawn promotion move
          const promotionRank = color === 'white' ? 7 : 0;
          const isPawnPromotion = piece.type === 'pawn' && to.row === promotionRank;
          
          if (isPawnPromotion) {
            // Create a card for each promotion option
            const promotionOptions: PieceType[] = ['queen', 'rook', 'bishop', 'knight'];
            for (const promotionPiece of promotionOptions) {
              const card = createMoveCard(board, from, to, color, promotionPiece);
              if (card) {
                cards.push(card);
              }
            }
          } else {
            // Normal move - create single card
            const card = createMoveCard(board, from, to, color);
            if (card) {
              cards.push(card);
            }
          }
        }
      }
    }
  }
  
  return cards;
}

/**
 * Filtert Zugkarten nach bestimmten Kriterien
 * 
 * Beispiele:
 * - Nur Springer-Züge
 * - Nur Captures
 * - Nur Züge in bestimmte Zone
 */
export function filterMoveCards(
  cards: Card[],
  filter: {
    pieceType?: PieceType;
    capturesOnly?: boolean;
    minRow?: number;
    maxRow?: number;
  }
): Card[] {
  return cards.filter((card) => {
    // Filter nach Figuren-Typ (aus Beschreibung extrahieren)
    if (filter.pieceType) {
      const typeMatch = card.name.toLowerCase().includes(filter.pieceType.toLowerCase());
      if (!typeMatch) return false;
    }
    
    // Filter nach Captures
    if (filter.capturesOnly) {
      const isCapture = card.name.includes('captures');
      if (!isCapture) return false;
    }
    
    // Weitere Filter könnten hier implementiert werden
    
    return true;
  });
}
