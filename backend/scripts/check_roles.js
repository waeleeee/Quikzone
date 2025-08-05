const { pool } = require('../config/database');

async function checkRoles() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 CHECKING ROLES IN DATABASE\n');
    console.log('='.repeat(60));
    
    // Check roles table
    const rolesResult = await client.query(`
      SELECT id, name, description, created_at
      FROM roles
      ORDER BY id
    `);
    
    console.log('📋 ROLES TABLE:');
    console.log('-'.repeat(80));
    console.log('ID | Name                    | Description');
    console.log('-'.repeat(80));
    
    rolesResult.rows.forEach(role => {
      const name = (role.name || '').padEnd(25);
      const description = role.description || 'No description';
      console.log(`${role.id.toString().padStart(2)} | ${name} | ${description}`);
    });
    
    // Check user_roles table for sample data
    const userRolesResult = await client.query(`
      SELECT ur.user_id, ur.role_id, u.email, r.name as role_name
      FROM user_roles ur
      JOIN users u ON ur.user_id = u.id
      JOIN roles r ON ur.role_id = r.id
      LIMIT 10
    `);
    
    console.log('\n📋 SAMPLE USER_ROLES:');
    console.log('-'.repeat(80));
    console.log('User ID | Role ID | Email                    | Role Name');
    console.log('-'.repeat(80));
    
    userRolesResult.rows.forEach(userRole => {
      const email = (userRole.email || '').padEnd(25);
      const roleName = userRole.role_name || 'Unknown';
      console.log(`${userRole.user_id.toString().padStart(7)} | ${userRole.role_id.toString().padStart(7)} | ${email} | ${roleName}`);
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ ROLES CHECK COMPLETE');
    
  } catch (error) {
    console.error('❌ Error checking roles:', error);
  } finally {
    client.release();
  }
}

checkRoles()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  }); 