const db = require('../config/database');

async function addComplaintsColumns() {
  try {
    console.log('🔧 Adding missing columns to complaints table...\n');
    
    // Add missing columns to complaints table
    const columns = [
      'ADD COLUMN IF NOT EXISTS parcel_id INTEGER REFERENCES parcels(id)',
      'ADD COLUMN IF NOT EXISTS attachments JSONB',
      'ADD COLUMN IF NOT EXISTS order_number VARCHAR(50)',
      'ADD COLUMN IF NOT EXISTS resolution_notes TEXT',
      'ADD COLUMN IF NOT EXISTS phone VARCHAR(20)'
    ];
    
    for (const column of columns) {
      try {
        await db.query(`ALTER TABLE complaints ${column}`);
        console.log(`✅ Added column: ${column.split(' ')[3]}`);
      } catch (error) {
        console.log(`⚠️  Column already exists or error: ${column.split(' ')[3]} - ${error.message}`);
      }
    }
    
    console.log('\n✅ Complaints table updated successfully');
    
  } catch (error) {
    console.error('❌ Error updating complaints table:', error);
  } finally {
    process.exit();
  }
}

addComplaintsColumns(); 