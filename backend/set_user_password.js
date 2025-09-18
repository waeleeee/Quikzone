const db = require('./config/database');
const bcrypt = require('bcryptjs');

const setUserPassword = async () => {
  try {
    console.log('🔍 Setting password for bensalah@quickzone.tn...\n');

    const userEmail = 'bensalah@quickzone.tn';
    const newPassword = '123456';

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log('✅ Password hashed successfully');

    // Update the user's password
    const updateResult = await db.query(`
      UPDATE users 
      SET password_hash = $1, updated_at = NOW()
      WHERE email = $2
    `, [hashedPassword, userEmail]);

    console.log('✅ Password updated successfully');
    console.log(`📋 New password for ${userEmail}: ${newPassword}`);

    // Verify the update
    const verifyResult = await db.query(`
      SELECT id, first_name, last_name, email, password_hash
      FROM users 
      WHERE email = $1
    `, [userEmail]);

    if (verifyResult.rows.length > 0) {
      const user = verifyResult.rows[0];
      console.log('\n✅ User data after password update:');
      console.log(`  - ID: ${user.id}`);
      console.log(`  - Name: ${user.first_name} ${user.last_name}`);
      console.log(`  - Email: ${user.email}`);
      console.log(`  - Password hash: ${user.password_hash.substring(0, 20)}...`);
      
      // Test the password
      const isMatch = await bcrypt.compare(newPassword, user.password_hash);
      console.log(`  - Password test: ${isMatch ? '✅ MATCH!' : '❌ No match'}`);
    }

  } catch (error) {
    console.error('❌ Error setting user password:', error);
  } finally {
    process.exit(0);
  }
};

setUserPassword(); 