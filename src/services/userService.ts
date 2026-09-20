import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export interface UserDocument {
  username: string;
  displayName: string;
  email: string;
  rankedUnlocked: boolean;
  unrankedWins: number;
  tier: 'Pawn';
  division: number;
  lp: number;
  mmr: number;
  wins: number;
  losses: number;
}

const buildDefaultUserDocument = (
  username: string,
  displayName: string,
  email: string
): UserDocument => ({
  username: username.toLowerCase(),
  displayName,
  email: email.toLowerCase(),
  rankedUnlocked: false,
  unrankedWins: 0,
  tier: 'Pawn',
  division: 3,
  lp: 0,
  mmr: 1000,
  wins: 0,
  losses: 0,
});

/**
 * Prüft ob ein Username bereits vergeben ist
 */
export const isUsernameTaken = async (username: string): Promise<boolean> => {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('username', '==', username.toLowerCase()));
  const snapshot = await getDocs(q);
  return !snapshot.empty;
};

export const ensureUserDocument = async (
  uid: string,
  username: string,
  displayName: string,
  email: string
): Promise<UserDocument> => {
  const userRef = doc(db, 'users', uid);
  const snapshot = await getDoc(userRef);

  if (snapshot.exists()) {
    const existingDoc = snapshot.data() as UserDocument;
    
    // Wenn Email, Username oder DisplayName fehlt, aktualisiere das Dokument
    const needsUpdate = 
      (!existingDoc.email && email) || 
      (!existingDoc.username && username) ||
      (!existingDoc.displayName && displayName);
    
    if (needsUpdate) {
      const updatedDoc = {
        ...existingDoc,
        username: existingDoc.username || username.toLowerCase(),
        email: existingDoc.email || email.toLowerCase(),
        displayName: existingDoc.displayName || displayName,
      };
      await setDoc(userRef, updatedDoc, { merge: true });
      return updatedDoc;
    }
    
    return existingDoc;
  }

  // Prüfe ob Username bereits vergeben ist
  const taken = await isUsernameTaken(username);
  if (taken) {
    throw new Error('Dieser Username ist bereits vergeben');
  }

  const newDocument = buildDefaultUserDocument(username, displayName, email);
  await setDoc(userRef, newDocument);

  return newDocument;
};

/**
 * Lädt ein User-Dokument aus Firestore
 */
export const getUserDocument = async (uid: string): Promise<UserDocument | null> => {
  const userRef = doc(db, 'users', uid);
  const snapshot = await getDoc(userRef);
  
  if (!snapshot.exists()) {
    return null;
  }
  
  return snapshot.data() as UserDocument;
};
