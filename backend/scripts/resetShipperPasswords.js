const db = require('../config/database');
const bcrypt = require('bcrypt');

const resetShipperPasswords = async () => {
  try {
    console.log('🔐 Resetting all shipper passwords to "wael123"...\n');
    
    // Hash the password
    const passwordHash = await bcrypt.hash('wael123', 10);
    
    // Get all shippers first
    const shippersResult = await db.query(`
      SELECT id, name, email 
      FROM shippers 
      ORDER BY name
    `);
    
    console.log(`📦 Found ${shippersResult.rows.length} shippers to update`);
    
    // Update each shipper's password
    let updatedCount = 0;
    for (const shipper of shippersResult.rows) {
      try {
        await db.query(`
          UPDATE shippers 
          SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [passwordHash, shipper.id]);
        
        console.log(`✅ Updated password for: ${shipper.name} (${shipper.email})`);
        updatedCount++;
      } catch (error) {
        console.error(`❌ Error updating ${shipper.name}:`, error.message);
      }
    }
    
    console.log(`\n🎉 Successfully updated ${updatedCount} out of ${shippersResult.rows.length} shippers`);
    console.log('🔑 All passwords are now set to: wael123');
    
    // Show the login information
    console.log('\n📧 UPDATED SHIPPER LOGIN INFORMATION:');
    console.log('=====================================');
    
    shippersResult.rows.forEach((shipper, index) => {
      console.log(`${index + 1}. ${shipper.name}`);
      console.log(`   📧 Email: ${shipper.email}`);
      console.log(`   🔑 Password: wael123`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error resetting shipper passwords:', error);
  } finally {
    process.exit(0);
  }
};

resetShipperPasswords(); 