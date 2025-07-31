const db = require('../config/database');

async function addAddressAndGovernorateColumns() {
  const client = await db.pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🔧 Adding address and governorate columns to shippers table...');
    
    // Check if address column exists
    const addressExists = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'shippers' AND column_name = 'address'
    `);
    
    if (addressExists.rows.length === 0) {
      console.log('➕ Adding address column...');
      await client.query('ALTER TABLE shippers ADD COLUMN address TEXT');
      console.log('✅ Address column added successfully');
    } else {
      console.log('ℹ️ Address column already exists');
    }
    
    // Check if governorate column exists
    const governorateExists = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'shippers' AND column_name = 'governorate'
    `);
    
    if (governorateExists.rows.length === 0) {
      console.log('➕ Adding governorate column...');
      await client.query('ALTER TABLE shippers ADD COLUMN governorate VARCHAR(100)');
      console.log('✅ Governorate column added successfully');
    } else {
      console.log('ℹ️ Governorate column already exists');
    }
    
    // Check if page_name column exists
    const pageNameExists = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'shippers' AND column_name = 'page_name'
    `);
    
    if (pageNameExists.rows.length === 0) {
      console.log('➕ Adding page_name column...');
      await client.query('ALTER TABLE shippers ADD COLUMN page_name VARCHAR(255)');
      console.log('✅ Page name column added successfully');
    } else {
      console.log('ℹ️ Page name column already exists');
    }
    
    await client.query('COMMIT');
    console.log('🎉 Database migration completed successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error during migration:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the migration
addAddressAndGovernorateColumns()
  .then(() => {
    console.log('✅ Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }); 