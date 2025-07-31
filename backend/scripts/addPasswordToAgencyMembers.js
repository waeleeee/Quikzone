const db = require('../config/database');

const addPasswordToAgencyMembers = async () => {
  try {
    console.log('🔧 Adding password column to agency_members table...');
    
    // Check if password column already exists
    const checkColumn = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'agency_members' AND column_name = 'password'
    `);
    
    if (checkColumn.rows.length > 0) {
      console.log('✅ Password column already exists in agency_members table');
      return;
    }
    
    // Add password column
    await db.query(`
      ALTER TABLE agency_members 
      ADD COLUMN password VARCHAR(255)
    `);
    
    console.log('✅ Password column added to agency_members table successfully');
    
    // Check current agency members
    const members = await db.query('SELECT id, name, email FROM agency_members');
    console.log(`📊 Found ${members.rows.length} agency members in the database`);
    
    if (members.rows.length > 0) {
      console.log('📋 Current agency members:');
      members.rows.forEach(member => {
        console.log(`  - ID: ${member.id}, Name: ${member.name}, Email: ${member.email}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error adding password column to agency_members:', error);
    throw error;
  }
};

// Run the migration
addPasswordToAgencyMembers()
  .then(() => {
    console.log('✅ Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }); 