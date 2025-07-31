const db = require('../config/database');
const bcrypt = require('bcrypt');

const getShipperLogins = async () => {
  try {
    console.log('🔍 Getting all shipper login information...\n');
    
    // Get all shippers
    const shippersResult = await db.query(`
      SELECT id, name, email, company, status 
      FROM shippers 
      ORDER BY name
    `);
    
    console.log('📧 SHIPPER LOGIN INFORMATION:');
    console.log('=====================================');
    
    shippersResult.rows.forEach((shipper, index) => {
      console.log(`${index + 1}. ${shipper.name}`);
      console.log(`   📧 Email: ${shipper.email}`);
      console.log(`   🏢 Company: ${shipper.company}`);
      console.log(`   📊 Status: ${shipper.status}`);
      console.log(`   🔑 Password: wael123`);
      console.log('');
    });
    
    console.log(`✅ Total shippers found: ${shippersResult.rows.length}`);
    
    // Ask if user wants to reset passwords
    console.log('\n🔄 Do you want to reset all shipper passwords to "wael123"? (y/n)');
    
    // For now, let's just show the information
    console.log('\n💡 To reset passwords, run the resetShipperPasswords.js script');
    
  } catch (error) {
    console.error('❌ Error getting shipper logins:', error);
  } finally {
    process.exit(0);
  }
};

getShipperLogins(); 