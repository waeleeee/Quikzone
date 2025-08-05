const { pool } = require('../config/database');

async function removeSecurityCodeColumn() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 REMOVING SECURITY_CODE COLUMN FROM PICKUP_MISSIONS TABLE\n');
    console.log('='.repeat(60));
    
    // Check if security_code column exists
    const checkColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'pickup_missions' 
      AND column_name = 'security_code'
    `);
    
    if (checkColumn.rows.length === 0) {
      console.log('✅ security_code column does not exist - nothing to remove');
      return;
    }
    
    console.log('🔍 Found security_code column, removing it...');
    
    // Remove the security_code column
    await client.query(`
      ALTER TABLE pickup_missions 
      DROP COLUMN security_code
    `);
    
    console.log('✅ Successfully removed security_code column from pickup_missions table');
    
    // Verify the change
    const verifyColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'pickup_missions' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Current columns in pickup_missions table:');
    verifyColumns.rows.forEach(row => {
      console.log(`  - ${row.column_name}`);
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ SECURITY_CODE COLUMN REMOVAL COMPLETE');
    
  } catch (error) {
    console.error('❌ Error removing security_code column:', error);
  } finally {
    client.release();
  }
}

removeSecurityCodeColumn()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  }); 