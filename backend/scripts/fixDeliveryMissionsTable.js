const db = require('../config/database');

async function fixDeliveryMissionsTable() {
  const client = await db.pool.connect();
  
  try {
    console.log('🔧 Fixing delivery_missions table foreign key...');
    
    // Drop the existing foreign key constraint
    await client.query(`
      ALTER TABLE delivery_missions 
      DROP CONSTRAINT IF EXISTS delivery_missions_driver_id_fkey
    `);
    
    console.log('✅ Dropped existing foreign key constraint');
    
    // Add the correct foreign key constraint to reference drivers table
    await client.query(`
      ALTER TABLE delivery_missions 
      ADD CONSTRAINT delivery_missions_driver_id_fkey 
      FOREIGN KEY (driver_id) REFERENCES drivers(id)
    `);
    
    console.log('✅ Added correct foreign key constraint to drivers table');
    
  } catch (error) {
    console.error('❌ Error fixing delivery_missions table:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the migration
fixDeliveryMissionsTable()
  .then(() => {
    console.log('🎉 Delivery missions table fix completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Delivery missions table fix failed:', error);
    process.exit(1);
  }); 