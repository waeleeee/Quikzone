const axios = require('axios');

const testBackendAPI = async () => {
  try {
    console.log('🧪 Testing backend API...');
    
    // Test the accountants endpoint
    const response = await axios.get('http://localhost:5000/api/personnel/accountants');
    
    console.log('📊 Response status:', response.status);
    console.log('📋 Response data structure:', {
      success: response.data.success,
      dataLength: response.data.data?.length || 0,
      hasPagination: !!response.data.pagination
    });
    
    if (response.data.data && response.data.data.length > 0) {
      console.log('📋 First accountant:', response.data.data[0]);
      console.log('🔐 Has password field:', 'has_password' in response.data.data[0]);
    }
    
  } catch (error) {
    console.error('❌ Error testing backend API:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
};

testBackendAPI(); 