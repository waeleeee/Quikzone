const { pool } = require('./config/database');

async function checkPickupMissionsTable() {
  const client = await pool.connect();
  try {
    console.log('🔍 CHECKING PICKUP_MISSIONS TABLE STRUCTURE\n');
    
    // Check table columns
    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'pickup_missions' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Pickup missions table columns:');
    columnsResult.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Check sample data
    const sampleData = await client.query(`
      SELECT * FROM pickup_missions LIMIT 3
    `);
    
    console.log('\n📊 Sample pickup missions data:');
    sampleData.rows.forEach((mission, index) => {
      console.log(`\nMission ${index + 1}:`);
      Object.keys(mission).forEach(key => {
        console.log(`  ${key}: ${mission[key]}`);
      });
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

checkPickupMissionsTable();













