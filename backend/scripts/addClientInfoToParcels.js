const db = require('../config/database');

const addClientInfoToParcels = async () => {
  try {
    console.log('🔧 Adding client information columns to parcels table...');

    // Add client information columns to parcels table
    await db.query(`
      ALTER TABLE parcels 
      ADD COLUMN IF NOT EXISTS recipient_name VARCHAR(100),
      ADD COLUMN IF NOT EXISTS recipient_phone VARCHAR(20),
      ADD COLUMN IF NOT EXISTS recipient_phone2 VARCHAR(20),
      ADD COLUMN IF NOT EXISTS recipient_address TEXT,
      ADD COLUMN IF NOT EXISTS recipient_governorate VARCHAR(50)
    `);

    console.log('✅ Client information columns added successfully to parcels table!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to add client information columns:', error);
    process.exit(1);
  }
};

addClientInfoToParcels(); 