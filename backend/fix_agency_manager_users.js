const db = require('./config/database');
const bcrypt = require('bcryptjs');

async function checkAndFixAgencyManagerUsers() {
  try {
    console.log('🔍 Checking agency managers and their user accounts...');
    
    // Get all agency managers with user account status
    const result = await db.query(`
      SELECT 
        am.id, 
        am.name, 
        am.email, 
        am.agency, 
        am.password as agency_password,
        CASE WHEN u.id IS NOT NULL THEN true ELSE false END as has_user_account,
        u.id as user_id,
        u.username,
        u.is_active
      FROM agency_managers am 
      LEFT JOIN users u ON am.email = u.email 
      ORDER BY am.id
    `);
    
    console.log('\n📊 Agency Managers Status:');
    console.log('='.repeat(80));
    
    const missingUsers = [];
    
    for (const row of result.rows) {
      console.log(`ID: ${row.id}, Name: ${row.name}, Email: ${row.email}, Agency: ${row.agency}, Has User Account: ${row.has_user_account}`);
      
      if (!row.has_user_account) {
        missingUsers.push(row);
      }
    }
    
    if (missingUsers.length === 0) {
      console.log('\n✅ All agency managers have user accounts!');
      return;
    }
    
    console.log(`\n❌ Found ${missingUsers.length} agency managers without user accounts:`);
    missingUsers.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - ${user.agency}`);
    });
    
    console.log('\n🔧 Creating missing user accounts...');
    
    // Get Chef d'agence role ID
    const roleResult = await db.query("SELECT id FROM roles WHERE name = 'Chef d''agence'");
    if (roleResult.rows.length === 0) {
      throw new Error('Chef d\'agence role not found');
    }
    const roleId = roleResult.rows[0].id;
    
    for (const agencyManager of missingUsers) {
      console.log(`\n📝 Creating user account for: ${agencyManager.name} (${agencyManager.email})`);
      
      // Generate unique username
      let username = agencyManager.email.split('@')[0];
      let counter = 1;
      let uniqueUsername = username;
      while (true) {
        const existing = await db.query('SELECT id FROM users WHERE username = $1', [uniqueUsername]);
        if (existing.rows.length === 0) break;
        uniqueUsername = username + counter;
        counter++;
      }
      
      const firstName = agencyManager.name.split(' ')[0] || agencyManager.name;
      const lastName = agencyManager.name.split(' ').slice(1).join(' ') || '';
      
      // Start transaction
      const client = await db.pool.connect();
      try {
        await client.query('BEGIN');
        
        // Create user account
        const userResult = await client.query(`
          INSERT INTO users (username, email, password_hash, first_name, last_name, is_active, email_verified)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id
        `, [uniqueUsername, agencyManager.email, agencyManager.agency_password, firstName, lastName, true, true]);
        
        const userId = userResult.rows[0].id;
        console.log(`  ✅ User account created with ID: ${userId}`);
        
        // Assign Chef d'agence role
        await client.query(`
          INSERT INTO user_roles (user_id, role_id, assigned_by)
          VALUES ($1, $2, $3)
        `, [userId, roleId, userId]);
        
        console.log(`  ✅ Role assigned successfully`);
        
        await client.query('COMMIT');
        console.log(`  ✅ Transaction committed for ${agencyManager.name}`);
        
      } catch (error) {
        await client.query('ROLLBACK');
        console.error(`  ❌ Error creating user account for ${agencyManager.name}:`, error.message);
        throw error;
      } finally {
        client.release();
      }
    }
    
    console.log('\n✅ All missing user accounts have been created!');
    
    // Verify the fix
    console.log('\n🔍 Verifying the fix...');
    const verifyResult = await db.query(`
      SELECT 
        am.id, 
        am.name, 
        am.email, 
        CASE WHEN u.id IS NOT NULL THEN true ELSE false END as has_user_account
      FROM agency_managers am 
      LEFT JOIN users u ON am.email = u.email 
      ORDER BY am.id
    `);
    
    console.log('\n📊 Final Status:');
    console.log('='.repeat(50));
    verifyResult.rows.forEach(row => {
      console.log(`ID: ${row.id}, Name: ${row.name}, Has User Account: ${row.has_user_account}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

checkAndFixAgencyManagerUsers(); 