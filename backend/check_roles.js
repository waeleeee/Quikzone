const db = require('./config/database');

async function checkRoles() {
  try {
    console.log('🔍 Checking roles in database...');
    
    // Check users table for roles
    const usersRoles = await db.query(`
      SELECT DISTINCT role FROM users WHERE role IS NOT NULL
    `);
    console.log('👤 Roles in users table:', usersRoles.rows.map(r => r.role));
    
    // Check roles table
    const rolesTable = await db.query(`
      SELECT id, name FROM roles
    `);
    console.log('🎭 Roles in roles table:', rolesTable.rows.map(r => r.name));
    
    // Check user_roles table
    const userRoles = await db.query(`
      SELECT COUNT(*) as count FROM user_roles
    `);
    console.log('🔗 User roles count:', userRoles.rows[0].count);
    
    // Check specific user 330
    const user330 = await db.query(`
      SELECT id, username, email, role FROM users WHERE id = 330
    `);
    console.log('👤 User 330 details:', user330.rows[0]);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

checkRoles(); 