const db = require('../config/database');
const bcrypt = require('bcryptjs');

async function fixShipperPasswords() {
  try {
    console.log('🔧 Fixing shipper passwords and user accounts...');
    
    // Get all shippers with passwords
    const shippersResult = await db.query(`
      SELECT id, name, email, password
      FROM shippers
      WHERE password IS NOT NULL AND password != ''
      ORDER BY name
    `);
    
    console.log(`📊 Found ${shippersResult.rows.length} shippers with passwords`);
    
    let createdUsers = 0;
    let updatedUsers = 0;
    let errors = 0;
    
    for (const shipper of shippersResult.rows) {
      try {
        console.log(`\n🔍 Processing shipper: ${shipper.name} (${shipper.email})`);
        
        // Check if user exists
        const existingUser = await db.query('SELECT id, password_hash FROM users WHERE email = $1', [shipper.email]);
        
        if (existingUser.rows.length > 0) {
          // User exists, check if password matches
          const user = existingUser.rows[0];
          
          if (user.password_hash !== shipper.password) {
            console.log(`  🔄 Updating password for existing user...`);
            await db.query('UPDATE users SET password_hash = $1 WHERE email = $2', [shipper.password, shipper.email]);
            updatedUsers++;
            console.log(`  ✅ Password updated`);
          } else {
            console.log(`  ✅ Password already synchronized`);
          }
        } else {
          // User doesn't exist, create new user
          console.log(`  ➕ Creating new user account...`);
          
          // Generate unique username
          let username = shipper.email.split('@')[0];
          let counter = 1;
          let uniqueUsername = username;
          while (true) {
            const existing = await db.query('SELECT id FROM users WHERE username = $1', [uniqueUsername]);
            if (existing.rows.length === 0) break;
            uniqueUsername = username + counter;
            counter++;
          }
          
          const firstName = shipper.name.split(' ')[0] || shipper.name;
          const lastName = shipper.name.split(' ').slice(1).join(' ') || firstName;
          
          // Create user
          const userResult = await db.query(`
            INSERT INTO users (username, email, password_hash, first_name, last_name, is_active)
            VALUES ($1, $2, $3, $4, $5, true)
            RETURNING id
          `, [uniqueUsername, shipper.email, shipper.password, firstName, lastName]);
          
          // Assign "Expéditeur" role
          const roleResult = await db.query('SELECT id FROM roles WHERE name = $1', ['Expéditeur']);
          if (roleResult.rows.length > 0) {
            await db.query(`
              INSERT INTO user_roles (user_id, role_id)
              VALUES ($1, $2)
            `, [userResult.rows[0].id, roleResult.rows[0].id]);
            console.log(`  ✅ Role assigned`);
          } else {
            console.log(`  ⚠️ Expéditeur role not found`);
          }
          
          createdUsers++;
          console.log(`  ✅ User account created`);
        }
        
      } catch (error) {
        console.error(`  ❌ Error processing shipper ${shipper.name}:`, error.message);
        errors++;
      }
    }
    
    console.log(`\n📈 Summary:`);
    console.log(`   - Shippers processed: ${shippersResult.rows.length}`);
    console.log(`   - User accounts created: ${createdUsers}`);
    console.log(`   - User accounts updated: ${updatedUsers}`);
    console.log(`   - Errors: ${errors}`);
    
    // Check final status
    const finalCheck = await db.query(`
      SELECT 
        COUNT(*) as total_shippers,
        COUNT(CASE WHEN password IS NOT NULL AND password != '' THEN 1 END) as shippers_with_passwords,
        COUNT(CASE WHEN u.id IS NOT NULL THEN 1 END) as shippers_with_users
      FROM shippers s
      LEFT JOIN users u ON s.email = u.email
    `);
    
    const stats = finalCheck.rows[0];
    console.log(`\n📊 Final Status:`);
    console.log(`   - Total shippers: ${stats.total_shippers}`);
    console.log(`   - Shippers with passwords: ${stats.shippers_with_passwords}`);
    console.log(`   - Shippers with user accounts: ${stats.shippers_with_users}`);
    
    if (stats.shippers_with_passwords === stats.shippers_with_users) {
      console.log(`\n✅ All shippers with passwords now have user accounts!`);
    } else {
      console.log(`\n⚠️ Some shippers still need user accounts`);
    }
    
  } catch (error) {
    console.error('❌ Error fixing shipper passwords:', error);
  } finally {
    process.exit(0);
  }
}

fixShipperPasswords(); 