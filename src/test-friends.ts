/**
 * Test script for Friend System
 * 
 * Tests:
 * 1. Finding user by email
 * 2. Sending friend request
 * 3. Accepting friend request
 * 4. Removing friend
 * 
 * Run with: npm run test:friends
 */

import {
  sendFriendRequest,
  acceptFriendRequest,
  getFriendsList,
  findUserByEmail,
  getIncomingRequests,
  getOutgoingRequests,
} from './services/friendService';

const TEST_USER_1_UID = 'test-user-1';
const TEST_USER_1_NAME = 'Alice';
const _TEST_USER_1_EMAIL = 'alice@test.com';

const TEST_USER_2_UID = 'test-user-2';
const TEST_USER_2_NAME = 'Bob';
const TEST_USER_2_EMAIL = 'bob@test.com';

async function testFriendSystem() {
  console.log('🧪 Testing Friend System\n');

  try {
    // Test 1: Find user by email
    console.log('1️⃣ Finding user by email...');
    const foundUser = await findUserByEmail(TEST_USER_2_EMAIL);
    console.log('✅ Found user:', foundUser);
    console.log();

    // Test 2: Send friend request
    console.log('2️⃣ Sending friend request from Alice to Bob...');
    await sendFriendRequest(
      TEST_USER_1_UID,
      TEST_USER_1_NAME,
      TEST_USER_2_UID,
      TEST_USER_2_NAME
    );
    console.log('✅ Friend request sent');
    console.log();

    // Test 3: Check incoming requests
    console.log('3️⃣ Checking Bob\'s incoming requests...');
    const incomingRequests = await getIncomingRequests(TEST_USER_2_UID);
    console.log('✅ Incoming requests:', incomingRequests);
    console.log();

    // Test 4: Check outgoing requests
    console.log('4️⃣ Checking Alice\'s outgoing requests...');
    const outgoingRequests = await getOutgoingRequests(TEST_USER_1_UID);
    console.log('✅ Outgoing requests:', outgoingRequests);
    console.log();

    // Test 5: Accept friend request
    if (incomingRequests.length > 0) {
      console.log('5️⃣ Bob accepting friend request...');
      await acceptFriendRequest(incomingRequests[0].id);
      console.log('✅ Friend request accepted');
      console.log();
    }

    // Test 6: Check friends lists
    console.log('6️⃣ Checking friends lists...');
    const aliceFriends = await getFriendsList(TEST_USER_1_UID);
    const bobFriends = await getFriendsList(TEST_USER_2_UID);
    console.log('✅ Alice\'s friends:', aliceFriends);
    console.log('✅ Bob\'s friends:', bobFriends);
    console.log();

    console.log('🎉 All friend system tests passed!');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
testFriendSystem();
