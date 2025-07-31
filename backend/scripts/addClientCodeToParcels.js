const db = require('../config/database');

async function addClientCodeToParcels() {
  try {
    console.log('🔧 Adding client_code column to parcels table...');
    
    // Add the client_code column
    await db.query(`
      ALTER TABLE parcels 
      ADD COLUMN IF NOT EXISTS client_code VARCHAR(10) UNIQUE
    `);
    
    console.log('✅ client_code column added successfully');
    
    // Generate client codes for existing parcels that don't have one
    console.log('🔧 Generating client codes for existing parcels...');
    
    const result = await db.query(`
      SELECT id, tracking_number 
      FROM parcels 
      WHERE client_code IS NULL OR client_code = ''
    `);
    
    console.log(`📦 Found ${result.rows.length} parcels without client codes`);
    
    for (const parcel of result.rows) {
      // Generate a unique 6-digit client code
      const clientCode = generateClientCode();
      
      await db.query(`
        UPDATE parcels 
        SET client_code = $1 
        WHERE id = $2
      `, [clientCode, parcel.id]);
      
      console.log(`✅ Generated client code ${clientCode} for parcel ${parcel.tracking_number}`);
    }
    
    console.log('🎉 Client code migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during client code migration:', error);
    throw error;
  }
}

function generateClientCode() {
  // Generate a 6-digit numeric code
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Run the migration if this file is executed directly
if (require.main === module) {
  addClientCodeToParcels()
    .then(() => {
      console.log('✅ Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { addClientCodeToParcels, generateClientCode }; 