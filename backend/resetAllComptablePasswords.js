const db = require('./config/database');
const bcrypt = require('bcryptjs');

async function resetAllComptablePasswords() {
  try {
    console.log('🔧 Resetting all comptable passwords to wael123...\n');

    const defaultPassword = 'wael123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    
    console.log('🔐 Setting password for all comptables:', defaultPassword);

    // Get all accountants
    const accountants = await db.query(`
      SELECT id, name, email, phone, governorate, address, title, agency
      FROM accountants
      ORDER BY id
    `);
    
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      
      for (const accountant of accountants.rows) {
        console.log(`\n👤 Processing: ${accountant.name} (${accountant.email})`);
        
        // Update accountant password
        await client.query(`
          UPDATE accountants 
          SET password = $1, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [hashedPassword, accountant.id]);
        console.log('  ✅ Updated accountant password');
        
        // Check if user account exists
        const userResult = await client.query(`
          SELECT id, username, email, password_hash
          FROM users 
          WHERE email = $1
        `, [accountant.email]);
        
        if (userResult.rows.length > 0) {
          // Update existing user
          const user = userResult.rows[0];
          const firstName = accountant.name.split(' ')[0] || accountant.name;
          const lastName = accountant.name.split(' ').slice(1).join(' ') || '';
          
          await client.query(`
            UPDATE users 
            SET password_hash = $1, first_name = $2, last_name = $3, phone = $4, updated_at = CURRENT_TIMESTAMP
            WHERE id = $5
          `, [hashedPassword, firstName, lastName, accountant.phone, user.id]);
          console.log('  ✅ Updated existing user password');
          
          // Ensure user has Comptable role
          const roleCheck = await client.query(`
            SELECT ur.id 
            FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = $1 AND r.name = 'Comptable'
          `, [user.id]);
          
          if (roleCheck.rows.length === 0) {
            // Add Comptable role
            const roleResult = await client.query('SELECT id FROM roles WHERE name = $1', ['Comptable']);
            if (roleResult.rows.length > 0) {
              await client.query(`
                INSERT INTO user_roles (user_id, role_id, assigned_by)
                VALUES ($1, $2, $3)
              `, [user.id, roleResult.rows[0].id, user.id]);
              console.log('  ✅ Added Comptable role');
            }
          } else {
            console.log('  ✅ Already has Comptable role');
          }
          
                 } else {
           // Create new user account
           console.log('  👤 Creating new user account...');
           let username = accountant.email.split('@')[0];
           const firstName = accountant.name.split(' ')[0] || accountant.name;
           const lastName = accountant.name.split(' ').slice(1).join(' ') || '';
           
           // Check if username already exists and generate unique one
           let usernameExists = true;
           let counter = 1;
           let finalUsername = username;
           
           while (usernameExists) {
             const existingUser = await client.query('SELECT id FROM users WHERE username = $1', [finalUsername]);
             if (existingUser.rows.length === 0) {
               usernameExists = false;
             } else {
               finalUsername = `${username}${counter}`;
               counter++;
             }
           }
           
           console.log(`  📝 Using username: ${finalUsername}`);
           
           const userInsertResult = await client.query(`
             INSERT INTO users (username, email, password_hash, first_name, last_name, phone, is_active, email_verified)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING id
           `, [finalUsername, accountant.email, hashedPassword, firstName, lastName, accountant.phone, true, true]);
          
          const userId = userInsertResult.rows[0].id;
          console.log('  ✅ Created user account with ID:', userId);
          
          // Get Comptable role ID
          const roleResult = await client.query('SELECT id FROM roles WHERE name = $1', ['Comptable']);
          if (roleResult.rows.length > 0) {
            // Assign Comptable role to user
            await client.query(`
              INSERT INTO user_roles (user_id, role_id, assigned_by)
              VALUES ($1, $2, $3)
            `, [userId, roleResult.rows[0].id, userId]);
            console.log('  ✅ Assigned Comptable role');
          }
        }
      }
      
      await client.query('COMMIT');
      console.log('\n✅ All comptable passwords reset successfully!');
      
      // Verify the results
      console.log('\n🔍 Verification:');
      const verifyResult = await db.query(`
        SELECT a.name, a.email, 
               CASE WHEN a.password IS NOT NULL THEN 'Has password' ELSE 'No password' END as accountant_password,
               CASE WHEN u.password_hash IS NOT NULL THEN 'Has password' ELSE 'No password' END as user_password,
               r.name as role
        FROM accountants a
        LEFT JOIN users u ON a.email = u.email
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id
        ORDER BY a.id
      `);
      
      verifyResult.rows.forEach(row => {
        console.log(`  ${row.name} (${row.email}): Accountant=${row.accountant_password}, User=${row.user_password}, Role=${row.role || 'None'}`);
      });
      
      console.log('\n🎉 All comptables can now login with:');
      console.log('📧 Email: (their email)');
      console.log('🔑 Password: wael123');
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Error during reset:', error);
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('❌ Error resetting passwords:', error);
  } finally {
    process.exit(0);
  }
}

resetAllComptablePasswords(); 