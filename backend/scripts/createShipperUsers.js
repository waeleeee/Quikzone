const db = require('../config/database');
const bcrypt = require('bcrypt');

const createShipperUsers = async () => {
  try {
    console.log('👤 Creating user accounts for all shippers...\n');
    
    // Get the Expéditeur role ID
    const roleResult = await db.query(`
      SELECT id FROM roles WHERE name = 'Expéditeur'
    `);
    
    if (roleResult.rows.length === 0) {
      console.log('❌ Expéditeur role not found');
      return;
    }
    
    const expediteurRoleId = roleResult.rows[0].id;
    console.log(`✅ Found Expéditeur role ID: ${expediteurRoleId}`);
    
    // Get all shippers
    const shippersResult = await db.query(`
      SELECT id, name, email, company 
      FROM shippers 
      ORDER BY name
    `);
    
    console.log(`📦 Found ${shippersResult.rows.length} shippers`);
    
    // Hash the password
    const passwordHash = await bcrypt.hash('wael123', 10);
    
    let createdCount = 0;
    let updatedCount = 0;
    
    for (const shipper of shippersResult.rows) {
      try {
        // Check if user already exists
        const existingUser = await db.query(`
          SELECT id FROM users WHERE email = $1
        `, [shipper.email]);
        
        if (existingUser.rows.length > 0) {
          // Update existing user password
          await db.query(`
            UPDATE users 
            SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
            WHERE email = $2
          `, [passwordHash, shipper.email]);
          
          console.log(`✅ Updated password for existing user: ${shipper.name} (${shipper.email})`);
          updatedCount++;
        } else {
          // Create new user
          const nameParts = shipper.name.split(' ');
          const firstName = nameParts[0] || shipper.name;
          const lastName = nameParts.slice(1).join(' ') || shipper.name;
          const username = shipper.email.split('@')[0];
          
          const newUser = await db.query(`
            INSERT INTO users (username, email, password_hash, first_name, last_name, phone, is_active, email_verified)
            VALUES ($1, $2, $3, $4, $5, $6, true, true)
            RETURNING id
          `, [username, shipper.email, passwordHash, firstName, lastName, '+216 000 000 000']);
          
          const userId = newUser.rows[0].id;
          
          // Assign Expéditeur role
          await db.query(`
            INSERT INTO user_roles (user_id, role_id, assigned_by, is_active)
            VALUES ($1, $2, 1, true)
          `, [userId, expediteurRoleId]);
          
          console.log(`✅ Created new user: ${shipper.name} (${shipper.email})`);
          createdCount++;
        }
        
      } catch (error) {
        console.error(`❌ Error processing ${shipper.name}:`, error.message);
      }
    }
    
    console.log(`\n🎉 Summary:`);
    console.log(`   - Created ${createdCount} new users`);
    console.log(`   - Updated ${updatedCount} existing users`);
    console.log(`   - Total processed: ${createdCount + updatedCount}`);
    console.log(`🔑 All passwords are set to: wael123`);
    
    // Show the final login information
    console.log('\n📧 FINAL SHIPPER LOGIN INFORMATION:');
    console.log('=====================================');
    
    shippersResult.rows.forEach((shipper, index) => {
      console.log(`${index + 1}. ${shipper.name}`);
      console.log(`   📧 Email: ${shipper.email}`);
      console.log(`   🏢 Company: ${shipper.company}`);
      console.log(`   🔑 Password: wael123`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error creating shipper users:', error);
  } finally {
    process.exit(0);
  }
};

createShipperUsers(); 