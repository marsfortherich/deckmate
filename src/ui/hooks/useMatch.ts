import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../auth/AuthProvider';
import {
  Match,
  createMatch as createMatchService,
  acceptMatch as acceptMatchService,
  updateGameState as updateGameStateService,
  finishMatch as finishMatchService,
  subscribeToMatch,
  getMatch as getMatchService,
} from '../../services/matchService';
import { logger } from '../../utils/logger';

export interface UseMatchReturn {
  match: Match | null;
  loading: boolean;
  error: string | null;
  createMatch: (opponentUid: string, initialGameState?: any) => Promise<string>;
  acceptMatch: () => Promise<void>;
  updateGameState: (gameState: any) => Promise<void>;
  finishMatch: () => Promise<void>;
  loadMatch: (matchId: string) => Promise<void>;
}

/**
 * Hook für Match-Management
 * 
 * Features:
 * - Real-time Match Updates
 * - Create/Accept/Update/Finish Match
 * - Auto-subscription zu aktivem Match
 */
export const useMatch = (matchId?: string): UseMatchReturn => {
  const { user } = useAuth();
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeMatchId, setActiveMatchId] = useState<string | undefined>(matchId);

  // Subscribe to match updates
  useEffect(() => {
    if (!activeMatchId) {
      setMatch(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToMatch(activeMatchId, (updatedMatch) => {
      setMatch(updatedMatch);
      setLoading(false);
    });

    return unsubscribe;
  }, [activeMatchId]);

  const createMatch = useCallback(
    async (opponentUid: string, initialGameState?: any): Promise<string> => {
      if (!user) {
        throw new Error('Du musst eingeloggt sein');
      }

      setError(null);
      setLoading(true);

      try {
        const newMatchId = await createMatchService(
          user.uid,
          opponentUid,
          initialGameState
        );

        setActiveMatchId(newMatchId);

        if (import.meta.env.DEV) {
          logger.debug('🎮 Match created:', newMatchId);
        }

        return newMatchId;
      } catch (err: any) {
        const errorMessage = err.message || 'Fehler beim Erstellen des Matches';
        setError(errorMessage);
        setLoading(false);
        throw new Error(errorMessage);
      }
    },
    [user]
  );

  const acceptMatch = useCallback(async (): Promise<void> => {
    if (!activeMatchId) {
      throw new Error('Kein aktives Match');
    }

    setError(null);

    try {
      await acceptMatchService(activeMatchId);

      if (import.meta.env.DEV) {
        logger.debug('✅ Match accepted:', activeMatchId);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Fehler beim Akzeptieren des Matches';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [activeMatchId]);

  const updateGameState = useCallback(
    async (gameState: any): Promise<void> => {
      if (!activeMatchId) {
        throw new Error('Kein aktives Match');
      }

      setError(null);

      try {
        await updateGameStateService(activeMatchId, gameState);

        if (import.meta.env.DEV) {
          logger.debug('🎮 Game state updated');
        }
      } catch (err: any) {
        const errorMessage = err.message || 'Fehler beim Update des Game-States';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [activeMatchId]
  );

  const finishMatch = useCallback(async (): Promise<void> => {
    if (!activeMatchId) {
      throw new Error('Kein aktives Match');
    }

    setError(null);

    try {
      await finishMatchService(activeMatchId);

      if (import.meta.env.DEV) {
        logger.debug('🏁 Match finished:', activeMatchId);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Fehler beim Beenden des Matches';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [activeMatchId]);

  const loadMatch = useCallback(async (matchId: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const loadedMatch = await getMatchService(matchId);
      setMatch(loadedMatch);
      setActiveMatchId(matchId);
    } catch (err: any) {
      const errorMessage = err.message || 'Fehler beim Laden des Matches';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    match,
    loading,
    error,
    createMatch,
    acceptMatch,
    updateGameState,
    finishMatch,
    loadMatch,
  };
};
