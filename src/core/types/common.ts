/**
 * Gemeinsame Basis-Typen für die Schach-Engine
 * 
 * Diese Datei enthält alle grundlegenden Typen, die im gesamten Core verwendet werden.
 * Keine Logik, nur Typ-Definitionen für maximale Wiederverwendbarkeit.
 */

/**
 * Spielerfarbe: Weiß beginnt immer
 */
export type Color = 'white' | 'black';

/**
 * Schachfiguren-Typen
 */
export type PieceType = 'pawn' | 'knight' | 'bishop' | 'rook' | 'queen' | 'king';

/**
 * Eine Schachfigur mit Farbe und Typ
 */
export interface Piece {
  readonly type: PieceType;
  readonly color: Color;
  readonly hasMoved: boolean; // Wichtig für Rochade & Bauern-Doppelschritt
}

/**
 * Position auf dem Brett (0-basiert)
 * row: 0 = Reihe 1 (weiß), 7 = Reihe 8 (schwarz)
 * col: 0 = a, 7 = h
 */
export interface Position {
  readonly row: number;
  readonly col: number;
}

/**
 * Ein Spielzug von einer Position zu einer anderen
 */
export interface Move {
  readonly from: Position;
  readonly to: Position;
  readonly piece: Piece;
  readonly capturedPiece?: Piece;     // Geschlagene Figur (falls vorhanden)
  readonly promotion?: PieceType;      // Bauernumwandlung
  readonly isEnPassant?: boolean;      // En-passant-Schlag
  readonly isCastling?: boolean;       // Rochade
  readonly cardId?: string;            // Referenz zur verwendeten Karte (optional)
}

/**
 * Spiel-Status
 */
export type GameStatus = 
  | 'active'           // Spiel läuft
  | 'check'            // Schach
  | 'checkmate'        // Schachmatt
  | 'stalemate'        // Patt
  | 'draw'             // Remis (z.B. durch Vereinbarung)
  | 'resigned';        // Aufgabe

/**
 * Aktiver Effekt auf dem Brett (z.B. durch Karten)
 */
export interface BoardEffect {
  readonly id: string;
  readonly type: string;              // z.B. 'freeze_piece', 'extra_move'
  readonly targetPosition?: Position; // Optional: Betroffene Position
  readonly remainingTurns: number;    // Wie lange der Effekt noch wirkt
  readonly metadata?: unknown;        // Zusätzliche Effekt-Daten
}
