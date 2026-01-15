/**
 * Test script to verify shelf creation event tracking
 * Tests:
 * 1. User creates a new shelf
 * 2. Action has correct type and target
 * 3. Event appears in Last Actions feed
 * 
 * IMPORTANT: Server must be running on port 3000 before running this test
 * You must have a valid user account to test
 */

const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3000';

// Test configuration - update with your credentials
const TEST_USERNAME = 'testuser'; // Change to your test user
const TEST_PASSWORD = 'testpassword'; // Change to your test password

async function testShelfCreation() {
  console.log('='.repeat(60));
  console.log('Testing Shelf Creation Event Tracking');
  console.log('='.repeat(60));

  try {
    // 1. Login
    console.log('\n1. Logging in...');
    const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: TEST_USERNAME,
        password: TEST_PASSWORD
      })
    });

    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      console.error('❌ Login failed:', errorText);
      console.log('\n⚠️  Please update TEST_USERNAME and TEST_PASSWORD in the script');
      return;
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;
    const userId = loginData.user.id;
    console.log('✅ Logged in successfully');
    console.log(`   User ID: ${userId}`);
    console.log(`   Username: ${loginData.user.username}`);
    
    // 2. Create a new shelf
    console.log('\n2. Creating a new shelf...');
    const timestamp = Date.now();
    const shelfName = `Test Shelf ${timestamp}`;
    
    const createShelfResponse = await fetch(`${API_BASE}/api/shelves`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: shelfName,
        description: 'Test shelf for event tracking',
        color: 'bg-purple-100 dark:bg-purple-900/20'
      })
    });

    if (!createShelfResponse.ok) {
      const errorText = await createShelfResponse.text();
      console.error('❌ Shelf creation failed:', errorText);
      return;
    }

    const shelfData = await createShelfResponse.json();
    console.log('✅ Shelf created successfully');
    console.log(`   Shelf ID: ${shelfData.id}`);
    console.log(`   Shelf Name: ${shelfData.name}`);
    
    // 3. Wait for action creation and broadcast
    console.log('\n3. Waiting for action creation (2 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 4. Fetch Last Actions to verify the event appears
    console.log('\n4. Checking Last Actions feed...');
    const lastActionsResponse = await fetch(`${API_BASE}/api/stream/last-actions?limit=10`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!lastActionsResponse.ok) {
      const errorText = await lastActionsResponse.text();
      console.error('❌ Failed to fetch Last Actions:', errorText);
      return;
    }

    const lastActionsData = await lastActionsResponse.json();
    console.log(`   Total actions retrieved: ${lastActionsData.activities.length}`);
    
    // Find the shelf creation event
    const shelfCreationEvent = lastActionsData.activities.find(
      activity => activity.action_type === 'shelf_created' && 
                  activity.target?.id === shelfData.id
    );
    
    if (shelfCreationEvent) {
      console.log('\n✅ Shelf creation event found in Last Actions!');
      console.log('   Event Details:');
      console.log(`   - ID: ${shelfCreationEvent.id}`);
      console.log(`   - Action Type: ${shelfCreationEvent.action_type}`);
      console.log(`   - User ID: ${shelfCreationEvent.userId}`);
      console.log(`   - Username: ${shelfCreationEvent.user?.username || 'N/A'}`);
      console.log(`   - Target Type: ${shelfCreationEvent.target?.type || 'N/A'}`);
      console.log(`   - Target ID: ${shelfCreationEvent.target?.id || 'N/A'}`);
      console.log(`   - Shelf Name: ${shelfCreationEvent.target?.name || 'N/A'}`);
      console.log(`   - Created At: ${shelfCreationEvent.createdAt}`);
      
      // Verify structure
      console.log('\n5. Verifying event structure...');
      const checks = [
        { name: 'Has correct action_type', pass: shelfCreationEvent.action_type === 'shelf_created' },
        { name: 'Has user object', pass: !!shelfCreationEvent.user },
        { name: 'User has username', pass: !!shelfCreationEvent.user?.username },
        { name: 'User has id', pass: !!shelfCreationEvent.user?.id },
        { name: 'Has target object', pass: !!shelfCreationEvent.target },
        { name: 'Target type is shelf', pass: shelfCreationEvent.target?.type === 'shelf' },
        { name: 'Target has shelf name', pass: !!shelfCreationEvent.target?.name },
        { name: 'Shelf name matches', pass: shelfCreationEvent.target?.name === shelfName },
        { name: 'Has metadata', pass: !!shelfCreationEvent.metadata },
        { name: 'Has createdAt timestamp', pass: !!shelfCreationEvent.createdAt }
      ];
      
      checks.forEach(check => {
        console.log(`   ${check.pass ? '✅' : '❌'} ${check.name}`);
      });
      
      const allPassed = checks.every(c => c.pass);
      if (allPassed) {
        console.log('\n✅ All structure checks passed!');
      } else {
        console.log('\n⚠️  Some structure checks failed');
      }
      
    } else {
      console.log('\n❌ Shelf creation event NOT found in Last Actions');
      console.log('   Recent actions:');
      lastActionsData.activities.slice(0, 3).forEach(activity => {
        console.log(`   - ${activity.action_type} by user ${activity.userId}`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('Test completed');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ Test error:', error.message);
    console.error(error);
  }
}

// Run the test
testShelfCreation();
