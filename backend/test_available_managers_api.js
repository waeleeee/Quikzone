const axios = require('axios');

const testAvailableManagersAPI = async () => {
  try {
    console.log('🧪 Testing available managers API...\n');
    
    const response = await axios.get('http://localhost:5001/api/warehouses/available-managers');
    
    console.log('✅ API Response:');
    console.log('Status:', response.status);
    console.log('Success:', response.data.success);
    console.log('Data length:', response.data.data ? response.data.data.length : 'No data');
    
    if (response.data.success && response.data.data) {
      console.log('\n📋 Available Managers:');
      console.log('-' .repeat(80));
      
      response.data.data.forEach((manager, index) => {
        console.log(`${index + 1}. ${manager.name} (${manager.role}) - ${manager.email}`);
      });
      
      console.log(`\n✅ Total available managers: ${response.data.data.length}`);
    } else {
      console.log('❌ API returned error:', response.data.message);
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  } finally {
    process.exit(0);
  }
};

testAvailableManagersAPI(); 