const { pool } = require('./config/database');

async function checkTableStructure() {
  try {
    console.log('🔍 CHECKING PARCEL_TRACKING_HISTORY TABLE STRUCTURE\n');
    
    const structureQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'parcel_tracking_history'
      ORDER BY ordinal_position
    `;
    
    const result = await pool.query(structureQuery);
    
    console.log('📋 Table structure:');
    console.log('=====================================');
    result.rows.forEach(row => {
      console.log(`${row.column_name.padEnd(20)} ${row.data_type.padEnd(15)} ${row.is_nullable}`);
    });
    
    console.log('\n✅ TABLE STRUCTURE CHECK COMPLETED!');
    
  } catch (error) {
    console.error('❌ Error checking table structure:', error.message);
  } finally {
    await pool.end();
  }
}

checkTableStructure(); 