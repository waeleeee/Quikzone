const db = require('./config/database');

const checkCommercialUsers = async () => {
  try {
    console.log('🔍 Checking commercial users in the system...\n');
    
    // Get all commercial users
    const commercialsResult = await db.query(`
      SELECT id, name, email, phone, status, created_at
      FROM commercials 
      ORDER BY created_at DESC
    `);
    
    console.log(`📊 Total commercial users found: ${commercialsResult.rows.length}`);
    
    if (commercialsResult.rows.length > 0) {
      console.log('\n👥 Commercial Users:');
      commercialsResult.rows.forEach((commercial, index) => {
        console.log(`  ${index + 1}. ${commercial.name} (${commercial.email})`);
        console.log(`     ID: ${commercial.id}`);
        console.log(`     Phone: ${commercial.phone}`);
        console.log(`     Status: ${commercial.status}`);
        console.log(`     Created: ${commercial.created_at}`);
        console.log('');
      });
    } else {
      console.log('❌ No commercial users found in the system');
    }
    
    // Check if there are any shippers assigned to commercials
    const shippersWithCommercialResult = await db.query(`
      SELECT s.id, s.name, s.email, s.commercial_id, c.name as commercial_name
      FROM shippers s
      LEFT JOIN commercials c ON s.commercial_id = c.id
      WHERE s.commercial_id IS NOT NULL
      ORDER BY s.commercial_id, s.name
    `);
    
    console.log(`📦 Shippers assigned to commercials: ${shippersWithCommercialResult.rows.length}`);
    
    if (shippersWithCommercialResult.rows.length > 0) {
      console.log('\n📋 Shippers by Commercial:');
      let currentCommercial = null;
      shippersWithCommercialResult.rows.forEach((shipper) => {
        if (currentCommercial !== shipper.commercial_id) {
          currentCommercial = shipper.commercial_id;
          console.log(`\n  Commercial: ${shipper.commercial_name} (ID: ${shipper.commercial_id})`);
        }
        console.log(`    - ${shipper.name} (${shipper.email})`);
      });
    } else {
      console.log('❌ No shippers are assigned to commercials');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

checkCommercialUsers(); 