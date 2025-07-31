const axios = require('axios');

async function testAgencyManagerCreation() {
  try {
    console.log('🧪 Testing agency manager creation...');
    
    const testData = {
      name: 'Test Chef Monastir',
      email: 'test.chef.monastir@quickzone.tn',
      password: 'test123',
      phone: '+216 71 123 456',
      governorate: 'Monastir',
      address: 'Test Address Monastir',
      agency: 'Monastir'
    };
    
    console.log('📤 Sending test data:', testData);
    
    const response = await axios.post('http://localhost:5000/api/personnel/agency-managers', testData);
    
    console.log('✅ Success response:', response.data);
    
  } catch (error) {
    console.error('❌ Error response:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
  }
}

testAgencyManagerCreation(); 