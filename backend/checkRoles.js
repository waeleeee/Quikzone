const db = require('./config/database');

async function checkRoles() {
  try {
    console.log('🔍 Checking roles in database...\n');

    // Check roles table
    console.log('📋 Roles table:');
    const rolesResult = await db.query(`
      SELECT id, name, description, is_system_role
      FROM roles
      ORDER BY id
    `);
    
    rolesResult.rows.forEach(role => {
      console.log(`  ID: ${role.id}, Name: "${role.name}", Description: ${role.description}, System: ${role.is_system_role}`);
    });

    console.log('\n👤 Users with roles:');
    const usersWithRoles = await db.query(`
      SELECT u.id, u.username, u.email, u.first_name, u.last_name, r.name as role
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      ORDER BY u.id
    `);
    
    usersWithRoles.rows.forEach(user => {
      console.log(`  ID: ${user.id}, Username: ${user.username}, Email: ${user.email}, Name: ${user.first_name} ${user.last_name}, Role: ${user.role}`);
    });

  } catch (error) {
    console.error('❌ Error checking roles:', error);
  } finally {
    process.exit(0);
  }
}

checkRoles(); 