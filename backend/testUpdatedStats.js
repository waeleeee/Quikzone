const axios = require('axios');

const testUpdatedStats = async () => {
  try {
    console.log('🧪 Testing updated expediteur stats with all statuses...\n');
    
    // Test with Ritej Chaieb's email
    const email = 'ritejchaieb@icloud.com';
    const url = `http://localhost:5000/api/parcels/expediteur/${encodeURIComponent(email)}/stats`;
    
    console.log('📡 Testing URL:', url);
    console.log('📧 Email:', email);
    
    const response = await axios.get(url);
    
    console.log('✅ Updated expediteur stats API endpoint working');
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
      
      console.log('\n📊 Status Stats (all statuses):');
      if (stats.statusStats) {
        Object.entries(stats.statusStats).forEach(([status, count]) => {
          console.log(`  ${status}: ${count}`);
        });
        
        // Calculate total from statusStats
        const totalFromStatus = Object.values(stats.statusStats).reduce((sum, count) => sum + count, 0);
        console.log(`\n📦 Total from statusStats: ${totalFromStatus}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Updated expediteur stats API endpoint failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
};

testUpdatedStats(); 