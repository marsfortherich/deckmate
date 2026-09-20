/**
 * Array Utilities
 * 
 * Helper-Funktionen für Array-Operationen.
 * Reduziert Code-Duplizierung.
 */

/**
 * Entfernt ein Element aus einem Array (immutable)
 * 
 * @param array - Ursprungs-Array
 * @param predicate - Funktion die true für zu entfernendes Element returniert
 * @returns Tuple mit [neues Array, entferntes Element | null]
 */
export function removeItem<T>(
  array: readonly T[],
  predicate: (item: T) => boolean
): [readonly T[], T | null] {
  const index = array.findIndex(predicate);
  
  if (index === -1) {
    return [array, null];
  }
  
  const item = array[index];
  const newArray = array.filter((_, i) => i !== index);
  
  return [newArray, item];
}

/**
 * Entfernt Element an Index (immutable)
 */
export function removeAtIndex<T>(
  array: readonly T[],
  index: number
): [readonly T[], T | null] {
  if (index < 0 || index >= array.length) {
    return [array, null];
  }
  
  const item = array[index];
  const newArray = array.filter((_, i) => i !== index);
  
  return [newArray, item];
}

/**
 * Fügt Element hinzu wenn Limit nicht überschritten (immutable)
 */
export function addIfSpace<T>(
  array: readonly T[],
  item: T,
  maxSize: number
): readonly T[] | null {
  if (array.length >= maxSize) {
    return null;
  }
  
  return [...array, item];
}

/**
 * Mischt Array (Fisher-Yates)
 */
export function shuffle<T>(array: readonly T[]): readonly T[] {
  const result = [...array];
  
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  
  return result;
}

/**
 * Nimmt N zufällige Elemente
 */
export function takeRandom<T>(array: readonly T[], count: number): readonly T[] {
  const shuffled = shuffle(array);
  return shuffled.slice(0, Math.min(count, array.length));
}
