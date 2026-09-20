import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  Unsubscribe,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from './firebase';
import { Card } from '../cards/types/card';
import { CARD_LIBRARY } from '../cards/cardLibrary';
import { Move } from '../core/types';
import { logger } from '../utils/logger';
import { getErrorMessage, getErrorCode } from '../utils/errors';

export type MatchMode = 'unranked';
export type MatchStatus = 
  | 'pending_challenge' // Challenge gesendet, wartet auf Antwort
  | 'waiting_for_decks' // Challenge akzeptiert, wartet auf Deck-Auswahl
  | 'pending' // Beide Decks gewählt, bereit zum Start
  | 'active' // Spiel läuft
  | 'finished'; // Spiel beendet

// Speicherformat für Firestore (nur IDs)
interface PlayerDeckDocument {
  uid: string;
  deckId: string;
  deckName: string;
  cardIds: string[]; // Speichere nur Card-IDs
}

// Runtime-Format mit vollständigen Cards
export interface PlayerDeck {
  uid: string;
  deckId: string;
  deckName: string;
  cards: Card[];
}

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
      return {
        id: `${cardId}-copy-${index}`,
        name: 'Unknown Card',
        description: 'Card not found',
        rarity: 'common' as const,
        cost: {},
        effect: { type: 'none' },
      } as unknown as Card;
    }
    return {
      ...cardDef.card,
      id: `${cardDef.card.id}-copy-${index}`,
    };
  });
};

/**
 * Konvertiert PlayerDeckDocument zu PlayerDeck
 */
const reconstructPlayerDeck = (doc: PlayerDeckDocument): PlayerDeck => ({
  uid: doc.uid,
  deckId: doc.deckId,
  deckName: doc.deckName,
  cards: reconstructCards(doc.cardIds),
});

export interface ChallengeData {
  challengerId: string;
  challengerName: string;
  challengedId: string;
  challengedName: string;
  sentAt: Timestamp;
}

