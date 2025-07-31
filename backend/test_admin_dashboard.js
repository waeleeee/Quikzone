const axios = require('axios');

const testAdminDashboard = async () => {
  try {
    console.log('🧪 Testing admin dashboard endpoint...\n');
    
    const url = 'http://localhost:5000/api/dashboard/admin';
    console.log('📡 Making request to:', url);
    
    const response = await axios.get(url);
    
    console.log('✅ Admin dashboard API endpoint working');
    console.log('📊 Response status:', response.status);
    console.log('📊 Response data:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success && response.data.data) {
      const data = response.data.data;
      console.log('\n📈 Key Metrics:');
      console.log('- Total Users:', data.keyMetrics?.totalUsers);
      console.log('- Total Colis:', data.keyMetrics?.totalColis);
      console.log('- Livraisons Complétées:', data.keyMetrics?.livraisonsCompletees);
      console.log('- Total Shippers:', data.keyMetrics?.totalShippers);
      console.log('- Monthly Revenue:', data.keyMetrics?.monthlyRevenue);
      console.log('- User Growth:', data.keyMetrics?.userGrowth + '%');
      console.log('- Parcel Growth:', data.keyMetrics?.parcelGrowth + '%');
      console.log('- Shipper Growth:', data.keyMetrics?.shipperGrowth + '%');
      console.log('- Delivery Growth:', data.keyMetrics?.deliveryGrowth + '%');
      console.log('- Revenue Growth:', data.keyMetrics?.revenueGrowth + '%');
      
      console.log('\n📊 Chart Data:');
      console.log('- Delivery History entries:', data.deliveryHistory?.length || 0);
      console.log('- Geographical Data entries:', data.geographicalData?.length || 0);
      console.log('- Status Stats entries:', Object.keys(data.statusStats || {}).length);
      
      console.log('\n🎯 Top Drivers:');
      data.topLivreurs?.forEach(driver => {
        console.log(`- ${driver.name}: ${driver.livraisons} livraisons`);
      });
      
      console.log('\n📝 Recent Activities:');
      data.recentActivities?.forEach(activity => {
        console.log(`- ${activity.message} (${activity.time})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Admin dashboard API endpoint failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
};

testAdminDashboard(); 