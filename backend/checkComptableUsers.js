const db = require('./config/database');

async function checkComptableUsers() {
  try {
    console.log('🔍 Checking comptable user accounts...\n');

    // Check accountants table
    console.log('📋 Accountants table:');
    const accountantsResult = await db.query(`
      SELECT id, name, email, phone, title, agency, 
             CASE WHEN password IS NOT NULL THEN 'Has password' ELSE 'No password' END as password_status
      FROM accountants
      ORDER BY id
    `);
    
    accountantsResult.rows.forEach(acc => {
      console.log(`  ID: ${acc.id}, Name: ${acc.name}, Email: ${acc.email}, Password: ${acc.password_status}`);
    });

    console.log('\n👤 Users table (comptables):');
    const usersResult = await db.query(`
      SELECT u.id, u.username, u.email, u.first_name, u.last_name, u.phone,
             CASE WHEN u.password_hash IS NOT NULL THEN 'Has password' ELSE 'No password' END as password_status,
             r.name as role
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE r.name = 'Comptable'
      ORDER BY u.id
    `);
    
    usersResult.rows.forEach(user => {
      console.log(`  ID: ${user.id}, Username: ${user.username}, Email: ${user.email}, Name: ${user.first_name} ${user.last_name}, Password: ${user.password_status}, Role: ${user.role}`);
    });

    // Check for mismatches
    console.log('\n🔍 Checking for mismatches...');
    
    // Find accountants without user accounts
    const missingUsers = await db.query(`
      SELECT a.id, a.name, a.email
      FROM accountants a
      LEFT JOIN users u ON a.email = u.email
      WHERE u.id IS NULL
    `);
    
    if (missingUsers.rows.length > 0) {
      console.log('❌ Accountants without user accounts:');
      missingUsers.rows.forEach(acc => {
        console.log(`  - ${acc.name} (${acc.email})`);
      });
    } else {
      console.log('✅ All accountants have user accounts');
    }

    // Find users without accountant records
    const missingAccountants = await db.query(`
      SELECT u.id, u.username, u.email, u.first_name, u.last_name
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      LEFT JOIN accountants a ON u.email = a.email
      WHERE r.name = 'Comptable' AND a.id IS NULL
    `);
    
    if (missingAccountants.rows.length > 0) {
      console.log('❌ User accounts without accountant records:');
      missingAccountants.rows.forEach(user => {
        console.log(`  - ${user.first_name} ${user.last_name} (${user.email})`);
      });
    } else {
      console.log('✅ All comptable users have accountant records');
    }

    // Check password consistency
    console.log('\n🔐 Checking password consistency...');
    const passwordMismatch = await db.query(`
      SELECT a.id, a.name, a.email,
             CASE WHEN a.password IS NOT NULL THEN 'Has password' ELSE 'No password' END as accountant_password,
             CASE WHEN u.password_hash IS NOT NULL THEN 'Has password' ELSE 'No password' END as user_password
      FROM accountants a
      JOIN users u ON a.email = u.email
      WHERE (a.password IS NULL AND u.password_hash IS NOT NULL) 
         OR (a.password IS NOT NULL AND u.password_hash IS NULL)
    `);
    
    if (passwordMismatch.rows.length > 0) {
      console.log('❌ Password mismatches:');
      passwordMismatch.rows.forEach(row => {
        console.log(`  - ${row.name} (${row.email}): Accountant=${row.accountant_password}, User=${row.user_password}`);
      });
    } else {
      console.log('✅ All passwords are consistent between tables');
    }

  } catch (error) {
    console.error('❌ Error checking comptable users:', error);
  } finally {
    process.exit(0);
  }
}

checkComptableUsers(); 