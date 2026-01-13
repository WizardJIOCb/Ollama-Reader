/**
 * Test script to verify user registration event tracking
 * Tests:
 * 1. User registration creates action record
 * 2. Action has correct type and target
 * 3. Event data is properly formatted
 * 4. Event appears in Last Actions feed
 * 
 * IMPORTANT: Server must be running on port 3000 before running this test
 */

const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3000';

async function testUserRegistration() {
  console.log('='.repeat(60));
  console.log('Testing User Registration Event Tracking');
  console.log('='.repeat(60));

  // Generate unique username
  const timestamp = Date.now();
  const testUsername = `testuser_${timestamp}`;
  
  try {
    console.log('\n1. Registering new user...');
    console.log(`   Username: ${testUsername}`);
    
    const registerResponse = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: testUsername,
        password: 'testpassword123',
        email: `${testUsername}@test.com`,
        fullName: 'Test User Registration'
      })
    });

    if (!registerResponse.ok) {
      const errorText = await registerResponse.text();
      console.error('❌ Registration failed:', errorText);
      return;
    }

    const registerData = await registerResponse.json();
    console.log('✅ User registered successfully');
    console.log(`   User ID: ${registerData.user.id}`);
    console.log(`   Username: ${registerData.user.username}`);
    
    // Wait a bit for the action to be created and broadcast
    console.log('\n2. Waiting for action creation and shelf setup (2 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if default shelf was created
    console.log('\n3. Checking if default "My books" shelf was created...');
    const shelvesResponse = await fetch(`${API_BASE}/api/shelves`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${registerData.token}`
      }
    });
    
    if (shelvesResponse.ok) {
      const shelvesData = await shelvesResponse.json();
      console.log(`   Total shelves: ${shelvesData.length}`);
      
      const defaultShelf = shelvesData.find(shelf => shelf.name === 'My books');
      if (defaultShelf) {
        console.log('\n✅ Default shelf "My books" was created!');
        console.log('   Shelf Details:');
        console.log(`   - ID: ${defaultShelf.id}`);
        console.log(`   - Name: ${defaultShelf.name}`);
        console.log(`   - Description: ${defaultShelf.description}`);
        console.log(`   - Color: ${defaultShelf.color}`);
      } else {
        console.log('\n❌ Default shelf "My books" was NOT created');
        if (shelvesData.length > 0) {
          console.log('   Found shelves:', shelvesData.map(s => s.name));
        }
      }
    } else {
      console.log('\n⚠️  Could not fetch shelves to verify');
    }
    
    // Fetch Last Actions to verify the event appears
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
    
    // Find the registration event
    const registrationEvent = lastActionsData.activities.find(
      activity => activity.action_type === 'user_registered' && 
                  activity.userId === registerData.user.id
    );
    
    if (registrationEvent) {
      console.log('\n✅ Registration event found in Last Actions!');
      console.log('   Event Details:');
      console.log(`   - ID: ${registrationEvent.id}`);
      console.log(`   - Action Type: ${registrationEvent.action_type}`);
      console.log(`   - User ID: ${registrationEvent.userId}`);
      console.log(`   - Username: ${registrationEvent.user?.username || 'N/A'}`);
      console.log(`   - Target Type: ${registrationEvent.target?.type || 'N/A'}`);
      console.log(`   - Target ID: ${registrationEvent.target?.id || 'N/A'}`);
      console.log(`   - Created At: ${registrationEvent.createdAt}`);
      
      // Verify structure
      console.log('\n5. Verifying event structure...');
      const checks = [
        { name: 'Has correct action_type', pass: registrationEvent.action_type === 'user_registered' },
        { name: 'Has user object', pass: !!registrationEvent.user },
        { name: 'User has username', pass: !!registrationEvent.user?.username },
        { name: 'User has id', pass: !!registrationEvent.user?.id },
        { name: 'Has target object', pass: !!registrationEvent.target },
        { name: 'Target type is user', pass: registrationEvent.target?.type === 'user' },
        { name: 'Target id matches user', pass: registrationEvent.target?.id === registerData.user.id },
        { name: 'Has metadata', pass: !!registrationEvent.metadata },
        { name: 'Has createdAt timestamp', pass: !!registrationEvent.createdAt }
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
      console.log('\n❌ Registration event NOT found in Last Actions');
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
testUserRegistration();
