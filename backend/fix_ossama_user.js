const { pool } = require('./config/database');

async function fixOssamaUser() {
  try {
    console.log('🔍 Looking for ossama Oussema user...');
    
    // Find the user by name or email
    const userResult = await pool.query(`
      SELECT u.id, u.email, u.username, u.first_name, u.last_name, r.name as role_name
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.first_name ILIKE '%ossama%' OR u.last_name ILIKE '%oussema%' OR u.email ILIKE '%ossama%'
    `);
    
    console.log('👤 Found users:', userResult.rows);
    
    if (userResult.rows.length === 0) {
      console.log('❌ No user found with name containing "ossama" or "oussema"');
      
      // Let's check all users to see what we have
      const allUsers = await pool.query(`
        SELECT u.id, u.email, u.username, u.first_name, u.last_name, r.name as role_name
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id
        ORDER BY u.first_name, u.last_name
      `);
      
      console.log('\n📋 All users in system:');
      allUsers.rows.forEach(user => {
        console.log(`  ${user.first_name} ${user.last_name} (${user.email}) -> Role: ${user.role_name || 'No role'}`);
      });
      
      return;
    }
    
    // Check if this user is also a driver
    for (const user of userResult.rows) {
      console.log(`\n🔍 Checking if user ${user.first_name} ${user.last_name} is also a driver...`);
      
      const driverResult = await pool.query(`
        SELECT id, name, email FROM drivers WHERE email = $1
      `, [user.email]);
      
      if (driverResult.rows.length > 0) {
        console.log(`✅ Found matching driver: ${driverResult.rows[0].name}`);
        
        // Check if user has Livreurs role
        if (user.role_name !== 'Livreurs') {
          console.log(`❌ User has role "${user.role_name}" instead of "Livreurs"`);
          
          // Get Livreurs role ID
          const roleResult = await pool.query('SELECT id FROM roles WHERE name = $1', ['Livreurs']);
          if (roleResult.rows.length === 0) {
            console.error('❌ Livreurs role not found!');
            return;
          }
          const livreurRoleId = roleResult.rows[0].id;
          
          // Start transaction to fix the role
          const client = await pool.connect();
          try {
            await client.query('BEGIN');
            
            // Remove existing role assignments
            await client.query('DELETE FROM user_roles WHERE user_id = $1', [user.id]);
            
            // Assign Livreurs role
            await client.query(`
              INSERT INTO user_roles (user_id, role_id)
              VALUES ($1, $2)
            `, [user.id, livreurRoleId]);
            
            await client.query('COMMIT');
            console.log(`✅ Successfully assigned Livreurs role to user ${user.id}`);
            
          } catch (error) {
            await client.query('ROLLBACK');
            console.error('❌ Error fixing role:', error);
          } finally {
            client.release();
          }
        } else {
          console.log(`✅ User already has correct role: ${user.role_name}`);
        }
      } else {
        console.log(`❌ No matching driver found for email: ${user.email}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

fixOssamaUser(); 