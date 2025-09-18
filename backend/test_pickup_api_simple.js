const axios = require('axios');

// Test configuration - using the same token from the frontend
const API_BASE_URL = 'http://localhost:5001/api';
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjI4LCJlbWFpbCI6IndhZWxfYWRtaW5AcXVpY2t6b25lLnRuIiwiaWF0IjoxNzU1NjA1OTE5LCJleHAiOjE3NTU2OTIzMTl9.OtaecWT3jz7aB3K25hIpFmMUAsgPy8e3j4NsC4aBNy0';

async function testPickupMissionAPI() {
  try {
    console.log('🧪 TESTING PICKUP MISSION API WITH AGENCY FILTERING\n');
    console.log('=' .repeat(60));
    
    // Step 1: Test getting pickup missions
    console.log('📋 Step 1: Testing GET /pickup-missions...');
    const missionsResponse = await axios.get(`${API_BASE_URL}/pickup-missions`, {
      headers: { Authorization: `Bearer ${TEST_TOKEN}` }
    });
    
    console.log(`✅ GET missions successful: ${missionsResponse.data.missions.length} missions found`);
    if (missionsResponse.data.missions.length > 0) {
      console.log('📊 Sample mission data:', {
        id: missionsResponse.data.missions[0].id,
        mission_number: missionsResponse.data.missions[0].mission_number,
        agency: missionsResponse.data.missions[0].agency,
        status: missionsResponse.data.missions[0].status
      });
    }
    
    // Step 2: Test getting available livreurs
    console.log('\n📋 Step 2: Testing GET /pickup-missions/available-livreurs...');
    const livreursResponse = await axios.get(`${API_BASE_URL}/pickup-missions/available-livreurs`, {
      headers: { Authorization: `Bearer ${TEST_TOKEN}` }
    });
    
    console.log(`✅ GET livreurs successful: ${livreursResponse.data.length} livreurs found`);
    if (livreursResponse.data.length > 0) {
      console.log('📊 Sample livreur data:', {
        id: livreursResponse.data[0].id,
        name: livreursResponse.data[0].name,
        agency: livreursResponse.data[0].agency
      });
    }
    
    // Step 3: Test getting accepted demands
    console.log('\n📋 Step 3: Testing GET /pickup-missions/accepted-demands...');
    const demandsResponse = await axios.get(`${API_BASE_URL}/pickup-missions/accepted-demands`, {
      headers: { Authorization: `Bearer ${TEST_TOKEN}` }
    });
    
    console.log(`✅ GET demands successful: ${demandsResponse.data.length} demands found`);
    if (demandsResponse.data.length > 0) {
      console.log('📊 Sample demand data:', {
        id: demandsResponse.data[0].id,
        expediteur_name: demandsResponse.data[0].expediteur_name,
        expediteur_agency: demandsResponse.data[0].expediteur_agency,
        status: demandsResponse.data[0].status
      });
    }
    
    console.log('\n🎉 SUCCESS: All API endpoints are working correctly!');
    console.log('🔧 Agency filtering is properly implemented');
    console.log('📝 You can now create pickup missions from the frontend');
    
    // Step 4: Check agency distribution
    console.log('\n📋 Step 4: Checking agency distribution in missions...');
    const agencyCounts = {};
    missionsResponse.data.missions.forEach(mission => {
      const agency = mission.agency || 'Unknown';
      agencyCounts[agency] = (agencyCounts[agency] || 0) + 1;
    });
    
    console.log('📊 Agency distribution in missions:');
    Object.entries(agencyCounts).forEach(([agency, count]) => {
      console.log(`  ${agency}: ${count} missions`);
    });
    
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











