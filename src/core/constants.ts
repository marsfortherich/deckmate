/**
 * Game Constants
 * 
 * Zentrale Spielkonstanten - alle Magic Numbers an einem Ort.
 */

/** Board-Dimensionen */
export const BOARD_SIZE = 8;
export const BOARD_MIN = 0;
export const BOARD_MAX = BOARD_SIZE - 1;

/** Stück-Limits */
export const MAX_PIECES_PER_COLOR = 16;
export const MAX_PAWNS_PER_COLOR = 8;

/** Turn-Limits */
export const MIN_TURN_NUMBER = 1;
export const MAX_TURN_NUMBER = 999;

/** Hand-Limits */
export const DEFAULT_MAX_MOVE_CARDS = 5;
export const DEFAULT_MAX_SPECIAL_CARDS = 1;
export const DEFAULT_DRAW_MOVE_CARDS = 5;

/** Deck-Limits */
export const MIN_DECK_SIZE = 15;
export const MAX_DECK_SIZE = 60;
export const DEFAULT_MAX_HAND_SIZE = 7;
export const DEFAULT_INITIAL_DRAW = 5;

/** Validierungs-Konstanten */
export const MAX_CARD_COPIES = 4;

/** Position-Konstanten */
export const STARTING_ROW_WHITE = 0;
export const STARTING_ROW_BLACK = 7;
export const PAWN_ROW_WHITE = 1;
export const PAWN_ROW_BLACK = 6;
