const axios = require('axios');

const testRitejStats = async () => {
  try {
    console.log('🧪 Testing expediteur stats for Ritej Chaieb...\n');
    
    // Test with Ritej Chaieb's email
    const email = 'ritejchaieb@icloud.com';
    const url = `http://localhost:5000/api/parcels/expediteur/${encodeURIComponent(email)}/stats`;
    
    console.log('📡 Testing URL:', url);
    console.log('📧 Email:', email);
    
    const response = await axios.get(url);
    
    console.log('✅ Expediteur stats API endpoint working');
    console.log('📊 Response data:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.success && response.data.data) {
      const stats = response.data.data;
      console.log('\n📈 Stats Summary:');
      console.log('  Total Parcels:', stats.totalParcels);
      console.log('  Total Revenue:', stats.totalRevenue);
      console.log('  Current Month:', stats.currentMonth);
      console.log('  Delivered This Month:', stats.deliveredThisMonth);
      console.log('  In Transit:', stats.inTransit);
      console.log('  Monthly Changes:', stats.monthlyChanges);
      console.log('  Status Stats:', stats.statusStats);
    }
    
  } catch (error) {
    console.error('❌ Expediteur stats API endpoint failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
};

testRitejStats(); 