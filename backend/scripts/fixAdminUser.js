const db = require('../config/database');
const bcrypt = require('bcryptjs');

const fixAdminUser = async () => {
  try {
    console.log('🔧 Fixing admin user authentication...');
    
    // Find the admin user
    const adminResult = await db.query(`
      SELECT id, name, email, password, phone, governorate, address, role
      FROM administrators 
      WHERE email = 'ahmed@gmail.com'
    `);
    
    if (adminResult.rows.length === 0) {
      console.log('❌ Admin user with email ahmed@gmail.com not found');
      return;
    }
    
    const admin = adminResult.rows[0];
    console.log('✅ Found admin user:', admin.name);
    
    // Check if user already exists in users table
    const existingUser = await db.query(`
      SELECT id FROM users WHERE email = $1
    `, [admin.email]);
    
    if (existingUser.rows.length > 0) {
      console.log('ℹ️ User already exists in users table');
      return;
    }
    
    // Hash password if not already hashed
    let hashedPassword = admin.password;
    if (!hashedPassword || hashedPassword.length < 20) {
      // Password is not hashed, hash it
      hashedPassword = await bcrypt.hash('wael123', 10);
      console.log('🔐 Password hashed');
    }
    
    // Start transaction
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      
      // Create user in users table
      const userResult = await client.query(`
        INSERT INTO users (username, email, password_hash, first_name, last_name, phone, is_active, email_verified)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `, [admin.email, admin.email, hashedPassword, admin.name, '', admin.phone, true, true]);
      
      const userId = userResult.rows[0].id;
      console.log('✅ User created in users table with ID:', userId);
      
      // Get role ID for Administration
      const roleResult = await client.query('SELECT id FROM roles WHERE name = $1', ['Administration']);
      if (roleResult.rows.length === 0) {
        throw new Error('Administration role not found');
      }
      
      const roleId = roleResult.rows[0].id;
      console.log('✅ Found Administration role with ID:', roleId);
      
      // Assign role to user
      await client.query(`
        INSERT INTO user_roles (user_id, role_id, assigned_by, is_active)
        VALUES ($1, $2, $3, $4)
      `, [userId, roleId, userId, true]);
      
      console.log('✅ Role assigned to user');
      
      // Update password in administrators table if it was hashed
      if (hashedPassword !== admin.password) {
        await client.query(`
          UPDATE administrators 
          SET password = $1 
          WHERE id = $2
        `, [hashedPassword, admin.id]);
        console.log('✅ Password updated in administrators table');
      }
      
      await client.query('COMMIT');
      console.log('✅ Transaction committed successfully');
      
      console.log('🎉 Admin user fixed! You can now login with:');
      console.log('   Email: ahmed@gmail.com');
      console.log('   Password: wael123');
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('❌ Error fixing admin user:', error);
  } finally {
    process.exit(0);
  }
};

fixAdminUser(); 