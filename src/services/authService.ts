import {
  User,
  UserCredential,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from './firebase';

export interface AuthStateCallback {
  (user: User | null): void;
}

export interface AuthError {
  code: string;
  message: string;
}

export const getReadableErrorMessage = (error: any): string => {
  if (!error.code) return error.message || 'Ein unbekannter Fehler ist aufgetreten';
  
  const errorMessages: Record<string, string> = {
    'auth/email-already-in-use': 'Diese Email-Adresse wird bereits verwendet',
    'auth/invalid-email': 'Ungültige Email-Adresse',
    'auth/operation-not-allowed': 'Diese Operation ist nicht erlaubt',
    'auth/weak-password': 'Passwort ist zu schwach (mindestens 6 Zeichen)',
    'auth/user-disabled': 'Dieser Account wurde deaktiviert',
    'auth/user-not-found': 'Kein Account mit dieser Email gefunden',
    'auth/wrong-password': 'Falsches Passwort',
    'auth/invalid-credential': 'Ungültige Anmeldedaten',
    'auth/too-many-requests': 'Zu viele Versuche. Bitte versuche es später erneut',
    'auth/network-request-failed': 'Netzwerkfehler. Prüfe deine Internetverbindung',
  };
  
  return errorMessages[error.code] || error.message || 'Ein Fehler ist aufgetreten';
};

export const signInWithEmailPassword = async (
  email: string,
  password: string
): Promise<UserCredential> => {
  try {
    return await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    throw new Error(getReadableErrorMessage(error));
  }
};

export const registerWithEmailPassword = async (
  email: string,
  password: string,
  displayName: string
): Promise<UserCredential> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update display name
    if (userCredential.user) {
      await updateProfile(userCredential.user, { displayName });
      // Force token refresh to get updated displayName
      await userCredential.user.reload();
    }
    
    return userCredential;
  } catch (error) {
    throw new Error(getReadableErrorMessage(error));
  }
};

export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    throw new Error(getReadableErrorMessage(error));
  }
};

export const signOutUser = (): Promise<void> => signOut(auth);

export const onAuthStateChanged = (callback: AuthStateCallback) =>
  firebaseOnAuthStateChanged(auth, callback);
