const db = require('./config/database');

async function checkUserRole() {
  try {
    const result = await db.query(`
      SELECT 
        id, 
        username, 
        email, 
        first_name, 
        last_name, 
        role, 
        agency, 
        governorate,
        is_active
      FROM users 
      WHERE email = $1
    `, ['livreur@test.tn']);

    if (result.rows.length === 0) {
      console.log('❌ User not found in users table');
      
      // Check if user exists in drivers table
      const driverResult = await db.query(`
        SELECT 
          id, 
          first_name, 
          last_name, 
          email, 
          phone,
          status
        FROM drivers 
        WHERE email = $1
      `, ['livreur@test.tn']);

      if (driverResult.rows.length > 0) {
        console.log('✅ User found in drivers table:');
        console.log(driverResult.rows[0]);
      } else {
        console.log('❌ User not found in drivers table either');
      }
    } else {
      console.log('✅ User found in users table:');
      console.log('📋 User Details:');
      console.log('   ID:', result.rows[0].id);
      console.log('   Username:', result.rows[0].username);
      console.log('   Email:', result.rows[0].email);
      console.log('   Name:', `${result.rows[0].first_name} ${result.rows[0].last_name}`);
      console.log('   Role:', result.rows[0].role);
      console.log('   Agency:', result.rows[0].agency);
      console.log('   Governorate:', result.rows[0].governorate);
      console.log('   Active:', result.rows[0].is_active);
    }
    
    db.pool.end();
  } catch (error) {
    console.error('Error:', error);
    db.pool.end();
  }
}

checkUserRole(); 