const axios = require('axios');

const testExpediteurParcels = async () => {
  try {
    console.log('🧪 Testing expediteur parcels API endpoint...\n');
    
    // Test the endpoint for Nadia Gharbi
    const email = 'nadia.gharbi@email.com';
    const url = `http://localhost:5000/api/parcels/expediteur/${encodeURIComponent(email)}`;
    
    console.log(`📡 Testing URL: ${url}`);
    
    const response = await axios.get(url);
    
    console.log('✅ API Response:');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success && response.data.data.parcels) {
      console.log(`\n📦 Found ${response.data.data.parcels.length} parcels for ${email}`);
      
      response.data.data.parcels.forEach((parcel, index) => {
        console.log(`${index + 1}. ${parcel.tracking_number} - ${parcel.destination} (${parcel.status})`);
      });
    } else {
      console.log('❌ No parcels found or unexpected response format');
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
};

testExpediteurParcels(); 