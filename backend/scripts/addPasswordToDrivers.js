const db = require('../config/database');

const addPasswordToDrivers = async () => {
  try {
    console.log('🔧 Adding password column to drivers table...');
    
    // Check if password column already exists
    const checkColumn = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'drivers' AND column_name = 'password'
    `);
    
    if (checkColumn.rows.length > 0) {
      console.log('✅ Password column already exists in drivers table');
      return;
    }
    
    // Add password column
    await db.query(`
      ALTER TABLE drivers 
      ADD COLUMN password VARCHAR(255)
    `);
    
    console.log('✅ Password column added to drivers table successfully');
    
    // Check current drivers
    const drivers = await db.query('SELECT id, name, email FROM drivers');
    console.log(`📊 Found ${drivers.rows.length} drivers in the database`);
    
    if (drivers.rows.length > 0) {
      console.log('📋 Current drivers:');
      drivers.rows.forEach(driver => {
        console.log(`  - ID: ${driver.id}, Name: ${driver.name}, Email: ${driver.email}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error adding password column to drivers:', error);
    throw error;
  }
};

// Run the migration
addPasswordToDrivers()
  .then(() => {
    console.log('✅ Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }); 