const axios = require('axios');

const testParcelEndpoint = async () => {
  try {
    console.log('🧪 Testing parcels endpoint...\n');
    
    // Test the health endpoint first
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get('http://localhost:5000/api/health');
    console.log('✅ Health endpoint works:', healthResponse.data);
    
    // Test getting all parcels
    console.log('\n2. Testing get all parcels...');
    const parcelsResponse = await axios.get('http://localhost:5000/api/parcels');
    console.log('✅ Parcels endpoint works');
    console.log('Response status:', parcelsResponse.status);
    console.log('Response data keys:', Object.keys(parcelsResponse.data || {}));
    
    if (parcelsResponse.data && parcelsResponse.data.data && parcelsResponse.data.data.length > 0) {
      const firstParcel = parcelsResponse.data.data[0];
      console.log('First parcel ID:', firstParcel.id);
      console.log('First parcel tracking number:', firstParcel.tracking_number);
      
      // Test getting single parcel
      console.log('\n3. Testing get single parcel...');
      const singleParcelResponse = await axios.get(`http://localhost:5000/api/parcels/${firstParcel.id}`);
      console.log('✅ Single parcel endpoint works');
      console.log('Response status:', singleParcelResponse.status);
      console.log('Response data keys:', Object.keys(singleParcelResponse.data || {}));
      console.log('Single parcel data:', JSON.stringify(singleParcelResponse.data, null, 2));
      
    } else {
      console.log('❌ No parcels found in database');
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
};

testParcelEndpoint(); 