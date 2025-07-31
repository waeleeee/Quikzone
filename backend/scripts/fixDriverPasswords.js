const db = require('../config/database');
const bcrypt = require('bcryptjs');

const fixDriverPasswords = async () => {
  try {
    console.log('🔧 Fixing driver password synchronization...');
    
    // Get all drivers with passwords
    const driversResult = await db.query(`
      SELECT id, name, email, password
      FROM drivers 
      WHERE password IS NOT NULL
    `);
    
    console.log(`📊 Found ${driversResult.rows.length} drivers with passwords`);
    
    for (const driver of driversResult.rows) {
      console.log(`\n🔍 Processing driver: ${driver.name} (${driver.email})`);
      
      // Check if user exists
      const userResult = await db.query(`
        SELECT id, username, email, password_hash, first_name, last_name, is_active
        FROM users 
        WHERE email = $1
      `, [driver.email]);
      
      if (userResult.rows.length === 0) {
        console.log('  ❌ No user account found - creating one...');
        
        // Create user account
        const client = await db.pool.connect();
        try {
          await client.query('BEGIN');
          
          // Generate unique username
          let username = driver.email.split('@')[0];
          let counter = 1;
          let uniqueUsername = username;
          while (true) {
            const existing = await client.query('SELECT id FROM users WHERE username = $1', [uniqueUsername]);
            if (existing.rows.length === 0) break;
            uniqueUsername = username + counter;
            counter++;
          }
          
          const firstName = driver.name.split(' ')[0] || driver.name;
          const lastName = driver.name.split(' ').slice(1).join(' ') || firstName;
          
          // Create user
          const userResult = await client.query(`
            INSERT INTO users (username, email, password_hash, first_name, last_name, is_active)
            VALUES ($1, $2, $3, $4, $5, true)
            RETURNING id
          `, [uniqueUsername, driver.email, driver.password, firstName, lastName]);
          
          // Assign "Livreurs" role
          const roleResult = await client.query('SELECT id FROM roles WHERE name = $1', ['Livreurs']);
          if (roleResult.rows.length > 0) {
            await client.query(`
              INSERT INTO user_roles (user_id, role_id)
              VALUES ($1, $2)
            `, [userResult.rows[0].id, roleResult.rows[0].id]);
          }
          
          await client.query('COMMIT');
          console.log('  ✅ User account created successfully');
          
        } catch (error) {
          await client.query('ROLLBACK');
          console.error('  ❌ Error creating user account:', error.message);
        } finally {
          client.release();
        }
        
      } else {
        const user = userResult.rows[0];
        console.log('  ✅ User account found');
        
        // Check if password hashes match
        const passwordsMatch = await bcrypt.compare(driver.password, user.password_hash);
        
        if (!passwordsMatch) {
          console.log('  ⚠️  Password hashes do not match - updating user password...');
          
          // Update user password to match driver password
          await db.query(`
            UPDATE users 
            SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
            WHERE email = $2
          `, [driver.password, driver.email]);
          
          console.log('  ✅ User password updated to match driver password');
        } else {
          console.log('  ✅ Password hashes match - no action needed');
        }
        
        // Ensure user is active
        if (!user.is_active) {
          console.log('  ⚠️  User is inactive - activating...');
          await db.query('UPDATE users SET is_active = true WHERE email = $1', [driver.email]);
          console.log('  ✅ User activated');
        }
        
        // Check if user has "Livreurs" role
        const roleResult = await db.query(`
          SELECT r.name as role_name
          FROM user_roles ur
          JOIN roles r ON ur.role_id = r.id
          WHERE ur.user_id = $1 AND ur.is_active = true
        `, [user.id]);
        
        const hasLivreursRole = roleResult.rows.some(role => role.role_name === 'Livreurs');
        
        if (!hasLivreursRole) {
          console.log('  ⚠️  User missing "Livreurs" role - assigning...');
          
          const livreursRoleResult = await db.query('SELECT id FROM roles WHERE name = $1', ['Livreurs']);
          if (livreursRoleResult.rows.length > 0) {
            await db.query(`
              INSERT INTO user_roles (user_id, role_id)
              VALUES ($1, $2)
            `, [user.id, livreursRoleResult.rows[0].id]);
            console.log('  ✅ "Livreurs" role assigned');
          }
        } else {
          console.log('  ✅ User has "Livreurs" role');
        }
      }
    }
    
    console.log('\n✅ Driver password synchronization completed!');
    
  } catch (error) {
    console.error('❌ Error fixing driver passwords:', error);
    throw error;
  }
};

// Run the fix
fixDriverPasswords()
  .then(() => {
    console.log('✅ Fix completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fix failed:', error);
    process.exit(1);
  }); 