const axios = require('axios');

const testChartData = async () => {
  try {
    console.log('🧪 Testing expediteur chart data endpoint...\n');
    
    const email = 'ritejchaieb@icloud.com';
    const url = `http://localhost:5000/api/parcels/expediteur/${encodeURIComponent(email)}/chart-data`;
    
    console.log('📡 Testing URL:', url);
    console.log('📧 Email:', email);
    
    const response = await axios.get(url);
    
    console.log('✅ Chart data API endpoint working');
    console.log('📊 Response status:', response.status);
    console.log('📊 Response data:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success && response.data.data) {
      const { deliveryHistory, geographicalData } = response.data.data;
      console.log('\n📈 Delivery History:', deliveryHistory);
      console.log('🌍 Geographical Data:', geographicalData);
      
      if (deliveryHistory.length > 0) {
        console.log('✅ Delivery history data available');
      } else {
        console.log('⚠️ No delivery history data');
      }
      
      if (geographicalData.length > 0) {
        console.log('✅ Geographical data available');
      } else {
        console.log('⚠️ No geographical data');
      }
    } else {
      console.log('❌ Unexpected response format');
    }
    
  } catch (error) {
    console.error('❌ Chart data API endpoint failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
};

testChartData(); 