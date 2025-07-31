const db = require('./config/database');

async function checkComplaintsTable() {
  try {
    console.log('🔍 Checking complaints table structure...');
    
    const result = await db.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'complaints' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Complaints table columns:');
    result.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.column_name} (${row.data_type}) - ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // Also check if there are any complaints
    const countResult = await db.query('SELECT COUNT(*) FROM complaints');
    console.log(`\n📊 Total complaints: ${countResult.rows[0].count}`);
    
    // Show a sample complaint
    const sampleResult = await db.query('SELECT * FROM complaints LIMIT 1');
    if (sampleResult.rows.length > 0) {
      console.log('\n📝 Sample complaint:');
      console.log(JSON.stringify(sampleResult.rows[0], null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit();
  }
}

checkComplaintsTable(); 