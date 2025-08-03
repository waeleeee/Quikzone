const { pool } = require('./config/database');

async function testCurrentUserRole() {
  try {
    console.log('🔍 Testing current user role...\n');

    const email = 'nouveau.livreur3@quickzone.tn';

    // Test 1: Check from users table directly
    console.log('📊 Test 1: Direct users table query');
    const userResult = await pool.query(`
      SELECT id, email, username, first_name, last_name, role, agency, governorate
      FROM users
      WHERE email = $1
    `, [email]);

    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      console.log('✅ User found in users table:');
      console.log(`   - ID: ${user.id}`);
      console.log(`   - Email: ${user.email}`);
      console.log(`   - Name: ${user.first_name} ${user.last_name}`);
      console.log(`   - Role (users.role): ${user.role}`);
      console.log(`   - Agency: ${user.agency}`);
      console.log(`   - Governorate: ${user.governorate}`);
    } else {
      console.log('❌ User not found in users table');
    }

    console.log('\n📊 Test 2: User roles table query (recommended)');
    const roleResult = await pool.query(`
      SELECT 
        u.id,
        u.email,
        u.username,
        u.first_name,
        u.last_name,
        u.role as users_table_role,
        r.name as user_roles_table_role,
        ur.role_id,
        u.agency,
        u.governorate
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.email = $1
    `, [email]);

    if (roleResult.rows.length > 0) {
      const user = roleResult.rows[0];
      console.log('✅ User found with role information:');
      console.log(`   - ID: ${user.id}`);
      console.log(`   - Email: ${user.email}`);
      console.log(`   - Name: ${user.first_name} ${user.last_name}`);
      console.log(`   - Users table role: ${user.users_table_role}`);
      console.log(`   - User_roles table role: ${user.user_roles_table_role}`);
      console.log(`   - Role ID: ${user.role_id}`);
      console.log(`   - Agency: ${user.agency}`);
      console.log(`   - Governorate: ${user.governorate}`);

      console.log('\n🔍 Role Analysis:');
      if (user.user_roles_table_role === 'Livreurs') {
        console.log('✅ User has "Livreurs" role in user_roles table');
      } else {
        console.log('❌ User does NOT have "Livreurs" role in user_roles table');
      }

      if (user.users_table_role === 'Livreurs') {
        console.log('✅ User has "Livreurs" role in users table');
      } else {
        console.log('❌ User does NOT have "Livreurs" role in users table');
      }

      console.log('\n🎯 Expected behavior:');
      console.log('   - Login API should use user_roles table (correct)');
      console.log('   - Frontend should receive role: "Livreurs"');
      console.log('   - User should be redirected to /livreur-dashboard');
      console.log('   - LivreurDashboard should accept user with role "Livreurs"');

    } else {
      console.log('❌ User not found with role information');
    }

    console.log('\n📊 Test 3: Check if user exists in drivers table');
    const driverResult = await pool.query(`
      SELECT id, name, email, agency, governorate
      FROM drivers
      WHERE email = $1
    `, [email]);

    if (driverResult.rows.length > 0) {
      const driver = driverResult.rows[0];
      console.log('✅ User found in drivers table:');
      console.log(`   - ID: ${driver.id}`);
      console.log(`   - Name: ${driver.name}`);
      console.log(`   - Email: ${driver.email}`);
      console.log(`   - Agency: ${driver.agency}`);
      console.log(`   - Governorate: ${driver.governorate}`);
    } else {
      console.log('❌ User not found in drivers table');
    }

    console.log('\n🎉 Test completed!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

testCurrentUserRole(); 