const axios = require('axios');
const db = require('./config/database');

async function debugLivreurMissions() {
  try {
    console.log('🔍 Testing livreur missions API...');
    
    // Test the API endpoint that the livreur dashboard calls
    const response = await axios.get('http://localhost:5000/api/missions-pickup?driver_email=adouma@gmail.com');
    
    console.log('📡 API Response status:', response.status);
    console.log('📡 API Response data:', JSON.stringify(response.data, null, 2));
    
    // Check if the response has the expected structure
    if (response.data && response.data.success) {
      console.log('✅ API returned success');
      console.log('📦 Number of missions:', response.data.data?.length || 0);
      
      if (response.data.data && response.data.data.length > 0) {
        console.log('📋 First mission:', response.data.data[0]);
        
        // Debug the raw mission data from database
        const rawMission = await db.query('SELECT * FROM pickup_missions WHERE id = $1', [response.data.data[0].id]);
        console.log('🔍 Raw mission from DB:', rawMission.rows[0]);
        
        // Test driver lookup directly
        if (rawMission.rows[0]) {
          const driverLookup = await db.query('SELECT id, name, email FROM drivers WHERE id = $1', [rawMission.rows[0].driver_id]);
          console.log('🚚 Driver lookup result:', driverLookup.rows[0]);
        }
      }
    } else {
      console.log('❌ API did not return success structure');
      console.log('📡 Raw response:', response.data);
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error.response?.data || error.message);
  } finally {
    process.exit(0);
  }
}

debugLivreurMissions(); 