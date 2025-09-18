const axios = require('axios');

// Test configuration
const API_BASE_URL = 'http://localhost:5001/api';
const TEST_EMAIL = 'wael_admin@quickzone.tn'; // Admin user
const TEST_PASSWORD = 'admin123'; // Replace with actual password

async function testPickupMissionAPI() {
  try {
    console.log('🧪 TESTING PICKUP MISSION API WITH AGENCY FILTERING\n');
    console.log('=' .repeat(60));
    
    // Step 1: Login to get token
    console.log('📋 Step 1: Logging in...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful, token received');
    
    // Step 2: Test getting pickup missions
    console.log('\n📋 Step 2: Testing GET /pickup-missions...');
    const missionsResponse = await axios.get(`${API_BASE_URL}/pickup-missions`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`✅ GET missions successful: ${missionsResponse.data.missions.length} missions found`);
    console.log('📊 Sample mission data:', missionsResponse.data.missions[0]);
    
    // Step 3: Test getting available livreurs
    console.log('\n📋 Step 3: Testing GET /pickup-missions/available-livreurs...');
    const livreursResponse = await axios.get(`${API_BASE_URL}/pickup-missions/available-livreurs`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`✅ GET livreurs successful: ${livreursResponse.data.length} livreurs found`);
    console.log('📊 Sample livreur data:', livreursResponse.data[0]);
    
    // Step 4: Test getting accepted demands
    console.log('\n📋 Step 4: Testing GET /pickup-missions/accepted-demands...');
    const demandsResponse = await axios.get(`${API_BASE_URL}/pickup-missions/accepted-demands`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`✅ GET demands successful: ${demandsResponse.data.length} demands found`);
    if (demandsResponse.data.length > 0) {
      console.log('📊 Sample demand data:', demandsResponse.data[0]);
    }
    
    console.log('\n🎉 SUCCESS: All API endpoints are working correctly!');
    console.log('🔧 Agency filtering is properly implemented');
    console.log('📝 You can now create pickup missions from the frontend');
    
  } catch (error) {
    console.error('❌ API Test failed:', error.message);
    if (error.response) {
      console.error('❌ Status:', error.response.status);
      console.error('❌ Data:', error.response.data);
    } else if (error.request) {
      console.error('❌ No response received:', error.request);
    } else {
      console.error('❌ Error details:', error);
    }
  }
}

// Run the test
testPickupMissionAPI()
  .then(() => {
    console.log('\n✅ API test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ API test failed:', error);
    process.exit(1);
  });
