const axios = require('axios');

const testFrontendAPIAccess = async () => {
  try {
    console.log('🧪 Testing frontend API access...\n');
    
    // Test the exact endpoint the frontend is calling
    const response = await axios.get('http://localhost:5001/api/warehouses/available-managers');
    
    console.log('✅ Frontend API Access Test:');
    console.log('Status:', response.status);
    console.log('Success:', response.data.success);
    console.log('Data length:', response.data.data ? response.data.data.length : 'No data');
    
    if (response.data.success && response.data.data) {
      console.log('\n📋 Available Chef d\'agence Users:');
      console.log('-' .repeat(80));
      
      // Only show Chef d'agence users
      const chefAgenceUsers = response.data.data.filter(user => user.role === 'Chef d\'agence');
      
      chefAgenceUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} - ${user.email}`);
      });
      
      console.log(`\n✅ Total Chef d'agence users available: ${chefAgenceUsers.length}`);
      
      if (chefAgenceUsers.length === 0) {
        console.log('\n⚠️ WARNING: No Chef d\'agence users available!');
        console.log('This explains why the frontend shows the error message.');
      } else {
        console.log('\n✅ SUCCESS: Chef d\'agence users are available!');
        console.log('The frontend should now show these users in the dropdown.');
      }
    } else {
      console.log('❌ API returned error:', response.data.message);
    }
    
  } catch (error) {
    console.error('❌ Error testing frontend API access:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  } finally {
    process.exit(0);
  }
};

testFrontendAPIAccess(); 