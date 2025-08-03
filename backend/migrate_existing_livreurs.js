const { pool } = require('./config/database');
const bcrypt = require('bcrypt');

async function migrateExistingLivreurs() {
  try {
    console.log('🔄 Starting migration of existing livreurs...');
    
    // Get all drivers that don't have corresponding user accounts
    const driversWithoutUsers = await pool.query(`
      SELECT d.* 
      FROM drivers d
      LEFT JOIN users u ON d.email = u.email
      WHERE u.id IS NULL
    `);
    
    console.log(`📦 Found ${driversWithoutUsers.rows.length} drivers without user accounts`);
    
    if (driversWithoutUsers.rows.length === 0) {
      console.log('✅ All drivers already have user accounts');
      return;
    }
    
    // Get the Livreurs role ID
    const roleResult = await pool.query('SELECT id FROM roles WHERE name = $1', ['Livreurs']);
    if (roleResult.rows.length === 0) {
      console.error('❌ Livreurs role not found!');
      return;
    }
    const livreurRoleId = roleResult.rows[0].id;
    console.log('🎭 Livreurs role ID:', livreurRoleId);
    
    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      let successCount = 0;
      let errorCount = 0;
      
      for (const driver of driversWithoutUsers.rows) {
        try {
          console.log(`\n🔄 Processing driver: ${driver.name} (${driver.email})`);
          
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
          
          // Generate a default password (driver's email)
          const defaultPassword = driver.email;
          const hashedPassword = await bcrypt.hash(defaultPassword, 10);
          
          // Create user account
          const userResult = await client.query(`
            INSERT INTO users (username, email, password_hash, first_name, last_name, is_active)
            VALUES ($1, $2, $3, $4, $5, true)
            RETURNING id
          `, [uniqueUsername, driver.email, hashedPassword, firstName, lastName]);
          
          const userId = userResult.rows[0].id;
          console.log(`✅ User created with ID: ${userId}`);
          
          // Assign Livreurs role
          await client.query(`
            INSERT INTO user_roles (user_id, role_id)
            VALUES ($1, $2)
          `, [userId, livreurRoleId]);
          
          console.log(`✅ Role assigned to user ${userId}`);
          successCount++;
          
        } catch (error) {
          console.error(`❌ Error processing driver ${driver.name}:`, error.message);
          errorCount++;
        }
      }
      
      await client.query('COMMIT');
      console.log(`\n✅ Migration completed!`);
      console.log(`✅ Successfully migrated: ${successCount} drivers`);
      console.log(`❌ Errors: ${errorCount} drivers`);
      
      if (successCount > 0) {
        console.log('\n📝 Default passwords for migrated users:');
        console.log('   Each user can login with their email as password');
        console.log('   They should change their password after first login');
      }
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('❌ Migration error:', error);
  } finally {
    await pool.end();
  }
}

migrateExistingLivreurs(); 