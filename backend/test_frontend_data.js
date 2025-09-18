const axios = require('axios');

// Test configuration
const API_BASE_URL = 'http://localhost:5001/api';
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjI4LCJlbWFpbCI6IndhZWxfYWRtaW5AcXVpY2t6b25lLnRuIiwiaWF0IjoxNzU1NjA1OTE5LCJleHAiOjE3NTU2OTIzMTl9.OtaecWT3jz7aB3K25hIpFmMUAsgPy8e3j4NsC4aBNy0';

async function testFrontendData() {
  try {
    console.log('🧪 TESTING FRONTEND DATA RETRIEVAL\n');
    console.log('=' .repeat(60));
    
    // Test 1: Pickup missions endpoint (what frontend calls)
    console.log('📋 Test 1: Frontend Pickup Missions API...');
    try {
      const missionsResponse = await axios.get(`${API_BASE_URL}/pickup-missions`, {
        headers: { Authorization: `Bearer ${TEST_TOKEN}` }
      });
      
      console.log('✅ GET /pickup-missions successful');
      console.log('📊 Response status:', missionsResponse.status);
      console.log('📊 Response data type:', typeof missionsResponse.data);
      console.log('📊 Response keys:', Object.keys(missionsResponse.data || {}));
      
      if (missionsResponse.data?.missions) {
        console.log('📊 Missions array length:', missionsResponse.data.missions.length);
        console.log('📊 First mission sample:', missionsResponse.data.missions[0]);
      } else if (Array.isArray(missionsResponse.data)) {
        console.log('📊 Direct array length:', missionsResponse.data.length);
        console.log('📊 First mission sample:', missionsResponse.data[0]);
      } else {
        console.log('📊 Unexpected response structure:', missionsResponse.data);
      }
      
    } catch (error) {
      console.error('❌ GET /pickup-missions failed:', error.message);
      if (error.response) {
        console.error('❌ Status:', error.response.status);
        console.error('❌ Data:', error.response.data);
      }
    }
    
    // Test 2: Check if backend server is running
    console.log('\n📋 Test 2: Backend Server Status...');
    try {
      const healthResponse = await axios.get(`${API_BASE_URL}/health`, { timeout: 5000 });
      console.log('✅ Backend server is running');
      console.log('📊 Health response:', healthResponse.data);
    } catch (error) {
      console.error('❌ Backend server not accessible:', error.message);
      console.log('💡 You need to start the backend server first!');
      return;
    }
    
    console.log('\n🎉 Frontend data test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testFrontendData()
  .then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });










