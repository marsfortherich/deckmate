/**
 * Shared types for Cloud Functions
 */

export interface Position {
  row: number;
  col: number;
}

export interface Move {
  from: Position;
  to: Position;
  promotion?: 'queen' | 'rook' | 'bishop' | 'knight';
}

export interface MakeMoveRequest {
  matchId: string;
  move: Move;
}

export interface PlayCardRequest {
  matchId: string;
  cardInstanceId: string;
  params?: any;
}

export interface MakeMoveResponse {
  success: boolean;
  error?: string;
  gameState?: any;
}

export interface PlayCardResponse {
  success: boolean;
  error?: string;
  gameState?: any;
  requiresDecision?: boolean;
  pendingCard?: any;
}
