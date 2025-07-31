

const bcrypt = require('bcrypt');
const db = require('../config/database');

async function resetWaelPasswords() {
  try {
    console.log('🔐 Resetting passwords for all Wael accounts...');
    
    // New password to set
    const newPassword = 'wael123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Find all users with 'wael' in their email
    const result = await db.query(`
      SELECT id, email, first_name, last_name, username
      FROM users 
      WHERE email ILIKE '%wael%'
      ORDER BY id
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ No Wael accounts found in the database');
      return;
    }
    
    console.log(`📧 Found ${result.rows.length} Wael account(s):`);
    result.rows.forEach(user => {
      console.log(`   - ${user.first_name} ${user.last_name} (${user.email}) - ${user.username}`);
    });
    
    // Update passwords for all Wael accounts
    const updateResult = await db.query(`
      UPDATE users 
      SET password_hash = $1, updated_at = NOW()
      WHERE email ILIKE '%wael%'
      RETURNING id, email, first_name, last_name, username
    `, [hashedPassword]);
    
    console.log(`✅ Successfully updated ${updateResult.rows.length} Wael account(s) with password: ${newPassword}`);
    
    console.log('\n🔑 Updated accounts:');
    updateResult.rows.forEach(user => {
      console.log(`   - ${user.first_name} ${user.last_name} (${user.email}) - ${user.username}`);
    });
    
    console.log('\n🎯 You can now login with:');
    console.log(`   Email: wael_expediteur@quickzone.tn`);
    console.log(`   Password: ${newPassword}`);
    
  } catch (error) {
    console.error('❌ Error resetting Wael passwords:', error);
  } finally {
    // Close the pool
    await db.pool.end();
    console.log('✅ Database connection pool closed');
  }
}

// Run the script
resetWaelPasswords(); 