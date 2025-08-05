const { pool } = require('../config/database');

async function checkUserRoles() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 CHECKING USER ROLES IN DATABASE\n');
    console.log('='.repeat(50));
    
    // Get all unique roles from users table
    const rolesResult = await client.query(`
      SELECT DISTINCT role, COUNT(*) as count
      FROM users 
      WHERE role IS NOT NULL
      GROUP BY role
      ORDER BY role
    `);
    
    console.log('📋 UNIQUE ROLES IN DATABASE:');
    console.log('-'.repeat(30));
    rolesResult.rows.forEach(row => {
      console.log(`  "${row.role}" (${row.count} users)`);
    });
    
    // Get some sample users with their roles
    console.log('\n📋 SAMPLE USERS WITH ROLES:');
    console.log('-'.repeat(30));
    const usersResult = await client.query(`
      SELECT id, email, first_name, last_name, role
      FROM users 
      WHERE role IS NOT NULL
      ORDER BY role, email
      LIMIT 10
    `);
    
    usersResult.rows.forEach(user => {
      console.log(`  ${user.email} (${user.first_name} ${user.last_name}) -> "${user.role}"`);
    });
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ ROLE CHECK COMPLETE');
    
  } catch (error) {
    console.error('❌ Error checking user roles:', error);
  } finally {
    client.release();
  }
}

checkUserRoles()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  }); 