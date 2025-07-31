const db = require('../config/database');

const checkDriverPassword = async (driverEmail) => {
  try {
    console.log('🔍 Checking password status for driver:', driverEmail);
    
    // Check driver table
    const driverResult = await db.query(`
      SELECT id, name, email, 
             CASE WHEN password IS NOT NULL THEN true ELSE false END as has_password,
             password
      FROM drivers 
      WHERE email = $1
    `, [driverEmail]);
    
    if (driverResult.rows.length === 0) {
      console.log('❌ Driver not found in drivers table');
      return;
    }
    
    const driver = driverResult.rows[0];
    console.log('📊 Driver info:');
    console.log('  - ID:', driver.id);
    console.log('  - Name:', driver.name);
    console.log('  - Email:', driver.email);
    console.log('  - Has password in drivers table:', driver.has_password);
    console.log('  - Password hash (first 20 chars):', driver.password ? driver.password.substring(0, 20) + '...' : 'NULL');
    
    // Check users table
    const userResult = await db.query(`
      SELECT u.id, u.username, u.email, u.first_name, u.last_name, u.is_active,
             CASE WHEN u.password_hash IS NOT NULL THEN true ELSE false END as has_password_hash,
             u.password_hash
      FROM users u
      WHERE u.email = $1
    `, [driverEmail]);
    
    if (userResult.rows.length === 0) {
      console.log('❌ User not found in users table');
      return;
    }
    
    const user = userResult.rows[0];
    console.log('📊 User info:');
    console.log('  - ID:', user.id);
    console.log('  - Username:', user.username);
    console.log('  - Email:', user.email);
    console.log('  - First Name:', user.first_name);
    console.log('  - Last Name:', user.last_name);
    console.log('  - Is Active:', user.is_active);
    console.log('  - Has password_hash in users table:', user.has_password_hash);
    console.log('  - Password hash (first 20 chars):', user.password_hash ? user.password_hash.substring(0, 20) + '...' : 'NULL');
    
    // Check user roles
    const roleResult = await db.query(`
      SELECT r.name as role_name
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = $1 AND ur.is_active = true
    `, [user.id]);
    
    console.log('📊 User roles:');
    roleResult.rows.forEach(role => {
      console.log('  - Role:', role.role_name);
    });
    
    // Compare password hashes
    if (driver.password && user.password_hash) {
      const bcrypt = require('bcryptjs');
      const passwordsMatch = await bcrypt.compare(driver.password, user.password_hash);
      console.log('🔐 Password comparison:');
      console.log('  - Passwords match:', passwordsMatch);
      
      if (!passwordsMatch) {
        console.log('⚠️  WARNING: Password hashes do not match!');
        console.log('  - Driver table hash:', driver.password.substring(0, 20) + '...');
        console.log('  - Users table hash:', user.password_hash.substring(0, 20) + '...');
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking driver password:', error);
    throw error;
  }
};

// Get email from command line argument
const driverEmail = process.argv[2];

if (!driverEmail) {
  console.log('Usage: node checkDriverPassword.js <driver_email>');
  console.log('Example: node checkDriverPassword.js driver@example.com');
  process.exit(1);
}

// Run the check
checkDriverPassword(driverEmail)
  .then(() => {
    console.log('✅ Password check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Password check failed:', error);
    process.exit(1);
  }); 