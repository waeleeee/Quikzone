const { query } = require('./config/database');

async function checkDrivers() {
  try {
    console.log('🔍 CHECKING DRIVERS ISSUE...\n');
    
    // Check all drivers without status filter
    const allDrivers = await query(`
      SELECT id, name, email, agency, status
      FROM drivers
      ORDER BY agency, name
    `);
    
    console.log('🚚 ALL DRIVERS (no filter):', JSON.stringify(allDrivers.rows, null, 2));
    
    // Check drivers table structure
    const tableInfo = await query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'drivers'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 DRIVERS TABLE STRUCTURE:', JSON.stringify(tableInfo.rows, null, 2));
    
    // Check if there are any drivers at all
    const driverCount = await query(`
      SELECT COUNT(*) as total_drivers
      FROM drivers
    `);
    
    console.log('📊 TOTAL DRIVERS COUNT:', driverCount.rows[0]);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

checkDrivers();













