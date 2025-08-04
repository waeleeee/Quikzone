const db = require('./config/database');

async function debugUser330() {
  try {
    console.log('🔍 Debugging user ID 330...');
    
    // Check if user exists
    const userResult = await db.query(`
      SELECT id, username, email, first_name, last_name, is_active
      FROM users 
      WHERE id = 330
    `);
    
    console.log('👤 User query result:', userResult.rows.length, 'users found');
    if (userResult.rows.length > 0) {
      console.log('👤 User details:', userResult.rows[0]);
    }
    
    // Check user roles
    const rolesResult = await db.query(`
      SELECT ur.user_id, ur.role_id, ur.is_active as user_role_active,
             r.id as role_id, r.name as role_name, r.permissions
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = 330
    `);
    
    console.log('🎭 User roles query result:', rolesResult.rows.length, 'roles found');
    rolesResult.rows.forEach(role => {
      console.log('🎭 Role:', role);
    });
    
    // Check the exact query that's failing
    console.log('🔍 Testing the exact query from auth middleware...');
    const authQueryResult = await db.query(`
      SELECT 
        u.id, u.username, u.email, u.first_name, u.last_name, 
        u.phone, u.is_active, u.last_login,
        r.name as role, r.permissions
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE u.id = 330 AND u.is_active = true AND ur.is_active = true
    `);
    
    console.log('🔐 Auth middleware query result:', authQueryResult.rows.length, 'users found');
    if (authQueryResult.rows.length > 0) {
      console.log('🔐 Auth user details:', authQueryResult.rows[0]);
    }
    
    // Check what's missing
    console.log('🔍 Checking individual conditions...');
    
    const userActive = await db.query('SELECT is_active FROM users WHERE id = 330');
    console.log('👤 User is_active:', userActive.rows.length > 0 ? userActive.rows[0].is_active : 'User not found');
    
    const userRoleActive = await db.query('SELECT is_active FROM user_roles WHERE user_id = 330');
    console.log('🎭 User role is_active:', userRoleActive.rows.length > 0 ? userRoleActive.rows[0].is_active : 'User role not found');
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  } finally {
    process.exit(0);
  }
}

debugUser330(); 