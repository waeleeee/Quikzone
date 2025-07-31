const db = require('../config/database');

async function fixMissionStatusLength() {
  try {
    console.log('🔧 Starting mission status column fix...');
    
    // First, let's check the current table structure
    const checkQuery = `
      SELECT column_name, data_type, character_maximum_length 
      FROM information_schema.columns 
      WHERE table_name = 'pickup_missions' AND column_name = 'status'
    `;
    
    const checkResult = await db.query(checkQuery);
    console.log('📋 Current status column info:', checkResult.rows[0]);
    
    // Update the status column to VARCHAR(50) to accommodate longer status names
    const alterQuery = `
      ALTER TABLE pickup_missions 
      ALTER COLUMN status TYPE VARCHAR(50)
    `;
    
    console.log('🔧 Executing ALTER TABLE query...');
    await db.query(alterQuery);
    console.log('✅ Status column updated to VARCHAR(50)');
    
    // Remove the old CHECK constraint that was limiting status values
    const dropConstraintQuery = `
      ALTER TABLE pickup_missions 
      DROP CONSTRAINT IF EXISTS pickup_missions_status_check
    `;
    
    console.log('🔧 Dropping old CHECK constraint...');
    await db.query(dropConstraintQuery);
    console.log('✅ Old CHECK constraint removed');
    
    // Add a new CHECK constraint with our new status values
    const addConstraintQuery = `
      ALTER TABLE pickup_missions 
      ADD CONSTRAINT pickup_missions_status_check 
      CHECK (status IN (
        'En attente', 
        'Accepté par livreur', 
        'Refusé par livreur', 
        'En cours de ramassage', 
        'Ramassage terminé', 
        'Mission terminée',
        'scheduled', 
        'in_progress', 
        'completed', 
        'cancelled'
      ))
    `;
    
    console.log('🔧 Adding new CHECK constraint...');
    await db.query(addConstraintQuery);
    console.log('✅ New CHECK constraint added');
    
    // Verify the changes
    const verifyQuery = `
      SELECT column_name, data_type, character_maximum_length 
      FROM information_schema.columns 
      WHERE table_name = 'pickup_missions' AND column_name = 'status'
    `;
    
    const verifyResult = await db.query(verifyQuery);
    console.log('📋 Updated status column info:', verifyResult.rows[0]);
    
    console.log('🎉 Mission status column fix completed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing mission status column:', error);
    throw error;
  } finally {
    await db.end();
  }
}

// Run the migration
fixMissionStatusLength()
  .then(() => {
    console.log('✅ Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }); 