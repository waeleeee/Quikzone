const axios = require('axios');

const debugDriversAPI = async () => {
  try {
    console.log('🔍 Debugging drivers API response...');
    
    const response = await axios.get('http://localhost:5000/api/personnel/livreurs');
    
    console.log('📊 Raw API Response:');
    console.log('Status:', response.status);
    console.log('Success:', response.data.success);
    console.log('Number of drivers:', response.data.data.length);
    
    console.log('\n📋 Raw driver data:');
    response.data.data.forEach((driver, index) => {
      console.log(`\n${index + 1}. ${driver.name} (${driver.email})`);
      console.log('   Raw driver object:', JSON.stringify(driver, null, 2));
      console.log(`   - has_password type: ${typeof driver.has_password}`);
      console.log(`   - has_password value: ${driver.has_password}`);
      console.log(`   - password field exists: ${'password' in driver}`);
      console.log(`   - password value: ${driver.password}`);
    });
    
    // Check if the issue is with the SQL query
    console.log('\n🔍 Checking specific fields:');
    response.data.data.forEach((driver, index) => {
      console.log(`\n${index + 1}. ${driver.name}:`);
      console.log(`   - All keys: ${Object.keys(driver).join(', ')}`);
      console.log(`   - has_password: ${driver.has_password}`);
      console.log(`   - password: ${driver.password}`);
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
debugDriversAPI()
  .then(() => {
    console.log('\n✅ Debug completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Debug failed:', error);
    process.exit(1);
  }); 