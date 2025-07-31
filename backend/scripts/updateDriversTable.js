const db = require('../config/database');

const updateDriversTable = async () => {
  try {
    console.log('🔧 Updating drivers table with new fields...');
    
    // Add new columns to drivers table
    const newColumns = [
      'cin_number VARCHAR(20)',
      'driving_license VARCHAR(50)',
      'car_number VARCHAR(20)',
      'car_type VARCHAR(100)',
      'insurance_number VARCHAR(50)',
      'agency VARCHAR(50)',
      'photo_url TEXT',
      'personal_documents_url TEXT',
      'car_documents_url TEXT'
    ];

    for (const column of newColumns) {
      try {
        const columnName = column.split(' ')[0];
        await db.query(`ALTER TABLE drivers ADD COLUMN IF NOT EXISTS ${columnName} ${column.split(' ').slice(1).join(' ')}`);
        console.log(`✅ Added column: ${columnName}`);
      } catch (error) {
        if (error.code === '42701') { // Column already exists
          console.log(`⚠️ Column already exists: ${column.split(' ')[0]}`);
        } else {
          console.error(`❌ Error adding column ${column.split(' ')[0]}:`, error.message);
        }
      }
    }

    console.log('✅ Drivers table updated successfully');
    
    // Show the updated table structure
    const result = await db.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'drivers'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Updated drivers table structure:');
    result.rows.forEach(row => {
      console.log(`${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });

  } catch (error) {
    console.error('❌ Error updating drivers table:', error);
  } finally {
    process.exit(0);
  }
};

updateDriversTable(); 