// Firestore Document Format (mit cardIds)
export interface MatchDocument {
  players: [string, string]; // [uid1, uid2]
  mode: MatchMode;
  status: MatchStatus;
  gameState?: any; // Beliebiges Game-State Objekt
  playerDecks?: {
    [uid: string]: PlayerDeckDocument; // Speichere nur IDs
  };
  challengeData?: ChallengeData;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

// Runtime Match Format (mit vollständigen Cards)
export interface Match {
  id: string;
  players: [string, string];
  mode: MatchMode;
  status: MatchStatus;
  gameState?: any;
  playerDecks?: {
    [uid: string]: PlayerDeck; // Runtime hat vollständige Cards
  };
  challengeData?: ChallengeData;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

/**
 * Konvertiert MatchDocument zu Match (mit rekonstruierten Cards)
 */
const reconstructMatch = (id: string, doc: MatchDocument): Match => {
  let playerDecks: { [uid: string]: PlayerDeck } | undefined;
  
  if (doc.playerDecks) {
    playerDecks = {};
    for (const [uid, deckDoc] of Object.entries(doc.playerDecks)) {
      playerDecks[uid] = reconstructPlayerDeck(deckDoc);
    }
  }

  return {
    id,
    ...doc,
    playerDecks,
  };
};

export type MatchCallback = (match: Match | null) => void;

/**
 * Erstellt ein neues Match zwischen zwei Spielern
 */
export const createMatch = async (
  player1Uid: string,
  player2Uid: string,
  initialGameState?: any
): Promise<string> => {
  if (player1Uid === player2Uid) {
    throw new Error('Ein Spieler kann nicht gegen sich selbst spielen');
  }

  const matchesRef = collection(db, 'matches');
  const newMatchRef = doc(matchesRef); // Auto-generated ID
  
  const matchData: MatchDocument = {
    players: [player1Uid, player2Uid],
    mode: 'unranked',
    status: 'pending',
    gameState: initialGameState || {},
    createdAt: serverTimestamp() as Timestamp,
  };

  await setDoc(newMatchRef, matchData);

  if (import.meta.env.DEV) {
    logger.debug('🎮 Match created:', {
      matchId: newMatchRef.id,
      players: [player1Uid, player2Uid],
    });
  }

  return newMatchRef.id;
};

/**
 * Akzeptiert ein Match und setzt Status auf "active"
 */
export const acceptMatch = async (matchId: string): Promise<void> => {
  const matchRef = doc(db, 'matches', matchId);
  const matchSnap = await getDoc(matchRef);

  if (!matchSnap.exists()) {
    throw new Error('Match nicht gefunden');
  }

  const matchData = matchSnap.data() as MatchDocument;

  if (matchData.status !== 'pending') {
    throw new Error('Match wurde bereits akzeptiert oder ist beendet');
  }

  await updateDoc(matchRef, {
    status: 'active',
    updatedAt: serverTimestamp(),
  });

  if (import.meta.env.DEV) {
    logger.debug('✅ Match accepted:', matchId);
  }
};

/**
 * Aktualisiert den Game-State eines Matches
 */
export const updateGameState = async (
  matchId: string,
  gameState: any
): Promise<void> => {
  const matchRef = doc(db, 'matches', matchId);
  const matchSnap = await getDoc(matchRef);

  if (!matchSnap.exists()) {
    throw new Error('Match nicht gefunden');
  }

  const matchData = matchSnap.data() as MatchDocument;

  if (matchData.status === 'finished') {
    throw new Error('Match ist bereits beendet');
  }

  await updateDoc(matchRef, {
    gameState,
    updatedAt: serverTimestamp(),
  });

  if (import.meta.env.DEV) {
    logger.debug('🎮 Game state updated:', matchId);
  }
};

/**
 * Setzt Match-Status auf "finished"
 */
export const finishMatch = async (matchId: string): Promise<void> => {
  const matchRef = doc(db, 'matches', matchId);

  await updateDoc(matchRef, {
    status: 'finished',
    updatedAt: serverTimestamp(),
  });

  if (import.meta.env.DEV) {
    logger.debug('🏁 Match finished:', matchId);
  }
};

/**
 * Holt ein Match-Dokument
 */
export const getMatch = async (matchId: string): Promise<Match | null> => {
  const matchRef = doc(db, 'matches', matchId);
  const matchSnap = await getDoc(matchRef);

  if (!matchSnap.exists()) {
    return null;
  }

  return reconstructMatch(matchSnap.id, matchSnap.data() as MatchDocument);
};

/**
 * Subscribt auf Match-Updates (Real-time)
 */
export const subscribeToMatch = (
  matchId: string,
  callback: MatchCallback
): Unsubscribe => {
  const matchRef = doc(db, 'matches', matchId);

  return onSnapshot(
    matchRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        callback(null);
        return;
      }

      const match = reconstructMatch(snapshot.id, snapshot.data() as MatchDocument);
      callback(match);
    },
    (error) => {
      console.error('Error subscribing to match:', error);
      callback(null);
    }
  );
};

/**
 * Erstellt eine Challenge (Match-Anfrage)
 */
export const createChallenge = async (
  challengerId: string,
  challengerName: string,
  challengedId: string,
  challengedName: string
): Promise<string> => {
  if (challengerId === challengedId) {
    throw new Error('Du kannst dich nicht selbst herausfordern');
  }

  const matchesRef = collection(db, 'matches');
  const newMatchRef = doc(matchesRef);

  const matchData: MatchDocument = {
    players: [challengerId, challengedId],
    mode: 'unranked',
    status: 'pending_challenge',
    challengeData: {
      challengerId,
      challengerName,
      challengedId,
      challengedName,
      sentAt: serverTimestamp() as Timestamp,
    },
    createdAt: serverTimestamp() as Timestamp,
  };

  await setDoc(newMatchRef, matchData);

  if (import.meta.env.DEV) {
    logger.debug('⚔️ Challenge created:', {
      matchId: newMatchRef.id,
      challenger: challengerName,
      challenged: challengedName,
    });
  }

  return newMatchRef.id;
};

/**
 * Akzeptiert eine Challenge
 */
