const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './config.env' });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'quickzone_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'waelrh',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: false
});

const testAdminPasswordUpdate = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🧪 Testing admin password update functionality...');
    
    // Get a commercial to test with
    const commercialResult = await client.query(`
      SELECT id, name, email, password as commercial_password
      FROM commercials 
      WHERE email = 'W@gmail.com'
    `);
    
    if (commercialResult.rows.length === 0) {
      console.log('❌ No commercial found for testing');
      return;
    }
    
    const commercial = commercialResult.rows[0];
    console.log(`📋 Testing with commercial: ${commercial.name} (${commercial.email})`);
    
    // Simulate the admin updating the password
    const newPassword = 'newpassword123';
    console.log(`🔐 Admin is setting new password: ${newPassword}`);
    
    // Start transaction (like the backend does)
    await client.query('BEGIN');
    
    try {
      // Update commercial password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      const commercialUpdateResult = await client.query(`
        UPDATE commercials 
        SET password = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING id, name, email
      `, [hashedPassword, commercial.id]);
      
      console.log('✅ Commercial password updated');
      
      // Update user account password
      const userUpdateResult = await client.query(`
        UPDATE users 
        SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
        WHERE email = $2
        RETURNING id, email
      `, [hashedPassword, commercial.email]);
      
      if (userUpdateResult.rows.length > 0) {
        console.log('✅ User account password updated');
      } else {
        console.log('⚠️ No user account found - creating one...');
        
        // Create user account if it doesn't exist
        const username = commercial.email.split('@')[0];
        const firstName = commercial.name.split(' ')[0] || commercial.name;
        const lastName = commercial.name.split(' ').slice(1).join(' ') || '';
        
        const newUserResult = await client.query(`
          INSERT INTO users (username, email, password_hash, first_name, last_name, is_active, email_verified)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id
        `, [username, commercial.email, hashedPassword, firstName, lastName, true, true]);
        
        // Get Commercial role ID
        const roleResult = await client.query('SELECT id FROM roles WHERE name = $1', ['Commercial']);
        if (roleResult.rows.length > 0) {
          await client.query(`
            INSERT INTO user_roles (user_id, role_id, assigned_by)
            VALUES ($1, $2, $3)
          `, [newUserResult.rows[0].id, roleResult.rows[0].id, newUserResult.rows[0].id]);
          console.log('✅ User account created with Commercial role');
        }
      }
      
      await client.query('COMMIT');
      console.log('✅ Transaction committed successfully');
      
      // Test the login
      console.log('\n🔍 Testing login with new password...');
      const testLoginResult = await client.query(`
        SELECT u.id, u.email, u.password_hash, c.password as commercial_password
        FROM users u
        LEFT JOIN commercials c ON u.email = c.email
        WHERE u.email = $1
      `, [commercial.email]);
      
      if (testLoginResult.rows.length > 0) {
        const user = testLoginResult.rows[0];
        const passwordMatches = await bcrypt.compare(newPassword, user.password_hash);
        
        if (passwordMatches) {
          console.log('✅ Login test successful! User can log in with new password');
          console.log(`📝 Login credentials: ${commercial.email} / ${newPassword}`);
        } else {
          console.log('❌ Login test failed - password hash mismatch');
        }
      } else {
        console.log('❌ No user account found for login test');
      }
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Error testing admin password update:', error);
  } finally {
    client.release();
    pool.end();
  }
};

testAdminPasswordUpdate()
  .then(() => {
    console.log('✅ Admin password update test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Admin password update test failed:', error);
    process.exit(1);
  }); 