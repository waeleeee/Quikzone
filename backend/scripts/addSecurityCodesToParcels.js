const db = require('../config/database');

async function addSecurityCodesToParcels() {
  const client = await db.pool.connect();
  
  try {
    console.log('🔧 Adding security code fields to parcels table...');
    
    // Add client_code and failed_code columns to parcels table
    await client.query(`
      ALTER TABLE parcels 
      ADD COLUMN IF NOT EXISTS client_code VARCHAR(10),
      ADD COLUMN IF NOT EXISTS failed_code VARCHAR(10)
    `);
    
    console.log('✅ Security code fields added successfully');
    
    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_parcels_client_code ON parcels(client_code);
      CREATE INDEX IF NOT EXISTS idx_parcels_failed_code ON parcels(failed_code);
    `);
    
    console.log('✅ Indexes created successfully');
    
    // Update existing parcels with random security codes (for testing)
    const updateResult = await client.query(`
      UPDATE parcels 
      SET client_code = SUBSTRING(MD5(RANDOM()::TEXT), 1, 6),
          failed_code = SUBSTRING(MD5(RANDOM()::TEXT), 1, 6)
      WHERE client_code IS NULL OR failed_code IS NULL
    `);
    
    console.log(`✅ Updated ${updateResult.rowCount} parcels with security codes`);
    
  } catch (error) {
    console.error('❌ Error adding security codes:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the migration
addSecurityCodesToParcels()
  .then(() => {
    console.log('🎉 Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  }); 