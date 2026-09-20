/**
 * Custom Hook: useGameState
 * 
 * Managed den GameController und stellt State + Actions bereit.
 * 
 * Pattern:
 * - Controller ist Single Source of Truth
 * - Hook triggert Re-Renders via useState
 * - Actions rufen Controller-Methoden auf
 * 
 * Datenfluss:
 * Component → Action → Controller → State Update → Re-Render
 */

import { useState, useCallback, useMemo } from 'react';
import { 
  IGameController, 
  GameController, 
  PlayerView 
} from '../../cards/gameController';
import { Card } from '../../cards/types/card';
import { Color } from '../../core/index';
import { EffectParams, NO_PARAMS } from '../../cards/types/effect';

/**
 * Game State Hook Return Type
 */
export interface UseGameStateReturn {
  // State
  playerView: PlayerView;
  
  // Actions
  playCard: (cardId: string, params?: EffectParams) => void;
  drawSpecialCard: (card: Card) => void;
  
  // Helpers
  refresh: () => void;
}

/**
 * Custom Hook für Game State Management
 * 
 * @param player - Spielerfarbe (white/black)
 * @param injectedController - Optionaler Controller (für Dependency Injection / Testing)
 * @returns Game State und Actions
 */
export function useGameState(
  player: Color, 
  injectedController?: IGameController
): UseGameStateReturn {
  // Controller: Injected oder Default (Singleton via useMemo)
  const controller = useMemo(
    () => injectedController || new GameController(), 
    [injectedController]
  );
  
  // State: PlayerView vom Controller
  const [playerView, setPlayerView] = useState<PlayerView>(() => 
    controller.getPlayerView(player)
  );
  
  /**
   * Refresh: Holt aktuellen View vom Controller
   * 
   * WICHTIG: Nach jeder Controller-Action aufrufen!
   */
  const refresh = useCallback(() => {
    const newView = controller.getPlayerView(player);
    setPlayerView(newView);
  }, [controller, player]);
  
  /**
   * Spielt eine Karte aus
   * 
   * Pattern:
   * 1. Action aufrufen
   * 2. Result prüfen
   * 3. State refreshen
   */
  const playCard = useCallback((cardId: string, params: EffectParams = NO_PARAMS) => {
    const result = controller.playCardAction(
      player,
      cardId,
      params,
      true // isMoveCard
    );
    
    if (result.success) {
      // State hat sich geändert → Re-Render triggern
      refresh();
    } else {
      // Error Handling (optional: via Toast/Alert)
      console.error('Failed to play card:', result.message);
    }
  }, [controller, player, refresh]);
  
  /**
   * Zieht eine Spezialkarte
   */
  const drawSpecialCard = useCallback((card: Card) => {
    const result = controller.drawSpecialCard(player, card);
    
    if (result.success) {
      refresh();
    } else {
      console.error('Failed to draw card:', result.message);
    }
  }, [controller, player, refresh]);
  
  return {
    playerView,
    playCard,
    drawSpecialCard,
    refresh,
  };
}

/**
 * Alternative: useGameStateWithDeck
 * 
 * Für Deckbuilding-Version mit DeckGameController
 */
export function useGameStateWithDeck(_player: Color) {
  // TODO: Implementierung analog zu useGameState
  // aber mit DeckGameController statt GameController
}
