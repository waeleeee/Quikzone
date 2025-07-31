const axios = require('axios');

const testExpediteurStats = async () => {
  try {
    console.log('🧪 Testing expediteur stats API endpoint...\n');
    
    // Test with a known expediteur email
    const email = 'wael_expediteur@quickzone.tn';
    const url = `http://localhost:5000/api/parcels/expediteur/${encodeURIComponent(email)}/stats`;
    
    console.log(`📡 Testing URL: ${url}`);
    console.log(`📧 Email: ${email}\n`);
    
    const response = await axios.get(url);
    
    console.log('✅ Expediteur stats API endpoint working');
    console.log('📊 Response data:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // Test the regular parcels endpoint too
    console.log('\n🧪 Testing regular expediteur parcels endpoint...\n');
    const parcelsUrl = `http://localhost:5000/api/parcels/expediteur/${encodeURIComponent(email)}`;
    const parcelsResponse = await axios.get(parcelsUrl);
    console.log('✅ Regular expediteur parcels endpoint working');
    console.log(`📦 Found ${parcelsResponse.data.data.parcels.length} parcels`);
    
  } catch (error) {
    console.error('❌ API endpoint failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    
    // Try the regular parcels endpoint to see if it's a route order issue
    try {
      console.log('\n🧪 Testing regular expediteur parcels endpoint as fallback...\n');
      const email = 'wael_expediteur@quickzone.tn';
      const parcelsUrl = `http://localhost:5000/api/parcels/expediteur/${encodeURIComponent(email)}`;
      const parcelsResponse = await axios.get(parcelsUrl);
      console.log('✅ Regular expediteur parcels endpoint working');
      console.log(`📦 Found ${parcelsResponse.data.data.parcels.length} parcels`);
      console.log('⚠️  Stats endpoint might need server restart');
    } catch (parcelsError) {
      console.error('❌ Both endpoints failed - server might need restart');
    }
  }
};

testExpediteurStats(); 