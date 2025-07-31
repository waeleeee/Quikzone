const axios = require('axios');

const testShippersAPI = async () => {
  try {
    console.log('🧪 Testing shippers API...');
    
    const response = await axios.get('http://localhost:5000/api/shippers');
    
    console.log('📊 API Response:');
    console.log('Status:', response.status);
    console.log('Success:', response.data.success);
    console.log('Number of shippers:', response.data.data.shippers.length);
    
    console.log('\n📋 Shippers data:');
    response.data.data.shippers.forEach((shipper, index) => {
      console.log(`${index + 1}. ${shipper.name} (${shipper.email})`);
      console.log(`   - Has password: ${shipper.has_password}`);
      console.log(`   - Agency: ${shipper.agency}`);
      console.log(`   - Status: ${shipper.status}`);
      console.log('');
    });
    
    // Check specific shippers that should have passwords
    const shippersWithPasswords = response.data.data.shippers.filter(s => s.has_password);
    console.log(`✅ Shippers with passwords: ${shippersWithPasswords.length}/${response.data.data.shippers.length}`);
    
    shippersWithPasswords.forEach(shipper => {
      console.log(`   - ${shipper.name} (${shipper.email}): ${shipper.has_password ? '✅' : '❌'}`);
    });
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
};

// Run the test
testShippersAPI()
  .then(() => {
    console.log('✅ API test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ API test failed:', error);
    process.exit(1);
  }); 