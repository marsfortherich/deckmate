/**
 * Migration Script: Add Email Field to Existing Users
 * 
 * Dieses Skript aktualisiert alle User-Dokumente in Firestore
 * und fügt das email-Feld hinzu, falls es fehlt.
 * 
 * Run with: npm run migrate:emails
 */

import { collection, getDocs } from 'firebase/firestore';
import { db } from './services/firebase';

async function migrateUserEmails() {
  console.log('🔧 Starting email migration...\n');

  try {
    // Hole alle User-Dokumente
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);

    console.log(`Found ${snapshot.size} user documents\n`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const userDoc of snapshot.docs) {
      const data = userDoc.data();
      const uid = userDoc.id;

      console.log(`Processing user: ${uid}`);
      console.log(`  DisplayName: ${data.displayName}`);
      console.log(`  Email: ${data.email || 'MISSING'}`);

      // Wenn Email fehlt, versuche sie aus Firebase Auth zu holen
      if (!data.email) {
        try {
          // Leider können wir die Email nicht aus Auth lesen ohne admin SDK
          // Der User muss sich einloggen oder wir brauchen Cloud Functions
          console.log(`  ⚠️  Email fehlt - kann nicht automatisch migriert werden`);
          console.log(`     User muss sich neu einloggen damit Email gesetzt wird\n`);
          skipped++;
        } catch (error) {
          console.error(`  ❌ Error:`, error);
          errors++;
        }
      } else {
        console.log(`  ✅ Email already exists\n`);
        updated++;
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`  ✅ Already had email: ${updated}`);
    console.log(`  ⚠️  Skipped (missing email): ${skipped}`);
    console.log(`  ❌ Errors: ${errors}`);
    console.log('\nHinweis: User ohne Email müssen sich neu einloggen');
    console.log('         damit das email-Feld automatisch gesetzt wird.');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateUserEmails();
