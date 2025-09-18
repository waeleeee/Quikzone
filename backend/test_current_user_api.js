const db = require('./config/database');
const jwt = require('jsonwebtoken');

const testCurrentUserAPI = async () => {
  try {
    console.log('🔍 Testing /auth/me endpoint...\n');

    const userEmail = 'saadaouiossama@gmail.com';
    
    // Get user ID first
    const userResult = await db.query(`
      SELECT id FROM users WHERE email = $1
    `, [userEmail]);
    
    if (userResult.rows.length === 0) {
      console.log('❌ User not found');
      return;
    }
    
    const userId = userResult.rows[0].id;
    console.log('✅ User ID:', userId);
    
    // Create a test token
    const token = jwt.sign({ userId }, process.env.JWT_SECRET);
    console.log('✅ Test token created');
    
    // Test the query that the endpoint uses
    const queryResult = await db.query(`
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        u.is_active,
        r.name as role,
        am.agency,
        am.governorate,
        am.address as user_address
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      LEFT JOIN agency_managers am ON u.email = am.email
      WHERE u.id = $1
    `, [userId]);
    
    if (queryResult.rows.length > 0) {
      const user = queryResult.rows[0];
      console.log('✅ Query result:', user);
      console.log('📍 User governorate:', user.governorate);
      console.log('🏢 User agency:', user.agency);
    } else {
      console.log('❌ No user data found');
    }
    
    // Test the API endpoint using curl
    console.log('\n📋 Testing API endpoint...');
    console.log('-' .repeat(50));
    
    const { exec } = require('child_process');
    const curlCommand = `curl -X GET "http://localhost:5000/api/auth/me" -H "Authorization: Bearer ${token}" -H "Content-Type: application/json"`;
    
    exec(curlCommand, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Curl error:', error);
        return;
      }
      
      if (stderr) {
        console.error('❌ Curl stderr:', stderr);
      }
      
      console.log('✅ API Response:');
      console.log(stdout);
      
      try {
        const response = JSON.parse(stdout);
        if (response.success && response.data) {
          console.log('✅ API endpoint working correctly');
          console.log('📍 User governorate from API:', response.data.governorate);
          console.log('🏢 User agency from API:', response.data.agency);
        } else {
          console.log('❌ API response format incorrect');
        }
      } catch (parseError) {
        console.error('❌ Error parsing API response:', parseError);
      }
    });

  } catch (error) {
    console.error('❌ Error testing current user API:', error);
  }
};

testCurrentUserAPI(); 