export const acceptChallenge = async (matchId: string): Promise<void> => {
  const matchRef = doc(db, 'matches', matchId);
  const matchSnap = await getDoc(matchRef);

  if (!matchSnap.exists()) {
    throw new Error('Challenge nicht gefunden');
  }

  const matchData = matchSnap.data() as MatchDocument;

  if (matchData.status !== 'pending_challenge') {
    throw new Error('Diese Challenge ist nicht mehr gültig');
  }

  await updateDoc(matchRef, {
    status: 'waiting_for_decks',
    updatedAt: serverTimestamp(),
  });

  if (import.meta.env.DEV) {
    logger.debug('✅ Challenge accepted:', matchId);
  }
};

/**
 * Lehnt eine Challenge ab (löscht das Match)
 */
export const declineChallenge = async (matchId: string): Promise<void> => {
  const matchRef = doc(db, 'matches', matchId);
  await deleteDoc(matchRef);

  if (import.meta.env.DEV) {
    logger.debug('❌ Challenge declined:', matchId);
  }
};

/**
 * Wählt ein Deck für einen Spieler aus
 */
export const selectDeck = async (
  matchId: string,
  playerUid: string,
  deckId: string,
  deckName: string,
  cards: Card[]
): Promise<void> => {
  const matchRef = doc(db, 'matches', matchId);
  const matchSnap = await getDoc(matchRef);

  if (!matchSnap.exists()) {
    throw new Error('Match nicht gefunden');
  }

  const matchData = matchSnap.data() as MatchDocument;

  if (matchData.status !== 'waiting_for_decks') {
    throw new Error('Deck-Auswahl ist in diesem Status nicht möglich');
  }

  if (!matchData.players.includes(playerUid)) {
    throw new Error('Du bist kein Teilnehmer dieses Matches');
  }

  // Speichere nur IDs (PlayerDeckDocument)
  const playerDeckDoc: PlayerDeckDocument = {
    uid: playerUid,
    deckId,
    deckName,
    cardIds: extractCardIds(cards),
  };

  const playerDecks = matchData.playerDecks || {};
  playerDecks[playerUid] = playerDeckDoc;

  // Prüfe ob beide Spieler ein Deck gewählt haben
  const bothDecksSelected =
    matchData.players.every((uid) => playerDecks[uid] !== undefined);

  await updateDoc(matchRef, {
    playerDecks,
    status: bothDecksSelected ? 'pending' : 'waiting_for_decks',
    updatedAt: serverTimestamp(),
  });

  if (import.meta.env.DEV) {
    logger.debug('🃏 Deck selected:', {
      matchId,
      player: playerUid,
      deckName,
      bothReady: bothDecksSelected,
    });
  }
};

/**
 * Holt alle eingehenden Challenges für einen User
 */
export const getIncomingChallenges = async (
  userUid: string
): Promise<Match[]> => {
  const matchesRef = collection(db, 'matches');
  const q = query(
    matchesRef,
    where('challengeData.challengedId', '==', userUid),
    where('status', '==', 'pending_challenge')
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => 
    reconstructMatch(doc.id, doc.data() as MatchDocument)
  );
};

/**
 * Holt alle Matches in denen ein User wartet (waiting_for_decks)
 */
export const getWaitingMatches = async (userUid: string): Promise<Match[]> => {
  const matchesRef = collection(db, 'matches');
  const q = query(matchesRef, where('status', '==', 'waiting_for_decks'));

  const snapshot = await getDocs(q);

  return snapshot.docs
    .map((doc) => reconstructMatch(doc.id, doc.data() as MatchDocument))
    .filter((match) => match.players.includes(userUid));
};

/**
 * Subscribt auf eingehende Challenges
 */
export const subscribeIncomingChallenges = (
  userUid: string,
  callback: (challenges: Match[]) => void
): Unsubscribe => {
  const matchesRef = collection(db, 'matches');
  const q = query(
    matchesRef,
    where('challengeData.challengedId', '==', userUid),
    where('status', '==', 'pending_challenge')
  );

  if (import.meta.env.DEV) {
    logger.debug('🔍 Subscribing to challenges for user:', userUid);
  }

  return onSnapshot(
    q,
    (snapshot) => {
      if (import.meta.env.DEV) {
        logger.debug('📨 Incoming challenges snapshot:', {
          size: snapshot.size,
          docs: snapshot.docs.length,
        });
      }
      
      const challenges = snapshot.docs.map((doc) => {
        if (import.meta.env.DEV) {
          logger.debug('Challenge data:', doc.id, doc.data());
        }
        return reconstructMatch(doc.id, doc.data() as MatchDocument);
      });
      
      if (import.meta.env.DEV) {
        logger.debug('📬 Calling callback with challenges:', challenges.length);
      }
      
      callback(challenges);
    },
    (error) => {
      console.error('❌ Error subscribing to challenges:', error);
      console.error('Error details:', {
        code: getErrorCode(error),
        message: getErrorMessage(error),
      });
      // Call with empty array on error
      callback([]);
    }
  );
};

