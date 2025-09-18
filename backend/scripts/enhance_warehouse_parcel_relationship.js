const db = require('../config/database');

const enhanceWarehouseParcelRelationship = async () => {
  try {
    console.log('🚀 Enhancing warehouse-parcel relationship system...');

    // Step 1: Ensure warehouse_id column exists in parcels table
    console.log('📋 Checking warehouse_id column in parcels table...');
    
    const columnsResult = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'parcels' 
      AND column_name = 'warehouse_id'
    `);
    
    if (columnsResult.rows.length === 0) {
      console.log('➕ Adding warehouse_id column to parcels table...');
      await db.query('ALTER TABLE parcels ADD COLUMN warehouse_id INTEGER');
      console.log('✅ warehouse_id column added');
    } else {
      console.log('ℹ️ warehouse_id column already exists');
    }

    // Step 2: Add foreign key constraint if it doesn't exist
    console.log('🔗 Checking foreign key constraint...');
    
    const constraintsResult = await db.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'parcels' 
      AND constraint_name = 'fk_parcels_warehouse'
    `);
    
    if (constraintsResult.rows.length === 0) {
      console.log('➕ Adding foreign key constraint...');
      await db.query(`
        ALTER TABLE parcels 
        ADD CONSTRAINT fk_parcels_warehouse 
        FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
      `);
      console.log('✅ Foreign key constraint added');
    } else {
      console.log('ℹ️ Foreign key constraint already exists');
    }

    // Step 3: Add warehouse_id column to shippers table for default warehouse
    console.log('📋 Checking default_warehouse_id column in shippers table...');
    
    const shipperColumnsResult = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'shippers' 
      AND column_name = 'default_warehouse_id'
    `);
    
    if (shipperColumnsResult.rows.length === 0) {
      console.log('➕ Adding default_warehouse_id column to shippers table...');
      await db.query('ALTER TABLE shippers ADD COLUMN default_warehouse_id INTEGER');
      console.log('✅ default_warehouse_id column added');
      
      // Add foreign key constraint for shippers
      await db.query(`
        ALTER TABLE shippers 
        ADD CONSTRAINT fk_shippers_default_warehouse 
        FOREIGN KEY (default_warehouse_id) REFERENCES warehouses(id)
      `);
      console.log('✅ Foreign key constraint for shippers added');
    } else {
      console.log('ℹ️ default_warehouse_id column already exists');
    }

    // Step 4: Create agency-warehouse mapping and update shippers
    console.log('🗺️ Creating agency-warehouse mapping...');
    
    const agencyWarehouseMapping = {
      'Sousse': 11, // Entrepôt Sousse
      'Tunis': 10,  // Entrepôt Tunis Central
      'Sfax': 12,   // Entrepôt Sfax
      'Tozeur': 13, // Entrepôt Tozeur
      'Béja': 14    // Entrepôt Béja
    };

    // Update shippers with default warehouse based on agency
    console.log('📦 Updating shippers with default warehouses...');
    
    const updateShippersResult = await db.query(`
      UPDATE shippers 
      SET default_warehouse_id = CASE 
        WHEN agency = 'Sousse' THEN 11
        WHEN agency = 'Tunis' THEN 10
        WHEN agency = 'Sfax' THEN 12
        WHEN agency = 'Tozeur' THEN 13
        WHEN agency = 'Béja' THEN 14
        ELSE NULL
      END
      WHERE default_warehouse_id IS NULL AND agency IS NOT NULL
    `);

    console.log(`✅ Updated ${updateShippersResult.rowCount} shippers with default warehouses`);

    // Step 5: Update existing parcels with warehouse assignments
    console.log('📦 Updating existing parcels with warehouse assignments...');
    
    const updateParcelsResult = await db.query(`
      UPDATE parcels 
      SET warehouse_id = s.default_warehouse_id
      FROM shippers s
      WHERE parcels.shipper_id = s.id
      AND parcels.warehouse_id IS NULL
      AND s.default_warehouse_id IS NOT NULL
    `);

    console.log(`✅ Updated ${updateParcelsResult.rowCount} parcels with warehouse assignments`);

    // Step 6: Create indexes for better performance
    console.log('📊 Creating indexes for better performance...');
    
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_parcels_warehouse_id ON parcels(warehouse_id)',
      'CREATE INDEX IF NOT EXISTS idx_parcels_status_warehouse ON parcels(status, warehouse_id)',
      'CREATE INDEX IF NOT EXISTS idx_shippers_default_warehouse ON shippers(default_warehouse_id)',
      'CREATE INDEX IF NOT EXISTS idx_parcels_created_at_warehouse ON parcels(created_at, warehouse_id)'
    ];

    for (const indexQuery of indexes) {
      await db.query(indexQuery);
    }
    console.log('✅ Indexes created');

    // Step 7: Show current status
    console.log('\n📊 Current warehouse-parcel relationship status:');
    
    const statusResult = await db.query(`
      SELECT 
        w.id as warehouse_id,
        w.name as warehouse_name,
        w.governorate,
        COUNT(p.id) as total_parcels,
        COUNT(CASE WHEN p.status = 'En attente' THEN 1 END) as pending_parcels,
        COUNT(CASE WHEN p.status = 'Au dépôt' THEN 1 END) as at_warehouse_parcels,
        COUNT(CASE WHEN p.status IN ('Livrés', 'Livrés payés') THEN 1 END) as delivered_parcels,
        COUNT(s.id) as assigned_shippers
      FROM warehouses w
      LEFT JOIN parcels p ON w.id = p.warehouse_id
      LEFT JOIN shippers s ON w.id = s.default_warehouse_id
      WHERE w.status = 'Actif'
      GROUP BY w.id, w.name, w.governorate
      ORDER BY w.id
    `);
    
    console.table(statusResult.rows);

    // Step 8: Show unassigned parcels
    console.log('\n❓ Parcels without warehouse assignment:');
    
    const unassignedResult = await db.query(`
      SELECT 
        p.id,
        p.tracking_number,
        p.status,
        s.name as shipper_name,
        s.agency as shipper_agency,
        s.default_warehouse_id
      FROM parcels p
      LEFT JOIN shippers s ON p.shipper_id = s.id
      WHERE p.warehouse_id IS NULL
      ORDER BY p.created_at DESC
      LIMIT 10
    `);
    
    if (unassignedResult.rows.length > 0) {
      console.table(unassignedResult.rows);
      console.log(`⚠️  There are ${unassignedResult.rows.length} parcels without warehouse assignment`);
    } else {
      console.log('✅ All parcels have warehouse assignments!');
    }

    console.log('\n✅ Warehouse-parcel relationship enhancement completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Update parcel creation API to automatically assign warehouse_id');
    console.log('2. Update parcel status tracking to include warehouse information');
    console.log('3. Add warehouse filtering to parcel queries');
    console.log('4. Create warehouse-specific dashboards');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error enhancing warehouse-parcel relationship:', error);
    process.exit(1);
  }
};

enhanceWarehouseParcelRelationship(); 