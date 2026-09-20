/**
 * Hand Statistics Interface
 * 
 * Explizites Interface statt ReturnType<typeof>
 */

export interface HandStats {
  /** Gesamtzahl aller Karten */
  readonly totalCards: number;
  
  /** Anzahl Zugkarten */
  readonly moveCards: number;
  
  /** Anzahl Spezialkarten */
  readonly specialCards: number;
  
  /** Hat der Spieler spielbare Karten? */
  readonly hasPlayableCards: boolean;
}
