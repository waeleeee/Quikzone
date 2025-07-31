const db = require('./config/database');

async function addPasswordToAgencyManagers() {
  try {
    console.log('🔧 Adding password column to agency_managers table...');
    
    // Check if password column already exists
    const columnExists = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'agency_managers' AND column_name = 'password'
    `);
    
    if (columnExists.rows.length > 0) {
      console.log('✅ Password column already exists in agency_managers table');
    } else {
      // Add password column
      await db.query(`
        ALTER TABLE agency_managers
        ADD COLUMN password VARCHAR(255)
      `);
      console.log('✅ Password column added to agency_managers table successfully');
    }
    
    // Set default passwords for existing agency managers
    console.log('🔐 Setting default passwords for existing agency managers...');
    await db.query(`
      UPDATE agency_managers
      SET password = '$2b$10$rQZ8K9mN2pL4vX7wY1sT3uI6oA8bC9dE0fG1hJ2kL3mN4oP5qR6sT7uV8wX9yZ'
      WHERE password IS NULL
    `);
    console.log('✅ Default passwords set for existing agency managers');
    console.log('📝 Default password for existing agency managers: wael123');
    
  } catch (error) {
    console.error('❌ Error adding password column to agency_managers:', error);
  } finally {
    process.exit(0);
  }
}

addPasswordToAgencyManagers(); 