const axios = require('axios');
const jwt = require('jsonwebtoken');

const testShippersAPI = async () => {
  try {
    console.log('🔍 Testing shippers API endpoint...\n');

    // First, get a valid token for the Chef d'agence
    console.log('📋 Getting auth token...');
    console.log('-' .repeat(50));
    
    const loginResponse = await axios.post('http://localhost:5000/auth/login', {
      email: 'bensalah@quickzone.tn',
      password: '12345678'
    });
    
    if (!loginResponse.data.success) {
      console.log('❌ Login failed:', loginResponse.data);
      return;
    }
    
    const token = loginResponse.data.data.accessToken;
    const user = loginResponse.data.data.user;
    
    console.log('✅ Login successful');
    console.log('✅ User:', user.first_name, user.last_name);
    console.log('✅ Role:', user.role);
    console.log('✅ Token:', token.substring(0, 20) + '...');

    // Test the shippers API with the token
    console.log('\n📋 Testing shippers API...');
    console.log('-' .repeat(50));
    
    const shippersResponse = await axios.get('http://localhost:5000/shippers', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Shippers API response status:', shippersResponse.status);
    console.log('✅ Response data:', shippersResponse.data);
    
    if (shippersResponse.data.success) {
      const shippers = shippersResponse.data.data.shippers;
      console.log(`✅ Found ${shippers.length} shippers`);
      
      if (shippers.length > 0) {
        console.log('📋 Shippers:');
        shippers.forEach(shipper => {
          console.log(`  - ID: ${shipper.id}, Name: ${shipper.name}, Email: ${shipper.email}, Agency: ${shipper.agency || 'NULL'}`);
        });
      } else {
        console.log('⚠️ No shippers returned');
      }
    } else {
      console.log('❌ API returned error:', shippersResponse.data);
    }

  } catch (error) {
    console.error('❌ Error testing shippers API:', error.message);
    if (error.response) {
      console.error('❌ Response status:', error.response.status);
      console.error('❌ Response data:', error.response.data);
    }
  } finally {
    process.exit(0);
  }
};

testShippersAPI(); 