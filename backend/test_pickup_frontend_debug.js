const axios = require('axios');

// Test configuration
const API_BASE_URL = 'http://localhost:5001/api';
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjI4LCJlbWFpbCI6IndhZWxfYWRtaW5AcXVpY2t6b25lLnRuIiwiaWF0IjoxNzU1NjA1OTE5LCJleHAiOjE3NTU2OTIzMTl9.OtaecWT3jz7aB3K25hIpFmMUAsgPy8e3j4NsC4aBNy0';

async function testPickupFrontendDebug() {
  try {
    console.log('🧪 TESTING PICKUP FRONTEND DEBUG\n');
    console.log('=' .repeat(60));
    
    // Test 1: Check if backend is running and accessible
    console.log('📋 Test 1: Backend connectivity...');
    try {
      const healthResponse = await axios.get(`${API_BASE_URL.replace('/api', '')}/health`, { timeout: 5000 });
      console.log('✅ Backend is running');
    } catch (error) {
      console.log('❌ Backend connectivity issue:', error.message);
      return;
    }
    
    // Test 2: Test pickup missions endpoint with admin token
    console.log('\n📋 Test 2: Pickup missions endpoint (Admin role)...');
    try {
      const missionsResponse = await axios.get(`${API_BASE_URL}/pickup-missions`, {
        headers: { Authorization: `Bearer ${TEST_TOKEN}` }
      });
      
      console.log('✅ GET /pickup-missions successful');
      console.log('📊 Response structure:', {
        hasMissions: !!missionsResponse.data?.missions,
        missionsLength: missionsResponse.data?.missions?.length || 0,
        hasPagination: !!missionsResponse.data?.pagination,
        userRole: missionsResponse.data?.userRole,
        agencyFilter: missionsResponse.data?.agencyFilter,
        responseKeys: Object.keys(missionsResponse.data || {})
      });
      
      if (missionsResponse.data?.missions && missionsResponse.data.missions.length > 0) {
        console.log('📊 Sample mission:', {
          id: missionsResponse.data.missions[0].id,
          mission_number: missionsResponse.data.missions[0].mission_number,
          agency: missionsResponse.data.missions[0].agency,
          status: missionsResponse.data.missions[0].status
        });
      }
      
    } catch (error) {
      console.error('❌ GET /pickup-missions failed:', error.message);
      if (error.response) {
        console.error('❌ Status:', error.response.status);
        console.error('❌ Data:', error.response.data);
      }
    }
    
    // Test 3: Test available livreurs endpoint
    console.log('\n📋 Test 3: Available livreurs endpoint...');
    try {
      const livreursResponse = await axios.get(`${API_BASE_URL}/pickup-missions/available-livreurs`, {
        headers: { Authorization: `Bearer ${TEST_TOKEN}` }
      });
      
      console.log('✅ GET /available-livreurs successful');
      console.log('📊 Response structure:', {
        hasDrivers: !!livreursResponse.data?.drivers,
        driversLength: livreursResponse.data?.drivers?.length || 0,
        userRole: livreursResponse.data?.userRole,
        agencyFilter: livreursResponse.data?.agencyFilter,
        responseKeys: Object.keys(livreursResponse.data || {})
      });
      
      if (livreursResponse.data?.drivers && livreursResponse.data.drivers.length > 0) {
        console.log('📊 Sample driver:', {
          id: livreursResponse.data.drivers[0].id,
          name: livreursResponse.data.drivers[0].name,
          agency: livreursResponse.data.drivers[0].agency
        });
      }
      
    } catch (error) {
      console.error('❌ GET /available-livreurs failed:', error.message);
      if (error.response) {
        console.error('❌ Status:', error.response.status);
        console.error('❌ Data:', error.response.data);
      }
    }
    
    // Test 4: Test accepted demands endpoint
    console.log('\n📋 Test 4: Accepted demands endpoint...');
    try {
      const demandsResponse = await axios.get(`${API_BASE_URL}/pickup-missions/accepted-demands`, {
        headers: { Authorization: `Bearer ${TEST_TOKEN}` }
      });
      
      console.log('✅ GET /accepted-demands successful');
      console.log('📊 Response structure:', {
        hasDemands: !!demandsResponse.data?.demands,
        demandsLength: demandsResponse.data?.demands?.length || 0,
        userRole: demandsResponse.data?.userRole,
        agencyFilter: demandsResponse.data?.agencyFilter,
        responseKeys: Object.keys(demandsResponse.data || {})
      });
      
      if (demandsResponse.data?.demands && demandsResponse.data.demands.length > 0) {
        console.log('📊 Sample demand:', {
          id: demandsResponse.data.demands[0].id,
          expediteur_name: demandsResponse.data.demands[0].expediteur_name,
          expediteur_agency: demandsResponse.data.demands[0].expediteur_agency,
          status: demandsResponse.data.demands[0].status
        });
      }
      
    } catch (error) {
      console.error('❌ GET /accepted-demands failed:', error.message);
      if (error.response) {
        console.error('❌ Status:', error.response.status);
        console.error('❌ Data:', error.response.data);
      }
    }
    
    // Test 5: Test personnel/livreurs endpoint (what frontend actually calls)
    console.log('\n📋 Test 5: Personnel livreurs endpoint (Frontend calls this)...');
    try {
      const personnelResponse = await axios.get(`${API_BASE_URL}/personnel/livreurs`, {
        headers: { Authorization: `Bearer ${TEST_TOKEN}` }
      });
      
      console.log('✅ GET /personnel/livreurs successful');
      console.log('📊 Response structure:', {
        hasData: !!personnelResponse.data?.data,
        dataLength: personnelResponse.data?.data?.length || 0,
        success: personnelResponse.data?.success,
        responseKeys: Object.keys(personnelResponse.data || {})
      });
      
      if (personnelResponse.data?.data && personnelResponse.data.data.length > 0) {
        console.log('📊 Sample driver from personnel:', {
          id: personnelResponse.data.data[0].id,
          name: personnelResponse.data.data[0].name,
          agency: personnelResponse.data.data[0].agency
        });
      }
      
    } catch (error) {
      console.error('❌ GET /personnel/livreurs failed:', error.message);
      if (error.response) {
        console.error('❌ Status:', error.response.status);
        console.error('❌ Data:', error.response.data);
      }
    }
    
    // Test 6: Test demands endpoint (what frontend actually calls)
    console.log('\n📋 Test 6: Demands endpoint (Frontend calls this)...');
    try {
      const demandsResponse = await axios.get(`${API_BASE_URL}/demands?status=Accepted`, {
        headers: { Authorization: `Bearer ${TEST_TOKEN}` }
      });
      
      console.log('✅ GET /demands?status=Accepted successful');
      console.log('📊 Response structure:', {
        hasDemands: !!demandsResponse.data?.demands,
        demandsLength: demandsResponse.data?.demands?.length || 0,
        success: demandsResponse.data?.success,
        responseKeys: Object.keys(demandsResponse.data || {})
      });
      
      if (demandsResponse.data?.demands && demandsResponse.data.demands.length > 0) {
        console.log('📊 Sample demand from demands:', {
          id: demandsResponse.data.demands[0].id,
          expediteur_name: demandsResponse.data.demands[0].expediteur_name,
          expediteur_agency: demandsResponse.data.demands[0].expediteur_agency,
          status: demandsResponse.data.demands[0].status
        });
      }
      
    } catch (error) {
      console.error('❌ GET /demands?status=Accepted failed:', error.message);
      if (error.response) {
        console.error('❌ Status:', error.response.status);
        console.error('❌ Data:', error.response.data);
      }
    }
    
    console.log('\n🎉 Frontend debug test completed!');
    console.log('🔧 Check the response structures above to see what the frontend should expect');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testPickupFrontendDebug()
  .then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });










