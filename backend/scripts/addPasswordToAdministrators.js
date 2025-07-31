const db = require('../config/database');

const addPasswordToAdministrators = async () => {
  try {
    console.log('🔧 Adding password column to administrators table...');
    
    // Check if password column already exists
    const checkColumn = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'administrators' AND column_name = 'password'
    `);
    
    if (checkColumn.rows.length === 0) {
      // Add password column
      await db.query(`
        ALTER TABLE administrators 
        ADD COLUMN password VARCHAR(255)
      `);
      console.log('✅ Password column added to administrators table');
    } else {
      console.log('ℹ️ Password column already exists in administrators table');
    }
    
    console.log('✅ Migration completed successfully');
  } catch (error) {
    console.error('❌ Error adding password column:', error);
  } finally {
    process.exit(0);
  }
};

addPasswordToAdministrators(); 