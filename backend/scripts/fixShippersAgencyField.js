const db = require('../config/database');

const fixShippersAgencyField = async () => {
  try {
    console.log('🔧 Fixing shippers table agency field...');

    // Check if agency_id column exists
    const checkColumn = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'shippers' AND column_name = 'agency_id'
    `);

    if (checkColumn.rows.length > 0) {
      console.log('📋 Removing agency_id foreign key constraint...');
      
      // Drop the foreign key constraint first
      await db.query(`
        ALTER TABLE shippers 
        DROP CONSTRAINT IF EXISTS shippers_agency_id_fkey
      `);

      console.log('📋 Removing agency_id column...');
      await db.query(`
        ALTER TABLE shippers 
        DROP COLUMN IF EXISTS agency_id
      `);
    }

    // Check if agency column exists
    const checkAgencyColumn = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'shippers' AND column_name = 'agency'
    `);

    if (checkAgencyColumn.rows.length === 0) {
      console.log('📋 Adding agency column...');
      await db.query(`
        ALTER TABLE shippers 
        ADD COLUMN agency VARCHAR(50)
      `);
    }

    console.log('✅ Shippers table agency field fixed successfully!');
    
    // Show the current structure
    const result = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'shippers' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Current shippers table structure:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing shippers table:', error);
    process.exit(1);
  }
};

fixShippersAgencyField(); 