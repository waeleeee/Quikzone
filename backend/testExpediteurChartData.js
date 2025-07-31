const axios = require('axios');

const testExpediteurChartData = async () => {
  try {
    console.log('🧪 Testing expediteur chart data API endpoint...\n');
    
    // Test with Ritej Chaieb's email
    const email = 'ritejchaieb@icloud.com';
    const url = `http://localhost:5000/api/parcels/expediteur/${encodeURIComponent(email)}/delivery-history`;
    
    console.log('📡 Testing URL:', url);
    console.log('📧 Email:', email);
    
    const response = await axios.get(url);
    
    console.log('✅ Expediteur chart data API endpoint working');
    console.log('📊 Response data:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.success && response.data.data) {
      const chartData = response.data.data;
      console.log('\n📈 Chart Data Summary:');
      console.log('  Delivery History:', chartData.deliveryHistory?.length || 0, 'days');
      console.log('  Geographical Data:', chartData.geographicalData?.length || 0, 'regions');
      
      if (chartData.deliveryHistory?.length > 0) {
        console.log('\n📅 Delivery History:');
        chartData.deliveryHistory.forEach(item => {
          console.log(`  ${item.date}: ${item.delivered} delivered out of ${item.total} total`);
        });
      }
      
      if (chartData.geographicalData?.length > 0) {
        console.log('\n🌍 Geographical Distribution:');
        chartData.geographicalData.forEach(item => {
          console.log(`  ${item.region}: ${item.count} parcels`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Expediteur chart data API endpoint failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
};

testExpediteurChartData(); 