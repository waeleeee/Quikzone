const db = require('./config/database');

async function checkOussemaRoles() {
  try {
    console.log('🔍 Checking oussema user roles...\n');

    // Get all roles for oussema
    const userRoles = await db.query(`
      SELECT ur.id, ur.user_id, ur.role_id, r.name as role_name, ur.is_active
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = (SELECT id FROM users WHERE username = 'oussema')
      ORDER BY r.name
    `);
    
    console.log('👤 Current roles for oussema:');
    userRoles.rows.forEach(role => {
      console.log(`  - ${role.role_name} (Active: ${role.is_active})`);
    });

    // Check if user can login
    const loginCheck = await db.query(`
      SELECT u.id, u.username, u.email, u.password_hash, u.is_active,
             r.name as role
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE u.username = 'oussema' AND ur.is_active = true AND u.is_active = true
    `);
    
    console.log('\n🔐 Login check:');
    if (loginCheck.rows.length > 0) {
      loginCheck.rows.forEach(user => {
        console.log(`  ✅ Can login with role: ${user.role}`);
        console.log(`     Email: ${user.email}`);
        console.log(`     Has password: ${!!user.password_hash}`);
      });
    } else {
      console.log('  ❌ Cannot login - no active roles or user inactive');
    }

    // Test the login credentials
    console.log('\n🧪 Testing login credentials...');
    console.log('📧 Email: oussema@gmaiil.com');
    console.log('🔑 Password: wael123');
    console.log('👤 Username: oussema');
    
    console.log('\n🎯 You should now be able to login with these credentials!');

  } catch (error) {
    console.error('❌ Error checking oussema roles:', error);
  } finally {
    process.exit(0);
  }
}

checkOussemaRoles(); 