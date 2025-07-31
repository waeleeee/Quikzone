const db = require('./config/database');

async function removeSampleParcels() {
  try {
    console.log('🗑️ Removing sample parcels (IDs 223-227)...');
    
    // Delete the sample parcels I added
    const deleteQuery = `
      DELETE FROM parcels 
      WHERE id IN (223, 224, 225, 226, 227)
      RETURNING id, tracking_number, status
    `;
    
    const result = await db.query(deleteQuery);
    
    console.log('✅ Deleted parcels:');
    result.rows.forEach(row => {
      console.log(`  - ID ${row.id}: ${row.tracking_number} (${row.status})`);
    });
    
    console.log(`🎉 Successfully deleted ${result.rows.length} sample parcels`);
    
    // Show remaining parcels for Hassa ya ghaly
    const remainingQuery = `
      SELECT p.id, p.tracking_number, p.destination, p.status, p.price, s.name as shipper_name
      FROM parcels p
      LEFT JOIN shippers s ON p.shipper_id = s.id
      WHERE s.name ILIKE $1
      ORDER BY p.id
    `;
    
    const remainingResult = await db.query(remainingQuery, ['%Hassa ya ghaly%']);
    
    console.log('\n📦 Remaining parcels for Hassa ya ghaly:');
    remainingResult.rows.forEach(row => {
      console.log(`  ${row.id}. ${row.tracking_number} - ${row.destination} - ${row.status} - ${row.price}€`);
    });
    
  } catch (error) {
    console.error('❌ Error removing sample parcels:', error);
  } finally {
    process.exit(0);
  }
}

removeSampleParcels(); 