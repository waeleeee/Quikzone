const db = require('../config/database');

const addWarehouseToParcels = async () => {
  try {
    console.log('🚀 Adding warehouse relationship to parcels table...');

    // Step 1: Add warehouse_id column to parcels table
    console.log('📋 Adding warehouse_id column to parcels table...');
    
    // Check if columns already exist
    const columnsResult = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'parcels' 
      AND column_name IN ('warehouse_id', 'agency')
    `);
    
    const existingColumns = columnsResult.rows.map(row => row.column_name);
    
    if (!existingColumns.includes('warehouse_id')) {
      await db.query('ALTER TABLE parcels ADD COLUMN warehouse_id INTEGER');
      console.log('✅ Added warehouse_id column');
    } else {
      console.log('ℹ️ warehouse_id column already exists');
    }
    
    if (!existingColumns.includes('agency')) {
      await db.query('ALTER TABLE parcels ADD COLUMN agency VARCHAR(50)');
      console.log('✅ Added agency column');
    } else {
      console.log('ℹ️ agency column already exists');
    }

    // Step 2: Add foreign key constraint
    console.log('🔗 Adding foreign key constraint...');
    
    // Check if constraint already exists
    const constraintsResult = await db.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'parcels' 
      AND constraint_name = 'fk_parcels_warehouse'
    `);
    
    if (constraintsResult.rows.length === 0) {
      await db.query(`
        ALTER TABLE parcels 
        ADD CONSTRAINT fk_parcels_warehouse 
        FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
      `);
      console.log('✅ Added foreign key constraint');
    } else {
      console.log('ℹ️ Foreign key constraint already exists');
    }

    // Step 3: Add index for better performance
    console.log('📊 Adding index for warehouse_id...');
    
    // Check if index already exists
    const warehouseIndexResult = await db.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'parcels' 
      AND indexname = 'idx_parcels_warehouse'
    `);
    
    if (warehouseIndexResult.rows.length === 0) {
      await db.query('CREATE INDEX idx_parcels_warehouse ON parcels(warehouse_id)');
      console.log('✅ Added warehouse_id index');
    } else {
      console.log('ℹ️ warehouse_id index already exists');
    }

    // Step 4: Add index for agency
    console.log('📊 Adding index for agency...');
    
    const agencyIndexResult = await db.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'parcels' 
      AND indexname = 'idx_parcels_agency'
    `);
    
    if (agencyIndexResult.rows.length === 0) {
      await db.query('CREATE INDEX idx_parcels_agency ON parcels(agency)');
      console.log('✅ Added agency index');
    } else {
      console.log('ℹ️ agency index already exists');
    }

    console.log('✅ Warehouse relationship added successfully!');
    
    // Step 5: Show current warehouses
    console.log('\n🏢 Current warehouses in system:');
    const warehousesResult = await db.query('SELECT id, name, governorate FROM warehouses WHERE status = \'Actif\'');
    console.table(warehousesResult.rows);

    // Step 6: Show sample parcels with their shippers
    console.log('\n📦 Sample parcels and their shippers:');
    const parcelsResult = await db.query(`
      SELECT p.id, p.tracking_number, p.status, p.warehouse_id, p.agency,
             s.name as shipper_name, s.agency as shipper_agency
      FROM parcels p
      LEFT JOIN shippers s ON p.shipper_id = s.id
      LIMIT 10
    `);
    console.table(parcelsResult.rows);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding warehouse relationship:', error);
    process.exit(1);
  }
};

addWarehouseToParcels(); 