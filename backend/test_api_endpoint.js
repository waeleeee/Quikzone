const axios = require('axios');

async function testApiEndpoint() {
  try {
    console.log('🔍 TESTING TRACKING HISTORY API ENDPOINT\n');
    
    // First, get the parcel ID for C-219017
    const parcelsResponse = await axios.get('http://localhost:5000/api/parcels?search=C-219017');
    const parcelsData = parcelsResponse.data;
    
    if (!parcelsData.success || parcelsData.data.length === 0) {
      console.log('❌ Parcel C-219017 not found');
      return;
    }
    
    const parcel = parcelsData.data[0];
    console.log(`📦 Found parcel: ID ${parcel.id}, Status: ${parcel.status}`);
    
    // Now get the tracking history
    const historyResponse = await axios.get(`http://localhost:5000/api/parcels/${parcel.id}/tracking-history`);
    const historyData = historyResponse.data;
    
    console.log('\n📊 API Response:');
    console.log('=====================================');
    console.log('Success:', historyData.success);
    
    if (historyData.success && historyData.data.tracking_history) {
      console.log('\n📅 Tracking History:');
      historyData.data.tracking_history.forEach((record, index) => {
        console.log(`\nRecord ${index + 1}:`);
        console.log(`  Status: ${record.status}`);
        console.log(`  Timestamp: ${record.timestamp}`);
        console.log(`  Notes: ${record.notes}`);
        console.log(`  Updated by: ${record.updated_by}`);
        console.log(`  Mission number: ${record.mission_number}`);
      });
    } else {
      console.log('❌ No tracking history data in response');
      console.log('Response:', historyData);
    }
    
  } catch (error) {
    console.error('❌ Error testing API endpoint:', error.message);
  }
}

testApiEndpoint(); 