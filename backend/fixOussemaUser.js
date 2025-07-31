const db = require('./config/database');
const bcrypt = require('bcryptjs');

async function fixOussemaUser() {
  try {
    console.log('🔧 Fixing oussema user account...\n');

    // Check current state
    console.log('📋 Current state:');
    const accountantResult = await db.query(`
      SELECT id, name, email, phone, governorate, address, title, agency, password
      FROM accountants 
      WHERE email = 'oussema@gmaiil.com'
    `);
    
    if (accountantResult.rows.length === 0) {
      console.log('❌ Accountant oussema not found in accountants table');
      return;
    }
    
    const accountant = accountantResult.rows[0];
    console.log('Accountant found:', {
      id: accountant.id,
      name: accountant.name,
      email: accountant.email,
      hasPassword: !!accountant.password
    });

    // Check if user account exists
    const userResult = await db.query(`
      SELECT id, username, email, password_hash
      FROM users 
      WHERE email = 'oussema@gmaiil.com'
    `);
    
    if (userResult.rows.length > 0) {
      console.log('✅ User account already exists for oussema');
      const user = userResult.rows[0];
      console.log('User account:', {
        id: user.id,
        username: user.username,
        email: user.email,
        hasPassword: !!user.password_hash
      });
    } else {
      console.log('❌ No user account found for oussema');
    }

    // Start transaction to fix the user
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      
      // Set default password
      const defaultPassword = 'wael123';
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
      
      console.log('🔐 Setting default password:', defaultPassword);
      
      // Update accountant password
      await client.query(`
        UPDATE accountants 
        SET password = $1, updated_at = CURRENT_TIMESTAMP
        WHERE email = $2
      `, [hashedPassword, 'oussema@gmaiil.com']);
      
      console.log('✅ Updated accountant password');
      
      // Create user account if it doesn't exist
      if (userResult.rows.length === 0) {
        console.log('👤 Creating user account...');
        
        const username = 'oussema';
        const firstName = 'Oussema';
        const lastName = '';
        
        const userInsertResult = await client.query(`
          INSERT INTO users (username, email, password_hash, first_name, last_name, phone, is_active, email_verified)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING id
        `, [username, 'oussema@gmaiil.com', hashedPassword, firstName, lastName, accountant.phone, true, true]);
        
        const userId = userInsertResult.rows[0].id;
        console.log('✅ Created user account with ID:', userId);
        
        // Get Comptable role ID
        const roleResult = await client.query('SELECT id FROM roles WHERE name = $1', ['Comptable']);
        if (roleResult.rows.length === 0) {
          throw new Error('Comptable role not found');
        }
        
        const roleId = roleResult.rows[0].id;
        
        // Assign Comptable role to user
        await client.query(`
          INSERT INTO user_roles (user_id, role_id, assigned_by)
          VALUES ($1, $2, $3)
        `, [userId, roleId, userId]);
        
        console.log('✅ Assigned Comptable role to user');
      } else {
        // Update existing user password
        console.log('🔐 Updating existing user password...');
        await client.query(`
          UPDATE users 
          SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
          WHERE email = $2
        `, [hashedPassword, 'oussema@gmaiil.com']);
        
        console.log('✅ Updated user password');
      }
      
      await client.query('COMMIT');
      console.log('✅ Transaction committed successfully');
      
      // Verify the fix
      console.log('\n🔍 Verifying the fix...');
      const verifyAccountant = await db.query(`
        SELECT id, name, email, 
               CASE WHEN password IS NOT NULL THEN 'Has password' ELSE 'No password' END as password_status
        FROM accountants 
        WHERE email = 'oussema@gmaiil.com'
      `);
      
      const verifyUser = await db.query(`
        SELECT u.id, u.username, u.email, u.first_name, u.last_name,
               CASE WHEN u.password_hash IS NOT NULL THEN 'Has password' ELSE 'No password' END as password_status,
               r.name as role
        FROM users u
        JOIN user_roles ur ON u.id = ur.user_id
        JOIN roles r ON ur.role_id = r.id
        WHERE u.email = 'oussema@gmaiil.com'
      `);
      
      console.log('Accountant:', verifyAccountant.rows[0]);
      console.log('User:', verifyUser.rows[0]);
      
      console.log('\n🎉 oussema user account fixed successfully!');
      console.log('📧 Email: oussema@gmaiil.com');
      console.log('🔑 Password: wael123');
      console.log('👤 Username: oussema');
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Error during fix:', error);
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('❌ Error fixing oussema user:', error);
  } finally {
    process.exit(0);
  }
}

fixOussemaUser(); 