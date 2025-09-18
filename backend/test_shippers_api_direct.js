const axios = require('axios');

const testShippersAPI = async () => {
  try {
    console.log('🔍 Testing shippers API directly...\n');

    // First, login as Chef d'agence to get a token
    console.log('📋 Logging in as Chef d\'agence...');
    const loginResponse = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'bensalah@quickzone.tn',
      password: '123456'
    });

    if (!loginResponse.data.success) {
      console.log('❌ Login failed:', loginResponse.data.message);
      return;
    }

    const token = loginResponse.data.data.accessToken;
    console.log('✅ Login successful, token received');

    // Test the shippers API with the token
    console.log('\n📋 Testing GET /api/shippers...');
    const shippersResponse = await axios.get('http://localhost:5001/api/shippers', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Shippers API response:');
    console.log('Status:', shippersResponse.status);
    console.log('Success:', shippersResponse.data.success);
    console.log('Total shippers:', shippersResponse.data.data.pagination.total);
    console.log('Shippers count:', shippersResponse.data.data.shippers?.length || 0);

    if (shippersResponse.data.data.shippers && shippersResponse.data.data.shippers.length > 0) {
      console.log('\n📋 Shippers found:');
      shippersResponse.data.data.shippers.forEach((shipper, index) => {
        console.log(`\n  ${index + 1}. ID: ${shipper.id}`);
        console.log(`     Name: ${shipper.name}`);
        console.log(`     Email: ${shipper.email}`);
        console.log(`     Agency: ${shipper.agency || 'NULL'}`);
        console.log(`     Governorate: ${shipper.governorate || 'NULL'}`);
        console.log(`     Total parcels: ${shipper.total_parcels || 0}`);
        console.log(`     Delivered parcels: ${shipper.delivered_parcels || 0}`);
        console.log(`     Returned parcels: ${shipper.returned_parcels || 0}`);
      });
    } else {
      console.log('⚠️ No shippers returned from API');
    }

    // Also test the current user endpoint
    console.log('\n📋 Testing GET /api/auth/me...');
    const userResponse = await axios.get('http://localhost:5001/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Current user data:');
    console.log('Status:', userResponse.status);
    console.log('User data:', userResponse.data);

  } catch (error) {
    console.error('❌ Error testing shippers API:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
};

testShippersAPI(); 