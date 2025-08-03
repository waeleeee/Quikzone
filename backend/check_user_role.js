const { pool } = require('./config/database');

async function checkUserRole() {
  try {
    console.log('🔍 Checking user role directly from users table...');
    
    const email = 'nouveau.livreur3@quickzone.tn';
    
    // Check the role directly from users table
    const userResult = await pool.query(`
      SELECT id, email, username, first_name, last_name, role, agency, governorate
      FROM users 
      WHERE email = $1
    `, [email]);
    
    if (userResult.rows.length === 0) {
      console.log('❌ User not found');
      return;
    }
    
    const user = userResult.rows[0];
    console.log('👤 User from users table:', {
      id: user.id,
      email: user.email,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      agency: user.agency,
      governorate: user.governorate
    });
    
    // Also check the role from user_roles table
    const roleResult = await pool.query(`
      SELECT u.id, u.email, r.name as role_name
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.email = $1
    `, [email]);
    
    console.log('🎭 Role from user_roles table:', roleResult.rows[0]?.role_name || 'No role assigned');
    
    console.log('\n📋 Summary:');
    console.log('   Users table role:', user.role);
    console.log('   User_roles table role:', roleResult.rows[0]?.role_name);
    
    if (user.role !== 'Livreurs' && roleResult.rows[0]?.role_name !== 'Livreurs') {
      console.log('❌ User does not have Livreurs role in either table');
    } else {
      console.log('✅ User has Livreurs role');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkUserRole(); 