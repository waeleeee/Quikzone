const db = require('../config/database');

const checkAllDrivers = async () => {
  try {
    console.log('🔍 Checking all drivers and their user accounts...\n');
    
    // Get all drivers
    const driversResult = await db.query(`
      SELECT id, name, email, 
             CASE WHEN password IS NOT NULL THEN true ELSE false END as has_password
      FROM drivers 
      ORDER BY name
    `);
    
    console.log(`📊 Found ${driversResult.rows.length} drivers total\n`);
    
    for (const driver of driversResult.rows) {
      console.log(`🚗 ${driver.name} (${driver.email})`);
      console.log(`   - Driver ID: ${driver.id}`);
      console.log(`   - Has password in drivers table: ${driver.has_password ? '✅' : '❌'}`);
      
      // Check user account
      const userResult = await db.query(`
        SELECT u.id, u.username, u.first_name, u.last_name, u.is_active,
               CASE WHEN u.password_hash IS NOT NULL THEN true ELSE false END as has_password_hash
        FROM users u
        WHERE u.email = $1
      `, [driver.email]);
      
      if (userResult.rows.length === 0) {
        console.log(`   - User account: ❌ NOT FOUND`);
      } else {
        const user = userResult.rows[0];
        console.log(`   - User account: ✅ FOUND (ID: ${user.id})`);
        console.log(`   - Username: ${user.username}`);
        console.log(`   - Name: ${user.first_name} ${user.last_name}`);
        console.log(`   - Is active: ${user.is_active ? '✅' : '❌'}`);
        console.log(`   - Has password_hash: ${user.has_password_hash ? '✅' : '❌'}`);
        
        // Check roles
        const roleResult = await db.query(`
          SELECT r.name as role_name
          FROM user_roles ur
          JOIN roles r ON ur.role_id = r.id
          WHERE ur.user_id = $1 AND ur.is_active = true
        `, [user.id]);
        
        if (roleResult.rows.length === 0) {
          console.log(`   - Roles: ❌ NO ROLES ASSIGNED`);
        } else {
          const roles = roleResult.rows.map(r => r.role_name);
          console.log(`   - Roles: ${roles.join(', ')}`);
        }
      }
      
      console.log(''); // Empty line for readability
    }
    
    // Summary
    console.log('📋 SUMMARY:');
    const driversWithPasswords = driversResult.rows.filter(d => d.has_password).length;
    const driversWithUsers = driversResult.rows.filter(async (d) => {
      const userResult = await db.query('SELECT id FROM users WHERE email = $1', [d.email]);
      return userResult.rows.length > 0;
    }).length;
    
    console.log(`   - Drivers with passwords: ${driversWithPasswords}/${driversResult.rows.length}`);
    console.log(`   - Drivers with user accounts: ${driversWithUsers}/${driversResult.rows.length}`);
    
  } catch (error) {
    console.error('❌ Error checking drivers:', error);
    throw error;
  }
};

// Run the check
checkAllDrivers()
  .then(() => {
    console.log('✅ Check completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Check failed:', error);
    process.exit(1);
  }); 