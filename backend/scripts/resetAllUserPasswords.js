const bcrypt = require('bcrypt');
const db = require('../config/database');

async function resetAllUserPasswords() {
  try {
    console.log('🔐 Resetting passwords for ALL users...');
    
    // New password to set
    const newPassword = 'wael123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Get all users
    const result = await db.query(`
      SELECT id, email, first_name, last_name, username
      FROM users 
      ORDER BY id
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ No users found in the database');
      return;
    }
    
    console.log(`📧 Found ${result.rows.length} user(s):`);
    result.rows.forEach(user => {
      console.log(`   - ${user.first_name} ${user.last_name} (${user.email}) - ${user.username}`);
    });
    
    // Update passwords for all users
    const updateResult = await db.query(`
      UPDATE users 
      SET password_hash = $1, updated_at = NOW()
      RETURNING id, email, first_name, last_name, username
    `, [hashedPassword]);
    
    console.log(`✅ Successfully updated ${updateResult.rows.length} user(s) with password: ${newPassword}`);
    
    console.log('\n🔑 Updated users:');
    updateResult.rows.forEach(user => {
      console.log(`   - ${user.first_name} ${user.last_name} (${user.email}) - ${user.username}`);
    });
    
    console.log('\n🎯 You can now login with any user using:');
    console.log(`   Password: ${newPassword}`);
    console.log('\n📋 Sample login credentials:');
    console.log(`   Admin: admin@quickzone.tn / ${newPassword}`);
    console.log(`   Wael Expéditeur: wael_expediteur@quickzone.tn / ${newPassword}`);
    console.log(`   Wael Admin: wael_admin@quickzone.tn / ${newPassword}`);
    console.log(`   Wael Commercial: wael_commercial@quickzone.tn / ${newPassword}`);
    console.log(`   Wael Finance: wael_finance@quickzone.tn / ${newPassword}`);
    console.log(`   Wael Chef Agence: wael_chef_agence@quickzone.tn / ${newPassword}`);
    console.log(`   Wael Membre Agence: wael_membre_agence@quickzone.tn / ${newPassword}`);
    console.log(`   Wael Livreur: wael_livreur@quickzone.tn / ${newPassword}`);
    
  } catch (error) {
    console.error('❌ Error resetting user passwords:', error);
  } finally {
    // Close the pool
    await db.pool.end();
    console.log('✅ Database connection pool closed');
  }
}

// Run the script
resetAllUserPasswords(); 