/**
 * Subscribt auf akzeptierte ausgehende Challenges (für den Challenger)
 * Wartet darauf, dass der andere Spieler die Challenge annimmt
 */
export const subscribeAcceptedChallenges = (
  userUid: string,
  callback: (matches: Match[]) => void
): Unsubscribe => {
  const matchesRef = collection(db, 'matches');
  const q = query(
    matchesRef,
    where('challengeData.challengerId', '==', userUid),
    where('status', '==', 'waiting_for_decks')
  );

  if (import.meta.env.DEV) {
    logger.debug('🔍 Subscribing to accepted challenges for user:', userUid);
  }

  return onSnapshot(
    q,
    (snapshot) => {
      if (import.meta.env.DEV) {
        logger.debug('✅ Accepted challenges snapshot:', {
          size: snapshot.size,
          docs: snapshot.docs.length,
        });
      }
      
      const matches = snapshot.docs.map((doc) => {
        if (import.meta.env.DEV) {
          logger.debug('Accepted challenge data:', doc.id, doc.data());
        }
        return reconstructMatch(doc.id, doc.data() as MatchDocument);
      });
      
      if (import.meta.env.DEV) {
        logger.debug('📬 Calling callback with accepted challenges:', matches.length);
      }
      
      callback(matches);
    },
    (error) => {
      console.error('❌ Error subscribing to accepted challenges:', error);
      console.error('Error details:', {
        code: getErrorCode(error),
        message: getErrorMessage(error),
      });
      callback([]);
    }
  );
};

/**
 * Initialize match game state (called when match status is 'pending')
 */
export const initializeMatchGameState = async (matchId: string): Promise<void> => {
  const initializeMatch = httpsCallable(functions, 'initializeMatch');
  
  if (import.meta.env.DEV) {
    logger.debug('🎮 Initializing match game state:', matchId);
  }

  try {
    const result = await initializeMatch({ matchId });
    
    if (import.meta.env.DEV) {
      logger.debug('✅ Match initialized:', result.data);
    }
  } catch (err) {
    console.error('❌ Error initializing match:', err);
    throw new Error(getErrorMessage(err, 'Failed to initialize match'));
  }
};

/**
 * Make a move in an online multiplayer match
 * Validated server-side
 */
export const makeOnlineMove = async (
  matchId: string,
  move: Partial<Move> & { from: { row: number; col: number }; to: { row: number; col: number } }
): Promise<void> => {
  const makeMoveFunc = httpsCallable(functions, 'makeMove');
  
  if (import.meta.env.DEV) {
    logger.debug('♟️ Making online move:', { matchId, move });
  }

  try {
    const result = await makeMoveFunc({ matchId, move });
    
    if (import.meta.env.DEV) {
      logger.debug('✅ Move completed:', result.data);
    }
  } catch (err) {
    console.error('❌ Error making move:', err);
    throw new Error(getErrorMessage(err, 'Failed to make move'));
  }
};

/**
 * Play a card in an online multiplayer match
 * Validated server-side
 */
export const playOnlineCard = async (
  matchId: string,
  cardInstanceId: string,
  params?: any
): Promise<void> => {
  const playCardFunc = httpsCallable(functions, 'playCard');
  
  if (import.meta.env.DEV) {
    logger.debug('🃏 Playing online card:', { matchId, cardInstanceId, params });
  }

  try {
    const result = await playCardFunc({ matchId, cardInstanceId, params });
    
    if (import.meta.env.DEV) {
      logger.debug('✅ Card played:', result.data);
    }
  } catch (err) {
    console.error('❌ Error playing card:', err);
    throw new Error(getErrorMessage(err, 'Failed to play card'));
  }
};
