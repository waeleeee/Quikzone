const db = require('./config/database');
const bcrypt = require('bcryptjs');

async function testComptableLogin() {
  try {
    console.log('🧪 Testing comptable login...\n');

    // Get all comptables
    const comptables = await db.query(`
      SELECT a.id, a.name, a.email, a.password as accountant_password,
             u.id as user_id, u.username, u.password_hash as user_password
      FROM accountants a
      LEFT JOIN users u ON a.email = u.email
      ORDER BY a.id
    `);
    
    console.log('📋 Testing each comptable:');
    
    for (const comptable of comptables.rows) {
      console.log(`\n👤 ${comptable.name} (${comptable.email}):`);
      
      if (!comptable.user_id) {
        console.log('  ❌ No user account found');
        continue;
      }
      
      if (!comptable.user_password) {
        console.log('  ❌ No password in user table');
        continue;
      }
      
      // Test with default password
      const testPassword = 'wael123';
      const isValid = await bcrypt.compare(testPassword, comptable.user_password);
      
      if (isValid) {
        console.log(`  ✅ Can login with password: ${testPassword}`);
      } else {
        console.log(`  ❌ Cannot login with password: ${testPassword}`);
      }
      
      // Check if passwords match between tables
      if (comptable.accountant_password && comptable.user_password) {
        const passwordsMatch = comptable.accountant_password === comptable.user_password;
        console.log(`  🔐 Passwords match: ${passwordsMatch ? '✅' : '❌'}`);
      }
    }
    
    console.log('\n🎯 Summary:');
    console.log('- If you see ✅, the user can login');
    console.log('- If you see ❌, there\'s an issue with that user');
    console.log('- Default password for all comptables should be: wael123');

  } catch (error) {
    console.error('❌ Error testing login:', error);
  } finally {
    process.exit(0);
  }
}

testComptableLogin(); 