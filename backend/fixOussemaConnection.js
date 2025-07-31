const db = require('./config/database');
const bcrypt = require('bcryptjs');

async function fixOussemaConnection() {
  try {
    console.log('🔧 Fixing oussema user connection...\n');

    // Find the existing user with username 'oussema'
    console.log('🔍 Looking for existing user with username "oussema"...');
    const existingUser = await db.query(`
      SELECT id, username, email, first_name, last_name, password_hash, is_active
      FROM users 
      WHERE username = 'oussema'
    `);
    
    if (existingUser.rows.length === 0) {
      console.log('❌ No user found with username "oussema"');
      return;
    }
    
    const user = existingUser.rows[0];
    console.log('✅ Found existing user:', {
      id: user.id,
      username: user.username,
      email: user.email,
      name: `${user.first_name} ${user.last_name}`,
      hasPassword: !!user.password_hash,
      isActive: user.is_active
    });

    // Check if this user has any roles
    const userRoles = await db.query(`
      SELECT ur.user_id, ur.role_id, r.name as role_name
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = $1
    `, [user.id]);
    
    console.log('👤 Current user roles:');
    if (userRoles.rows.length > 0) {
      userRoles.rows.forEach(role => {
        console.log(`  - ${role.role_name}`);
      });
    } else {
      console.log('  - No roles assigned');
    }

    // Check the accountant record
    const accountant = await db.query(`
      SELECT id, name, email, phone, governorate, address, title, agency, password
      FROM accountants 
      WHERE email = 'oussema@gmaiil.com'
    `);
    
    if (accountant.rows.length === 0) {
      console.log('❌ No accountant found with email oussema@gmaiil.com');
      return;
    }
    
    const acc = accountant.rows[0];
    console.log('📋 Accountant record:', {
      id: acc.id,
      name: acc.name,
      email: acc.email,
      hasPassword: !!acc.password
    });

    // Start transaction to fix the connection
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      
      // Set default password
      const defaultPassword = 'wael123';
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
      
      console.log('🔐 Setting password:', defaultPassword);
      
      // Update user email to match accountant
      if (user.email !== 'oussema@gmaiil.com') {
        console.log('📧 Updating user email to match accountant...');
        await client.query(`
          UPDATE users 
          SET email = $1, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, ['oussema@gmaiil.com', user.id]);
        console.log('✅ Updated user email');
      }
      
      // Update user password
      await client.query(`
        UPDATE users 
        SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [hashedPassword, user.id]);
      console.log('✅ Updated user password');
      
      // Update accountant password
      await client.query(`
        UPDATE accountants 
        SET password = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [hashedPassword, acc.id]);
      console.log('✅ Updated accountant password');
      
      // Check if user already has Comptable role
      const hasComptableRole = userRoles.rows.some(role => role.role_name === 'Comptable');
      
      if (!hasComptableRole) {
        console.log('👤 Assigning Comptable role...');
        
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
        `, [user.id, roleId, user.id]);
        
        console.log('✅ Assigned Comptable role');
      } else {
        console.log('✅ User already has Comptable role');
      }
      
      await client.query('COMMIT');
      console.log('✅ Transaction committed successfully');
      
      // Verify the fix
      console.log('\n🔍 Verifying the fix...');
      const verifyUser = await db.query(`
        SELECT u.id, u.username, u.email, u.first_name, u.last_name,
               CASE WHEN u.password_hash IS NOT NULL THEN 'Has password' ELSE 'No password' END as password_status,
               r.name as role
        FROM users u
        JOIN user_roles ur ON u.id = ur.user_id
        JOIN roles r ON ur.role_id = r.id
        WHERE u.username = 'oussema'
      `);
      
      const verifyAccountant = await db.query(`
        SELECT id, name, email, 
               CASE WHEN password IS NOT NULL THEN 'Has password' ELSE 'No password' END as password_status
        FROM accountants 
        WHERE email = 'oussema@gmaiil.com'
      `);
      
      console.log('User:', verifyUser.rows[0]);
      console.log('Accountant:', verifyAccountant.rows[0]);
      
      console.log('\n🎉 oussema user connection fixed successfully!');
      console.log('📧 Email: oussema@gmaiil.com');
      console.log('🔑 Password: wael123');
      console.log('👤 Username: oussema');
      console.log('🎭 Role: Comptable');
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Error during fix:', error);
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('❌ Error fixing oussema connection:', error);
  } finally {
    process.exit(0);
  }
}

fixOussemaConnection(); 