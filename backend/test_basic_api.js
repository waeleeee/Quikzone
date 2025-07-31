const axios = require('axios');

async function testBasicApi() {
  try {
    console.log('🔍 TESTING BASIC API ENDPOINTS\n');
    
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    try {
      const healthResponse = await axios.get('http://localhost:5000/api/health');
      console.log('✅ Health endpoint working:', healthResponse.data);
    } catch (error) {
      console.log('❌ Health endpoint failed:', error.message);
      return;
    }
    
    // Test parcels endpoint
    console.log('\n2. Testing parcels endpoint...');
    try {
      const parcelsResponse = await axios.get('http://localhost:5000/api/parcels?search=C-219017');
      console.log('✅ Parcels endpoint working');
      console.log('Found parcel:', parcelsResponse.data.data[0]);
    } catch (error) {
      console.log('❌ Parcels endpoint failed:', error.message);
      if (error.response) {
        console.log('Response status:', error.response.status);
        console.log('Response data:', error.response.data);
      }
      return;
    }
    
    // Test tracking history endpoint
    console.log('\n3. Testing tracking history endpoint...');
    try {
      const historyResponse = await axios.get('http://localhost:5000/api/parcels/221/tracking-history');
      console.log('✅ Tracking history endpoint working');
      console.log('Response:', historyResponse.data);
    } catch (error) {
      console.log('❌ Tracking history endpoint failed:', error.message);
      if (error.response) {
        console.log('Response status:', error.response.status);
        console.log('Response data:', error.response.data);
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
  }
}

testBasicApi(); 