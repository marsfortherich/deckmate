import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { logger } from '../utils/logger';
import { getErrorMessage, getErrorCode } from '../utils/errors';

export interface FriendData {
  uid: string;
  displayName: string;
  addedAt: Timestamp;
}

export interface FriendRequest {
  id: string;
  from: string;
  fromDisplayName: string;
  to: string;
  toDisplayName: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Timestamp;
}

export type FriendRequestCallback = (requests: FriendRequest[]) => void;
export type FriendsListCallback = (friends: FriendData[]) => void;

/**
 * Sendet eine Freundschaftsanfrage
 */
export const sendFriendRequest = async (
  fromUid: string,
  fromDisplayName: string,
  toUid: string,
  toDisplayName: string
): Promise<void> => {
  if (import.meta.env.DEV) {
    logger.debug('👥 Sending friend request:', {
      from: fromUid,
      fromName: fromDisplayName,
      to: toUid,
      toName: toDisplayName,
    });
  }

  if (fromUid === toUid) {
    throw new Error('Du kannst dir nicht selbst eine Freundschaftsanfrage senden');
  }

  // Prüfe ob bereits eine Anfrage existiert
  const existingRequest = await checkExistingRequest(fromUid, toUid);
  if (existingRequest) {
    throw new Error('Es existiert bereits eine Freundschaftsanfrage');
  }

  // Prüfe ob bereits befreundet
  const alreadyFriends = await checkIfFriends(fromUid, toUid);
  if (alreadyFriends) {
    throw new Error('Ihr seid bereits befreundet');
  }

  const requestId = `${fromUid}_${toUid}`;
  const requestRef = doc(db, 'friendRequests', requestId);

  try {
    await setDoc(requestRef, {
      from: fromUid,
      fromDisplayName,
      to: toUid,
      toDisplayName,
      status: 'pending',
      createdAt: serverTimestamp(),
    });
    
    if (import.meta.env.DEV) {
      logger.debug('✅ Friend request created successfully');
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('❌ Failed to create friend request:', error);
      console.error('Error code:', getErrorCode(error));
      console.error('Error message:', getErrorMessage(error));
    }
    throw error;
  }
};

/**
 * Akzeptiert eine Freundschaftsanfrage
 */
export const acceptFriendRequest = async (requestId: string): Promise<void> => {
  logger.debug('🔍 DEBUG: Starting acceptFriendRequest for:', requestId);
  
  const requestRef = doc(db, 'friendRequests', requestId);
  const requestSnap = await getDoc(requestRef);

  if (!requestSnap.exists()) {
    throw new Error('Freundschaftsanfrage nicht gefunden');
  }

  const request = requestSnap.data() as Omit<FriendRequest, 'id'>;
  logger.debug('🔍 DEBUG: Request data:', {
    from: request.from,
    to: request.to,
    fromDisplayName: request.fromDisplayName,
    toDisplayName: request.toDisplayName,
    status: request.status
  });

  if (request.status !== 'pending') {
    throw new Error('Diese Anfrage wurde bereits bearbeitet');
  }

  // Lade aktuelle User-Daten aus Firestore (für aktuellste displayNames)
  const fromUserRef = doc(db, 'users', request.from);
  const toUserRef = doc(db, 'users', request.to);
  
  const [fromUserSnap, toUserSnap] = await Promise.all([
    getDoc(fromUserRef),
    getDoc(toUserRef)
  ]);

  const fromUserData = fromUserSnap.exists() ? fromUserSnap.data() : null;
  const toUserData = toUserSnap.exists() ? toUserSnap.data() : null;

  logger.debug('🔍 DEBUG: Loaded user data:', {
    fromUser: fromUserData,
    toUser: toUserData
  });

  // Füge beide User zur jeweiligen Freundesliste hinzu
  const user1FriendRef = doc(db, 'users', request.from, 'friends', request.to);
  const user2FriendRef = doc(db, 'users', request.to, 'friends', request.from);

  const friendData1 = {
    uid: request.to,
    displayName: toUserData?.displayName || request.toDisplayName || 'Unknown User',
    addedAt: serverTimestamp(),
  };

  const friendData2 = {
    uid: request.from,
    displayName: fromUserData?.displayName || request.fromDisplayName || 'Unknown User',
    addedAt: serverTimestamp(),
  };

  logger.debug('🔍 DEBUG: Friend data to write:', {
    friendData1,
    friendData2
  });

  logger.debug('🔍 DEBUG: Writing to users/' + request.from + '/friends/' + request.to);
  try {
    await setDoc(user1FriendRef, friendData1);
    logger.debug('✅ DEBUG: Successfully wrote user1FriendRef');
  } catch (error) {
    console.error('❌ DEBUG: Failed to write user1FriendRef:', getErrorMessage(error));
    throw error;
  }

  logger.debug('🔍 DEBUG: Writing to users/' + request.to + '/friends/' + request.from);
  try {
    await setDoc(user2FriendRef, friendData2);
    logger.debug('✅ DEBUG: Successfully wrote user2FriendRef');
  } catch (error) {
    console.error('❌ DEBUG: Failed to write user2FriendRef:', getErrorMessage(error));
    throw error;
  }

  // Lösche die Anfrage
  logger.debug('🔍 DEBUG: Deleting request:', requestId);
  await deleteDoc(requestRef);
  logger.debug('✅ DEBUG: acceptFriendRequest completed successfully');
};

/**
 * Lehnt eine Freundschaftsanfrage ab
 */
export const rejectFriendRequest = async (requestId: string): Promise<void> => {
  const requestRef = doc(db, 'friendRequests', requestId);
  await deleteDoc(requestRef);
};

/**
 * Entfernt einen Freund
 */
export const removeFriend = async (
  userUid: string,
  friendUid: string
): Promise<void> => {
  const user1FriendRef = doc(db, 'users', userUid, 'friends', friendUid);
  const user2FriendRef = doc(db, 'users', friendUid, 'friends', userUid);

  await deleteDoc(user1FriendRef);
  await deleteDoc(user2FriendRef);
};

/**
 * Holt die Freundesliste eines Users
 */
export const getFriendsList = async (userUid: string): Promise<FriendData[]> => {
  const friendsRef = collection(db, 'users', userUid, 'friends');
  const snapshot = await getDocs(friendsRef);

  return snapshot.docs.map((doc) => ({
    ...(doc.data() as Omit<FriendData, 'uid'>),
    uid: doc.id,
  }));
};

/**
 * Subscribt auf Änderungen der Freundesliste
 */
export const subscribeFriendsList = (
  userUid: string,
  callback: FriendsListCallback
): (() => void) => {
  const friendsRef = collection(db, 'users', userUid, 'friends');

  return onSnapshot(friendsRef, (snapshot) => {
    const friends = snapshot.docs.map((doc) => ({
      ...(doc.data() as Omit<FriendData, 'uid'>),
      uid: doc.id,
    }));
    callback(friends);
  });
};

/**
 * Holt eingehende Freundschaftsanfragen
 */
export const getIncomingRequests = async (
  userUid: string
): Promise<FriendRequest[]> => {
  const requestsRef = collection(db, 'friendRequests');
  const q = query(
    requestsRef,
    where('to', '==', userUid),
    where('status', '==', 'pending')
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<FriendRequest, 'id'>),
  }));
};

/**
 * Holt ausgehende Freundschaftsanfragen
 */
export const getOutgoingRequests = async (
  userUid: string
): Promise<FriendRequest[]> => {
  const requestsRef = collection(db, 'friendRequests');
  const q = query(
    requestsRef,
    where('from', '==', userUid),
    where('status', '==', 'pending')
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<FriendRequest, 'id'>),
  }));
};

/**
 * Subscribt auf eingehende Freundschaftsanfragen
 */
export const subscribeIncomingRequests = (
  userUid: string,
  callback: FriendRequestCallback
): (() => void) => {
  const requestsRef = collection(db, 'friendRequests');
  const q = query(
    requestsRef,
    where('to', '==', userUid),
    where('status', '==', 'pending')
  );

  return onSnapshot(q, (snapshot) => {
    const requests = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<FriendRequest, 'id'>),
    }));
    callback(requests);
  });
};

/**
 * Sucht einen User anhand der Email
 */
export const findUserByEmail = async (
  email: string
): Promise<{ uid: string; displayName: string } | null> => {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('email', '==', email.toLowerCase()));
  
  if (import.meta.env.DEV) {
    logger.debug('🔍 Searching for user with email:', email.toLowerCase());
  }
  
  const snapshot = await getDocs(q);

  if (import.meta.env.DEV) {
    logger.debug('🔍 Search results:', snapshot.size, 'users found');
    if (!snapshot.empty) {
      logger.debug('🔍 Found user:', {
        uid: snapshot.docs[0].id,
        data: snapshot.docs[0].data()
      });
    }
  }

  if (snapshot.empty) {
    return null;
  }

  const userDoc = snapshot.docs[0];
  return {
    uid: userDoc.id,
    displayName: userDoc.data().displayName || 'Unknown User',
  };
};

/**
 * Sucht einen User anhand des Usernames
 */
export const findUserByUsername = async (
  username: string
): Promise<{ uid: string; displayName: string; username: string } | null> => {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('username', '==', username.toLowerCase()));
  
  if (import.meta.env.DEV) {
    logger.debug('🔍 Searching for user with username:', username.toLowerCase());
  }
  
  const snapshot = await getDocs(q);

  if (import.meta.env.DEV) {
    logger.debug('🔍 Search results:', snapshot.size, 'users found');
    if (!snapshot.empty) {
      logger.debug('🔍 Found user:', {
        uid: snapshot.docs[0].id,
        data: snapshot.docs[0].data()
      });
    }
  }

  if (snapshot.empty) {
    return null;
  }

  const userDoc = snapshot.docs[0];
  return {
    uid: userDoc.id,
    displayName: userDoc.data().displayName || 'Unknown User',
    username: userDoc.data().username || username,
  };
};

// Helper functions

const checkExistingRequest = async (
  fromUid: string,
  toUid: string
): Promise<boolean> => {
  try {
    const requestId1 = `${fromUid}_${toUid}`;
    const requestId2 = `${toUid}_${fromUid}`;

    const request1 = await getDoc(doc(db, 'friendRequests', requestId1));
    const request2 = await getDoc(doc(db, 'friendRequests', requestId2));

    return request1.exists() || request2.exists();
  } catch (error) {
    // Permission denied ist OK - bedeutet request existiert nicht oder wir haben keine Rechte
    if (getErrorCode(error) === 'permission-denied') {
      return false;
    }
    throw error;
  }
};

const checkIfFriends = async (
  userUid: string,
  friendUid: string
): Promise<boolean> => {
  try {
    const friendRef = doc(db, 'users', userUid, 'friends', friendUid);
    const friendSnap = await getDoc(friendRef);
    return friendSnap.exists();
  } catch (error) {
    // Permission denied ist OK - bedeutet nicht befreundet
    if (getErrorCode(error) === 'permission-denied') {
      return false;
    }
    throw error;
  }
};
