import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { Card } from '../cards/types/card';
import { CARD_LIBRARY } from '../cards/cardLibrary';
import { logger } from '../utils/logger';

// Serialisierbare Deck-Daten (nur IDs)
interface DeckDocument {
  name: string;
  cardIds: string[]; // Speichere nur Card-IDs
  createdAt: Timestamp | ReturnType<typeof serverTimestamp>;
  updatedAt?: Timestamp | ReturnType<typeof serverTimestamp>;
}

export interface SavedDeck {
  id: string;
  name: string;
  cards: Card[];
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export const MAX_DECKS = 5;
export const DECK_SIZE = 20;

/**
 * Extrahiert Card-IDs aus Cards
 */
const extractCardIds = (cards: Card[]): string[] => {
  return cards.map(card => {
    // Entferne "-copy-X" Suffix falls vorhanden
    const baseId = card.id.replace(/-copy-\d+$/, '');
    return baseId;
  });
};

/**
 * Rekonstruiert Cards aus IDs
 */
const reconstructCards = (cardIds: string[]): Card[] => {
  return cardIds.map((cardId, index) => {
    const cardDef = CARD_LIBRARY.find(def => def.card.id === cardId);
    if (!cardDef) {
      console.warn(`Card not found in library: ${cardId}`);
      // Fallback zu einer leeren Card
      return {
        id: `${cardId}-copy-${index}`,
        name: 'Unknown Card',
        description: 'Card not found',
        rarity: 'common' as const,
        cost: {},
        effect: { type: 'none' },
      } as unknown as Card;
    }
    // Erstelle neue Instanz mit unique ID
    return {
      ...cardDef.card,
      id: `${cardDef.card.id}-copy-${index}`,
    };
  });
};

/**
 * Speichert ein Deck für einen User
 */
export const saveDeck = async (
  userUid: string,
  deckName: string,
  cards: Card[]
): Promise<string> => {
  if (cards.length !== DECK_SIZE) {
    throw new Error(`Ein Deck muss genau ${DECK_SIZE} Karten enthalten`);
  }

  // Prüfe ob User bereits 5 Decks hat
  const decksRef = collection(db, 'users', userUid, 'decks');
  const snapshot = await getDocs(decksRef);

  if (snapshot.size >= MAX_DECKS) {
    throw new Error(`Du kannst maximal ${MAX_DECKS} Decks speichern`);
  }

  const newDeckRef = doc(decksRef);
  const deckData: DeckDocument = {
    name: deckName,
    cardIds: extractCardIds(cards), // Speichere nur IDs
    createdAt: serverTimestamp(),
  };

  await setDoc(newDeckRef, deckData);

  if (import.meta.env.DEV) {
    logger.debug('💾 Deck saved:', { id: newDeckRef.id, name: deckName });
  }

  return newDeckRef.id;
};

/**
 * Aktualisiert ein bestehendes Deck
 */
export const updateDeck = async (
  userUid: string,
  deckId: string,
  deckName: string,
  cards: Card[]
): Promise<void> => {
  if (cards.length !== DECK_SIZE) {
    throw new Error(`Ein Deck muss genau ${DECK_SIZE} Karten enthalten`);
  }

  const deckRef = doc(db, 'users', userUid, 'decks', deckId);
  const deckSnap = await getDoc(deckRef);

  if (!deckSnap.exists()) {
    throw new Error('Deck nicht gefunden');
  }

  const updateData: Partial<DeckDocument> = {
    name: deckName,
    cardIds: extractCardIds(cards), // Speichere nur IDs
    updatedAt: serverTimestamp(),
  };

  await setDoc(deckRef, updateData, { merge: true });

  if (import.meta.env.DEV) {
    logger.debug('💾 Deck updated:', { id: deckId, name: deckName });
  }
};

/**
 * Lädt alle Decks eines Users
 */
export const getUserDecks = async (userUid: string): Promise<SavedDeck[]> => {
  const decksRef = collection(db, 'users', userUid, 'decks');
  const snapshot = await getDocs(decksRef);

  return snapshot.docs.map((doc) => {
    const data = doc.data() as DeckDocument;
    return {
      id: doc.id,
      name: data.name,
      cards: reconstructCards(data.cardIds), // Rekonstruiere Cards aus IDs
      createdAt: data.createdAt as Timestamp,
      updatedAt: data.updatedAt as Timestamp | undefined,
    };
  });
};

/**
 * Lädt ein einzelnes Deck
 */
export const getDeck = async (
  userUid: string,
  deckId: string
): Promise<SavedDeck | null> => {
  const deckRef = doc(db, 'users', userUid, 'decks', deckId);
  const deckSnap = await getDoc(deckRef);

  if (!deckSnap.exists()) {
    return null;
  }

  const data = deckSnap.data() as DeckDocument;
  return {
    id: deckSnap.id,
    name: data.name,
    cards: reconstructCards(data.cardIds), // Rekonstruiere Cards aus IDs
    createdAt: data.createdAt as Timestamp,
    updatedAt: data.updatedAt as Timestamp | undefined,
  };
};

/**
 * Löscht ein Deck
 */
export const deleteDeck = async (
  userUid: string,
  deckId: string
): Promise<void> => {
  const deckRef = doc(db, 'users', userUid, 'decks', deckId);
  await deleteDoc(deckRef);

  if (import.meta.env.DEV) {
    logger.debug('🗑️ Deck deleted:', deckId);
  }
};

/**
 * Prüft ob ein User bereits 5 Decks hat
 */
export const canCreateDeck = async (userUid: string): Promise<boolean> => {
  const decksRef = collection(db, 'users', userUid, 'decks');
  const snapshot = await getDocs(decksRef);
  return snapshot.size < MAX_DECKS;
};
