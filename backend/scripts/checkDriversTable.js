const db = require('../config/database');

async function checkDriversTable() {
  try {
    console.log('🔍 Checking drivers table structure...');
    
    // Check if password column exists
    const columnCheck = await db.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'drivers' AND column_name = 'password'
    `);
    
    if (columnCheck.rows.length === 0) {
      console.log('❌ Password column does not exist in drivers table');
      return;
    }
    
    console.log('✅ Password column exists:', columnCheck.rows[0]);
    
    // Check all drivers and their password status
    const driversResult = await db.query(`
      SELECT id, name, email, agency,
             password,
             CASE WHEN password IS NOT NULL THEN true ELSE false END as has_password,
             CASE WHEN password IS NOT NULL THEN 'Has password' ELSE 'No password' END as password_status
      FROM drivers
      ORDER BY name
    `);
    
    console.log(`\n📊 Found ${driversResult.rows.length} drivers:`);
    
    driversResult.rows.forEach((driver, index) => {
      console.log(`${index + 1}. ${driver.name} (${driver.email})`);
      console.log(`   - Agency: ${driver.agency}`);
      console.log(`   - Password: ${driver.password ? 'SET' : 'NULL'}`);
      console.log(`   - Has password: ${driver.has_password}`);
      console.log(`   - Status: ${driver.password_status}`);
      console.log('');
    });
    
    const driversWithPasswords = driversResult.rows.filter(d => d.has_password).length;
    console.log(`\n📈 Summary:`);
    console.log(`   - Total drivers: ${driversResult.rows.length}`);
    console.log(`   - Drivers with passwords: ${driversWithPasswords}`);
    console.log(`   - Drivers without passwords: ${driversResult.rows.length - driversWithPasswords}`);
    
  } catch (error) {
    console.error('❌ Error checking drivers table:', error);
  } finally {
    process.exit(0);
  }
}

checkDriversTable(); 