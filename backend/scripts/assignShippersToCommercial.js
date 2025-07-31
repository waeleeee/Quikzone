const db = require('../config/database');

const assignShippersToCommercial = async () => {
  try {
    console.log('🔗 Assigning shippers to Wael Commercial...');
    
    // Get Wael Commercial ID
    const commercialResult = await db.query(
      'SELECT id FROM commercials WHERE email = $1',
      ['wael_commercial@quickzone.tn']
    );
    
    if (commercialResult.rows.length === 0) {
      console.log('❌ Wael Commercial not found');
      return;
    }
    
    const waelCommercialId = commercialResult.rows[0].id;
    console.log(`✅ Found Wael Commercial with ID: ${waelCommercialId}`);
    
    // Update all shippers to be assigned to Wael Commercial
    const updateResult = await db.query(`
      UPDATE shippers 
      SET commercial_id = $1, updated_at = CURRENT_TIMESTAMP
      WHERE commercial_id IS NULL
    `, [waelCommercialId]);
    
    console.log(`✅ Updated ${updateResult.rowCount} shippers to be assigned to Wael Commercial`);
    
    // Verify the assignment
    const shippersResult = await db.query(`
      SELECT id, name, email, commercial_id 
      FROM shippers 
      WHERE commercial_id = $1
    `, [waelCommercialId]);
    
    console.log('📦 Shippers assigned to Wael Commercial:');
    shippersResult.rows.forEach(shipper => {
      console.log(`  - ${shipper.name} (${shipper.email})`);
    });
    
    // Update commercial's clients_count
    const clientsCount = shippersResult.rows.length;
    await db.query(`
      UPDATE commercials 
      SET clients_count = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [clientsCount, waelCommercialId]);
    
    console.log(`✅ Updated Wael Commercial's clients_count to ${clientsCount}`);
    
    console.log('✅ Shippers assignment completed successfully!');
    
  } catch (error) {
    console.error('❌ Error assigning shippers:', error);
  } finally {
    process.exit(0);
  }
};

assignShippersToCommercial(); 