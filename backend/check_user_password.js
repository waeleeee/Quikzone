const db = require('./config/database');
const bcrypt = require('bcryptjs');

const checkUserPassword = async () => {
  try {
    console.log('🔍 Checking user password for bensalah@quickzone.tn...\n');

    const userEmail = 'bensalah@quickzone.tn';

    // Check users table
    const userResult = await db.query(`
      SELECT 
        id,
        first_name,
        last_name,
        email,
        password,
        is_active
      FROM users
      WHERE email = $1
    `, [userEmail]);

    if (userResult.rows.length === 0) {
      console.log('❌ User not found in users table');
      return;
    }

    const user = userResult.rows[0];
    console.log('✅ User found:');
    console.log(`  - ID: ${user.id}`);
    console.log(`  - Name: ${user.first_name} ${user.last_name}`);
    console.log(`  - Email: ${user.email}`);
    console.log(`  - Active: ${user.is_active ? 'Yes' : 'No'}`);
    console.log(`  - Has password: ${user.password ? 'Yes' : 'No'}`);

    if (user.password) {
      console.log(`  - Password hash: ${user.password.substring(0, 20)}...`);
      
      // Test common passwords
      const testPasswords = ['123456', 'password', 'admin', '12345678', 'qwerty'];
      
      console.log('\n📋 Testing common passwords:');
      for (const testPassword of testPasswords) {
        const isMatch = await bcrypt.compare(testPassword, user.password);
        console.log(`  - "${testPassword}": ${isMatch ? '✅ MATCH!' : '❌ No match'}`);
        if (isMatch) {
          console.log(`  ✅ Found correct password: "${testPassword}"`);
          break;
        }
      }
    } else {
      console.log('❌ User has no password set');
      
      // Try to set a password
      console.log('\n📋 Setting password to "123456"...');
      const hashedPassword = await bcrypt.hash('123456', 10);
      
      await db.query(`
        UPDATE users 
        SET password = $1 
        WHERE email = $2
      `, [hashedPassword, userEmail]);
      
      console.log('✅ Password set successfully');
    }

  } catch (error) {
    console.error('❌ Error checking user password:', error);
  } finally {
    process.exit(0);
  }
};

checkUserPassword(); 