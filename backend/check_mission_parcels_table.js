const { pool } = require('./config/database');

async function checkMissionParcelsTable() {
  const client = await pool.connect();
  try {
    console.log('🔍 CHECKING MISSION_PARCELS TABLE STRUCTURE\n');
    
    // Check table columns
    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'mission_parcels' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Mission parcels table columns:');
    columnsResult.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Check sample data
    const sampleData = await client.query(`
      SELECT * FROM mission_parcels LIMIT 3
    `);
    
    console.log('\n📊 Sample mission parcels data:');
    sampleData.rows.forEach((parcel, index) => {
      console.log(`\nParcel ${index + 1}:`);
      Object.keys(parcel).forEach(key => {
        console.log(`  ${key}: ${parcel[key]}`);
      });
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

checkMissionParcelsTable();













