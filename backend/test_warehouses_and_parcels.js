const db = require('./config/database');

async function testData() {
  try {
    console.log('🔍 Testing warehouses and parcels data...');
    
    // Test warehouses
    console.log('\n🏢 Testing warehouses...');
    const warehousesResult = await db.query('SELECT * FROM warehouses');
    console.log(`Found ${warehousesResult.rows.length} warehouses:`);
    warehousesResult.rows.forEach(w => {
      console.log(`  - ID: ${w.id}, Name: ${w.name}`);
    });
    
    // Test parcels with status 'au_depot'
    console.log('\n📦 Testing parcels with status "au_depot"...');
    const parcelsResult = await db.query(`
      SELECT p.*, s.name as client_name
      FROM parcels p
      JOIN shippers s ON p.shipper_id = s.id
      WHERE p.status = 'au_depot'
      ORDER BY p.created_at DESC
      LIMIT 5
    `);
    console.log(`Found ${parcelsResult.rows.length} parcels with status "au_depot":`);
    parcelsResult.rows.forEach(p => {
      console.log(`  - ID: ${p.id}, Tracking: ${p.tracking_number}, Client: ${p.client_name}, Status: ${p.status}`);
    });
    
    // Test all parcel statuses
    console.log('\n📊 All parcel statuses:');
    const statusResult = await db.query(`
      SELECT status, COUNT(*) as count
      FROM parcels
      GROUP BY status
      ORDER BY status
    `);
    statusResult.rows.forEach(row => {
      console.log(`  - ${row.status}: ${row.count} parcels`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

testData(); 