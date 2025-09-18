const axios = require('axios');

const debugFrontendIssue = async () => {
  try {
    console.log('🔍 Debugging frontend issue...\n');

    // Test 1: Check the warehouses/available-managers endpoint (what frontend should call)
    console.log('📋 Test 1: warehouses/available-managers endpoint');
    console.log('-' .repeat(50));
    
    try {
      const response1 = await axios.get('http://localhost:5001/api/warehouses/available-managers');
      console.log('✅ Status:', response1.status);
      console.log('✅ Success:', response1.data.success);
      console.log('✅ Data length:', response1.data.data ? response1.data.data.length : 'No data');
      
      if (response1.data.success && response1.data.data) {
        console.log('✅ Available managers found:', response1.data.data.length);
        response1.data.data.forEach((user, index) => {
          console.log(`  ${index + 1}. ${user.name} (${user.role}) - ${user.email}`);
        });
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
    }

    console.log('\n📋 Test 2: personnel/agency-managers endpoint (old endpoint)');
    console.log('-' .repeat(50));
    
    try {
      const response2 = await axios.get('http://localhost:5001/api/personnel/agency-managers');
      console.log('✅ Status:', response2.status);
      console.log('✅ Success:', response2.data.success);
      console.log('✅ Data length:', response2.data.data ? response2.data.data.length : 'No data');
      
      if (response2.data.success && response2.data.data) {
        console.log('✅ Agency managers found:', response2.data.data.length);
        response2.data.data.forEach((user, index) => {
          console.log(`  ${index + 1}. ${user.name} (${user.role}) - ${user.email}`);
        });
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
    }

    console.log('\n📋 Test 3: Check if there are any Chef d\'agence users in the database');
    console.log('-' .repeat(50));
    
    // This would require direct database access, but let's check the API responses
    console.log('✅ Both endpoints should return Chef d\'agence users');
    console.log('✅ If both return data, the frontend should work');
    console.log('✅ If frontend still shows error, it might be a caching issue');

  } catch (error) {
    console.error('❌ Debug error:', error);
  } finally {
    process.exit(0);
  }
};

debugFrontendIssue(); 