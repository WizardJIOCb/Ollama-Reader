// Test script for user action deletion functionality
const fetch = require('node-fetch');

const API_URL = 'http://localhost:5000';

async function testUserActionDeletion() {
  console.log('🧪 Testing User Action Deletion Functionality\n');
  
  // Step 1: Get admin token (you'll need to replace with actual admin credentials)
  console.log('Step 1: Login as admin...');
  const loginResponse = await fetch(`${API_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'admin', // Replace with actual admin username
      password: 'admin123' // Replace with actual admin password
    })
  });
  
  if (!loginResponse.ok) {
    console.error('❌ Failed to login');
    return;
  }
  
  const { token } = await loginResponse.json();
  console.log('✅ Login successful\n');
  
  // Step 2: Get last actions to find a user action
  console.log('Step 2: Fetching last actions...');
  const lastActionsResponse = await fetch(`${API_URL}/api/stream/last-actions?limit=10`);
  
  if (!lastActionsResponse.ok) {
    console.error('❌ Failed to fetch last actions');
    return;
  }
  
  const lastActionsData = await lastActionsResponse.json();
  const userActions = lastActionsData.activities.filter(a => a.type === 'user_action');
  
  console.log(`✅ Found ${userActions.length} user actions\n`);
  
  if (userActions.length === 0) {
    console.log('⚠️  No user actions to delete. Test cannot proceed.');
    console.log('Navigate around the app to create some user actions first.');
    return;
  }
  
  // Step 3: Try to delete a user action
  const actionToDelete = userActions[0];
  console.log('Step 3: Attempting to delete user action...');
  console.log(`Action ID: ${actionToDelete.id}`);
  console.log(`Action Type: ${actionToDelete.action_type}`);
  console.log(`Entity ID: ${actionToDelete.entityId}\n`);
  
  const deleteResponse = await fetch(`${API_URL}/api/stream/activities/${actionToDelete.entityId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!deleteResponse.ok) {
    const errorText = await deleteResponse.text();
    console.error('❌ Failed to delete user action');
    console.error('Response:', errorText);
    return;
  }
  
  const deleteResult = await deleteResponse.json();
  console.log('✅ User action deleted successfully!');
  console.log('Response:', deleteResult);
  console.log('');
  
  // Step 4: Verify deletion
  console.log('Step 4: Verifying deletion...');
  const verifyResponse = await fetch(`${API_URL}/api/stream/last-actions?limit=50`);
  const verifyData = await verifyResponse.json();
  const stillExists = verifyData.activities.some(a => a.id === actionToDelete.id);
  
  if (stillExists) {
    console.error('❌ Action still exists after deletion!');
  } else {
    console.log('✅ Action successfully removed from stream!');
  }
  
  console.log('\n✅ Test completed successfully!');
}

// Run the test
testUserActionDeletion().catch(error => {
  console.error('❌ Test failed with error:', error);
});
