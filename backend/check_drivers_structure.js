const db = require('./config/database');

async function checkDriversTable() {
  try {
    console.log('🔍 Checking drivers table structure...');
    
    // Check if drivers table exists
    const tableExists = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'drivers'
      );
    `);
    
    console.log('Drivers table exists:', tableExists.rows[0].exists);
    
    if (tableExists.rows[0].exists) {
      // Get table structure
      const structure = await db.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'drivers'
        ORDER BY ordinal_position;
      `);
      
      console.log('📋 Drivers table structure:');
      structure.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
      });
      
      // Check if there are any drivers
      const driverCount = await db.query('SELECT COUNT(*) as count FROM drivers');
      console.log(`📊 Total drivers in table: ${driverCount.rows[0].count}`);
      
      // Show sample drivers
      const sampleDrivers = await db.query('SELECT id, email, name, status FROM drivers LIMIT 5');
      console.log('👥 Sample drivers:');
      sampleDrivers.rows.forEach(driver => {
        console.log(`  - ID: ${driver.id}, Email: ${driver.email}, Name: ${driver.name}, Status: ${driver.status || 'N/A'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking drivers table:', error);
  } finally {
    process.exit(0);
  }
}

checkDriversTable(); 