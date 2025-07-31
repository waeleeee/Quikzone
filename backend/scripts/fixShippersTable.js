const db = require('../config/database');

const fixShippersTable = async () => {
  try {
    console.log('🔧 Checking and fixing shippers table structure...');
    
    // Check current table structure
    const tableInfo = await db.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'shippers' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Current shippers table structure:');
    tableInfo.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
    });
    
    // Check if we need to add missing columns
    const existingColumns = tableInfo.rows.map(col => col.column_name);
    
    // Add missing columns if they don't exist
    if (!existingColumns.includes('pending_parcels')) {
      console.log('➕ Adding pending_parcels column...');
      await db.query('ALTER TABLE shippers ADD COLUMN pending_parcels INTEGER DEFAULT 0');
    }
    
    if (!existingColumns.includes('total_revenue')) {
      console.log('➕ Adding total_revenue column...');
      await db.query('ALTER TABLE shippers ADD COLUMN total_revenue DECIMAL(10,2) DEFAULT 0');
    }
    
    if (!existingColumns.includes('total_paid')) {
      console.log('➕ Adding total_paid column...');
      await db.query('ALTER TABLE shippers ADD COLUMN total_paid DECIMAL(10,2) DEFAULT 0');
    }
    
    if (!existingColumns.includes('tax_number')) {
      console.log('➕ Adding tax_number column...');
      await db.query('ALTER TABLE shippers ADD COLUMN tax_number VARCHAR(20)');
    }
    
    if (!existingColumns.includes('commercial_register')) {
      console.log('➕ Adding commercial_register column...');
      await db.query('ALTER TABLE shippers ADD COLUMN commercial_register VARCHAR(20)');
    }
    
    if (!existingColumns.includes('city')) {
      console.log('➕ Adding city column...');
      await db.query('ALTER TABLE shippers ADD COLUMN city VARCHAR(50)');
    }
    
    if (!existingColumns.includes('commercial_id')) {
      console.log('➕ Adding commercial_id column...');
      await db.query('ALTER TABLE shippers ADD COLUMN commercial_id INTEGER REFERENCES commercials(id)');
    }
    
    console.log('✅ Shippers table structure check completed!');
    
  } catch (error) {
    console.error('❌ Error fixing shippers table:', error);
  } finally {
    process.exit(0);
  }
};

fixShippersTable(); 