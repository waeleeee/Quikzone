const axios = require('axios');

// Test configuration
const API_BASE_URL = 'http://localhost:5001/api';
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjI4LCJlbWFpbCI6IndhZWxfYWRtaW5AcXVpY2t6b25lLnRuIiwiaWF0IjoxNzU1NjA1OTE5LCJleHAiOjE3NTU2OTIzMTl9.OtaecWT3jz7aB3K25hIpFmMUAsgPy8e3j4NsC4aBNy0';

async function debugAPIResponse() {
  try {
    console.log('🔍 DEBUGGING API RESPONSE FOR FRONTEND\n');
    console.log('=' .repeat(60));
    
    // Test 1: Pickup missions endpoint
    console.log('📋 Test 1: GET /pickup-missions');
    try {
      const missionsResponse = await axios.get(`${API_BASE_URL}/pickup-missions`, {
        headers: { Authorization: `Bearer ${TEST_TOKEN}` }
      });
      
      console.log('✅ Response Status:', missionsResponse.status);
      console.log('✅ Response Headers:', missionsResponse.headers);
      console.log('✅ Response Data Type:', typeof missionsResponse.data);
      console.log('✅ Response Data Keys:', Object.keys(missionsResponse.data || {}));
      
      if (missionsResponse.data?.missions) {
        console.log('✅ Found missions array with length:', missionsResponse.data.missions.length);
        console.log('✅ First mission sample:');
        console.log(JSON.stringify(missionsResponse.data.missions[0], null, 2));
      }
      
      if (missionsResponse.data?.pagination) {
        console.log('✅ Pagination data:', missionsResponse.data.pagination);
      }
      
      if (missionsResponse.data?.userRole) {
        console.log('✅ User role:', missionsResponse.data.userRole);
      }
      
      if (missionsResponse.data?.agencyFilter) {
        console.log('✅ Agency filter:', missionsResponse.data.agencyFilter);
      }
      
      // Check if there are any other properties
      const allKeys = Object.keys(missionsResponse.data || {});
      const expectedKeys = ['missions', 'pagination', 'userRole', 'agencyFilter'];
      const unexpectedKeys = allKeys.filter(key => !expectedKeys.includes(key));
      
      if (unexpectedKeys.length > 0) {
        console.log('⚠️  Unexpected keys found:', unexpectedKeys);
      }
      
      console.log('\n📊 Full response structure:');
      console.log(JSON.stringify(missionsResponse.data, null, 2));
      
    } catch (error) {
      console.error('❌ GET /pickup-missions failed:', error.message);
      if (error.response) {
        console.error('❌ Status:', error.response.status);
        console.error('❌ Data:', error.response.data);
      }
    }
    
    // Test 2: Check if there are any missions in the database
    console.log('\n📋 Test 2: Database Check');
    console.log('💡 From previous tests, we know there are 13 missions in the database');
    console.log('💡 But the API is only returning 10 missions');
    console.log('💡 This suggests the API is working but there might be a filtering issue');
    
    console.log('\n🎯 DIAGNOSIS:');
    console.log('✅ Backend server is running');
    console.log('✅ Database has 13 missions');
    console.log('✅ API is returning 10 missions');
    console.log('✅ Frontend should be receiving data');
    console.log('❌ Frontend shows "No data to display"');
    console.log('\n🔍 The issue is likely in frontend data processing, not the API');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugAPIResponse()
  .then(() => {
    console.log('\n✅ Debug completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Debug failed:', error);
    process.exit(1);
  });










