/**
 * Firebase Connection Test Script
 * 
 * Testet die Firebase-Verbindung, Auth und Firestore.
 * Führe aus mit: npm run test:firebase
 */

import 'dotenv/config';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';

// Firebase Config aus .env laden
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY ?? '',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.VITE_FIREBASE_APP_ID ?? '',
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const TEST_EMAIL = `test-${Date.now()}@example.com`;
const TEST_PASSWORD = 'TestPassword123!';
const TEST_UID = `test-user-${Date.now()}`;

async function testFirebaseConnection() {
  console.log('🔥 Firebase Connection Test\n');
  
  try {
    // Test 1: Firebase App Initialization
    console.log('✓ Firebase App initialisiert');
    console.log(`  Project ID: ${process.env.VITE_FIREBASE_PROJECT_ID}`);
    
    // Test 2: Auth - Create User
    console.log('\n📝 Testing Authentication...');
    const userCredential = await createUserWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD);
    console.log('✓ User erstellt:', userCredential.user.uid);
    
    // Test 3: Auth - Sign In
    await signInWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD);
    console.log('✓ Login erfolgreich');
    
    // Test 4: Firestore - Write Document
    console.log('\n📚 Testing Firestore...');
    const testDocRef = doc(db, 'test-collection', TEST_UID);
    const testData = {
      message: 'Hello from Firebase test!',
      timestamp: new Date().toISOString(),
      value: 42,
    };
    
    await setDoc(testDocRef, testData);
    console.log('✓ Dokument geschrieben');
    
    // Test 5: Firestore - Read Document
    const snapshot = await getDoc(testDocRef);
    if (snapshot.exists()) {
      console.log('✓ Dokument gelesen:', snapshot.data());
    } else {
      throw new Error('Dokument nicht gefunden');
    }
    
    // Cleanup
    console.log('\n🧹 Cleanup...');
    await deleteDoc(testDocRef);
    console.log('✓ Test-Dokument gelöscht');
    
    if (auth.currentUser) {
      await deleteUser(auth.currentUser);
      console.log('✓ Test-User gelöscht');
    }
    
    console.log('\n✅ Alle Tests erfolgreich!');
    console.log('\nFirebase ist korrekt konfiguriert und funktioniert.');
    
  } catch (error: any) {
    console.error('\n❌ Fehler beim Test:', error.message);
    
    if (error.code) {
      console.error('   Error Code:', error.code);
    }
    
    console.log('\n💡 Mögliche Lösungen:');
    console.log('   1. Prüfe .env Datei auf korrekte Firebase-Konfiguration');
    console.log('   2. Aktiviere Email/Password Auth in Firebase Console');
    console.log('   3. Prüfe Firestore Security Rules');
    console.log('   4. Verwende Firebase Emulator: firebase emulators:start');
    
    process.exit(1);
  }
}

// Run test
testFirebaseConnection();
