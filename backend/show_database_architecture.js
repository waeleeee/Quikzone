const { pool } = require('./config/database');

async function showDatabaseArchitecture() {
  try {
    console.log('🗄️ Database Architecture Analysis');
    console.log('================================\n');

    // Get all tables
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    console.log('📋 All tables in database:');
    tablesResult.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.table_name}`);
    });

    console.log('\n🔍 Role Management Tables:');
    console.log('==========================');

    // Check roles table
    const rolesResult = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'roles'
      ORDER BY ordinal_position
    `);

    console.log('\n📊 Table: roles');
    console.log('Columns:');
    rolesResult.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // Check user_roles table
    const userRolesResult = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'user_roles'
      ORDER BY ordinal_position
    `);

    console.log('\n📊 Table: user_roles');
    console.log('Columns:');
    userRolesResult.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // Check users table
    const usersResult = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);

    console.log('\n📊 Table: users');
    console.log('Columns:');
    usersResult.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // Check drivers table
    const driversResult = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'drivers'
      ORDER BY ordinal_position
    `);

    console.log('\n📊 Table: drivers');
    console.log('Columns:');
    driversResult.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    console.log('\n🎭 Current Roles in System:');
    console.log('==========================');

    // Show all roles
    const allRolesResult = await pool.query('SELECT id, name FROM roles ORDER BY id');
    console.log('Available roles:');
    allRolesResult.rows.forEach(role => {
      console.log(`   - ID ${role.id}: ${role.name}`);
    });

    console.log('\n👤 Sample User Role Assignment:');
    console.log('===============================');

    // Show how roles are assigned
    const sampleUserResult = await pool.query(`
      SELECT 
        u.id as user_id,
        u.email,
        u.username,
        u.role as users_table_role,
        r.name as user_roles_table_role,
        ur.role_id
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.email = 'nouveau.livreur3@quickzone.tn'
    `);

    if (sampleUserResult.rows.length > 0) {
      const user = sampleUserResult.rows[0];
      console.log('User: nouveau.livreur3@quickzone.tn');
      console.log(`   - Users table role: ${user.users_table_role}`);
      console.log(`   - User_roles table role: ${user.user_roles_table_role}`);
      console.log(`   - Role ID: ${user.role_id}`);
    }

    console.log('\n🔧 How Roles Are Determined:');
    console.log('===========================');
    console.log('1. PRIMARY SOURCE: user_roles table (JOIN with roles table)');
    console.log('   - This is the correct way to get user roles');
    console.log('   - Used by the corrected login API');
    console.log('');
    console.log('2. SECONDARY SOURCE: users.role column');
    console.log('   - This column may be outdated or incorrect');
    console.log('   - Should not be used as primary source');
    console.log('');
    console.log('3. RECOMMENDED QUERY:');
    console.log('   SELECT u.*, r.name as role');
    console.log('   FROM users u');
    console.log('   LEFT JOIN user_roles ur ON u.id = ur.user_id');
    console.log('   LEFT JOIN roles r ON ur.role_id = r.id');
    console.log('   WHERE u.email = $1');

    console.log('\n⚠️ Current Problem:');
    console.log('==================');
    console.log('- Users table has role: "Utilisateur"');
    console.log('- User_roles table has role: "Livreurs"');
    console.log('- Login API now reads from user_roles (correct)');
    console.log('- Some other parts may still read from users.role (incorrect)');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

showDatabaseArchitecture(); 