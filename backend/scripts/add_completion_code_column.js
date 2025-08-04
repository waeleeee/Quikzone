const { pool } = require('../config/database');

async function addCompletionCodeColumn() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Adding completion_code column to pickup_missions table...');
    
    // Check if column already exists
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'pickup_missions' 
      AND column_name = 'completion_code'
    `;
    
    const checkResult = await client.query(checkColumnQuery);
    
    if (checkResult.rows.length > 0) {
      console.log('✅ completion_code column already exists');
      return;
    }
    
    // Add the completion_code column
    const addColumnQuery = `
      ALTER TABLE pickup_missions 
      ADD COLUMN completion_code VARCHAR(10)
    `;
    
    await client.query(addColumnQuery);
    console.log('✅ completion_code column added successfully');
    
  } catch (error) {
    console.error('❌ Error adding completion_code column:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the migration
addCompletionCodeColumn()
  .then(() => {
    console.log('🎉 Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  }); 