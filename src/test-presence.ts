/**
 * Test script for Firebase Realtime Database Presence System
 * 
 * Tests:
 * 1. Setting user online
 * 2. Updating in-game status
 * 3. Subscribing to user status
 * 4. Setting user offline
 * 
 * Run with: npm run dev:test-presence
 */

import { 
  setUserOnline, 
  setUserOffline, 
  setInGameStatus, 
  subscribeToUserStatus,
  PresenceStatus 
} from './services/presenceService';

const TEST_USER_ID = 'test-user-' + Date.now();

async function testPresence() {
  console.log('🧪 Testing Firebase Realtime Database Presence System\n');

  try {
    // Test 1: Set user online
    console.log('1️⃣ Setting user online...');
    await setUserOnline(TEST_USER_ID);
    console.log('✅ User set online\n');

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 2: Subscribe to status
    console.log('2️⃣ Subscribing to user status...');
    const unsubscribe = subscribeToUserStatus(TEST_USER_ID, (status: PresenceStatus | null) => {
      console.log('📡 Status update:', status);
    });
    console.log('✅ Subscribed to status\n');

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 3: Update in-game status
    console.log('3️⃣ Setting in-game status to true...');
    await setInGameStatus(TEST_USER_ID, true);
    console.log('✅ In-game status updated\n');

    // Wait to see the update
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('4️⃣ Setting in-game status to false...');
    await setInGameStatus(TEST_USER_ID, false);
    console.log('✅ In-game status updated\n');

    // Wait to see the update
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 4: Set user offline
    console.log('5️⃣ Setting user offline...');
    await setUserOffline(TEST_USER_ID);
    console.log('✅ User set offline\n');

    // Wait to see final update
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Cleanup
    unsubscribe();
    console.log('\n🎉 All presence tests passed!');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
testPresence();
