const db = require('./config/database');
const bcrypt = require('bcrypt');

async function fixComptableUserAccounts() {
  try {
    console.log('🔧 Fixing comptable user accounts...\n');

    // Find accountants without user accounts
    const missingUsers = await db.query(`
      SELECT a.id, a.name, a.email, a.password
      FROM accountants a
      LEFT JOIN users u ON a.email = u.email
      WHERE u.id IS NULL
    `);

    if (missingUsers.rows.length === 0) {
      console.log('✅ All accountants have user accounts');
    } else {
      console.log(`📝 Found ${missingUsers.rows.length} accountants without user accounts`);
      
      for (const accountant of missingUsers.rows) {
        console.log(`\n🔧 Creating user account for: ${accountant.name} (${accountant.email})`);
        
        try {
          // Generate unique username
          let username = accountant.email.split('@')[0];
          let counter = 1;
          let uniqueUsername = username;
          
          while (true) {
            const existing = await db.query('SELECT id FROM users WHERE username = $1', [uniqueUsername]);
            if (existing.rows.length === 0) break;
            uniqueUsername = username + counter;
            counter++;
          }

          const firstName = accountant.name.split(' ')[0] || accountant.name;
          const lastName = accountant.name.split(' ').slice(1).join(' ') || '';
          
          // Use existing password hash if available, otherwise create new one
          let passwordHash = accountant.password;
          if (!passwordHash) {
            console.log('⚠️ No password found, setting default password: wael123');
            passwordHash = await bcrypt.hash('wael123', 10);
          }

          // Create user account
          const userResult = await db.query(`
            INSERT INTO users (username, email, password_hash, first_name, last_name, is_active, email_verified)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id
          `, [uniqueUsername, accountant.email, passwordHash, firstName, lastName, true, true]);
          
          const userId = userResult.rows[0].id;
          console.log(`✅ User account created with ID: ${userId}`);

          // Get Comptable role ID
          const roleResult = await db.query('SELECT id FROM roles WHERE name = $1', ['Comptable']);
          if (roleResult.rows.length === 0) {
            console.log('❌ Comptable role not found, creating it...');
            await db.query(`
              INSERT INTO roles (name, description, permissions, is_system_role)
              VALUES ('Comptable', 'Financial operations', '{"dashboard": true, "personnel": {"finance": true}, "paiment_expediteur": true}', true)
            `);
          }
          
          const roleId = roleResult.rows[0]?.id || (await db.query('SELECT id FROM roles WHERE name = $1', ['Comptable'])).rows[0].id;
          
          // Assign Comptable role to user
          await db.query(`
            INSERT INTO user_roles (user_id, role_id, assigned_by)
            VALUES ($1, $2, $3)
          `, [userId, roleId, userId]);
          
          console.log(`✅ Comptable role assigned to user`);
          
        } catch (error) {
          console.error(`❌ Error creating user account for ${accountant.name}:`, error.message);
        }
      }
    }

    // Fix email mismatches
    console.log('\n🔍 Checking for email mismatches...');
    
    const emailMismatches = await db.query(`
      SELECT u.id, u.username, u.email as user_email, a.email as accountant_email, a.name
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      LEFT JOIN accountants a ON u.email = a.email
      WHERE r.name = 'Comptable' AND a.id IS NULL
    `);

    if (emailMismatches.rows.length > 0) {
      console.log(`📝 Found ${emailMismatches.rows.length} users with email mismatches`);
      
      for (const mismatch of emailMismatches.rows) {
        console.log(`\n🔧 Fixing email mismatch for: ${mismatch.name} (User: ${mismatch.user_email})`);
        
        // Find accountant with similar email
        const similarAccountant = await db.query(`
          SELECT id, email, name
          FROM accountants
          WHERE email LIKE $1 OR email LIKE $2
        `, [`%${mismatch.user_email.split('@')[0]}%`, `%${mismatch.user_email.split('@')[1]}%`]);
        
        if (similarAccountant.rows.length > 0) {
          const accountant = similarAccountant.rows[0];
          console.log(`📧 Found similar accountant: ${accountant.email}`);
          
          // Check if there's already a user with the accountant's email
          const existingUser = await db.query(`
            SELECT id, username, email
            FROM users
            WHERE email = $1
          `, [accountant.email]);
          
          if (existingUser.rows.length > 0) {
            console.log(`⚠️ User already exists with email ${accountant.email}: ${existingUser.rows[0].username}`);
            console.log(`💡 Solution: Delete the user with wrong email (${mismatch.user_email}) since correct user already exists`);
            
            // Delete the user with wrong email
            await db.query(`
              DELETE FROM user_roles WHERE user_id = $1
            `, [mismatch.id]);
            
            await db.query(`
              DELETE FROM users WHERE id = $1
            `, [mismatch.id]);
            
            console.log(`✅ Deleted user with wrong email: ${mismatch.user_email}`);
          } else {
            // Update user email to match accountant
            await db.query(`
              UPDATE users 
              SET email = $1, updated_at = CURRENT_TIMESTAMP
              WHERE id = $2
            `, [accountant.email, mismatch.id]);
            
            console.log(`✅ Updated user email from ${mismatch.user_email} to ${accountant.email}`);
          }
        } else {
          console.log(`⚠️ No matching accountant found for ${mismatch.user_email}`);
        }
      }
    } else {
      console.log('✅ No email mismatches found');
    }

    console.log('\n✅ Comptable user accounts fix completed!');
    
  } catch (error) {
    console.error('❌ Error fixing comptable user accounts:', error);
  } finally {
    process.exit(0);
  }
}

fixComptableUserAccounts(); 