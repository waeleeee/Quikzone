const db = require('./config/database');

async function checkDriversStructure() {
  try {
    console.log('🔍 Checking drivers table structure...');
    
    // Check table columns
    const columnsResult = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'drivers' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Drivers table columns:');
    columnsResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });
    
    // Check if there are any drivers
    const driversResult = await db.query('SELECT COUNT(*) as count FROM drivers');
    console.log(`\n🚗 Total drivers: ${driversResult.rows[0].count}`);
    
    // Show sample driver data
    const sampleResult = await db.query('SELECT * FROM drivers LIMIT 1');
    if (sampleResult.rows.length > 0) {
      console.log('\n📦 Sample driver data:');
      console.log(sampleResult.rows[0]);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

checkDriversStructure(); 