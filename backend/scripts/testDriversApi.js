const axios = require('axios');

const testDriversAPI = async () => {
  try {
    console.log('🧪 Testing drivers API...');
    
    const response = await axios.get('http://localhost:5000/api/personnel/livreurs');
    
    console.log('📊 API Response:');
    console.log('Status:', response.status);
    console.log('Success:', response.data.success);
    console.log('Number of drivers:', response.data.data.length);
    
    console.log('\n📋 Drivers data:');
    response.data.data.forEach((driver, index) => {
      console.log(`${index + 1}. ${driver.name} (${driver.email})`);
      console.log(`   - Has password: ${driver.has_password}`);
      console.log(`   - Agency: ${driver.agency}`);
      console.log('');
    });
    
    // Check specific drivers that should have passwords
    const driversWithPasswords = response.data.data.filter(d => d.has_password);
    console.log(`✅ Drivers with passwords: ${driversWithPasswords.length}/${response.data.data.length}`);
    
    driversWithPasswords.forEach(driver => {
      console.log(`   - ${driver.name} (${driver.email}): ${driver.has_password ? '✅' : '❌'}`);
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
testDriversAPI()
  .then(() => {
    console.log('✅ API test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ API test failed:', error);
    process.exit(1);
  }); 