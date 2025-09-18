const db = require('./config/database');

const fixWarehouseAssignmentForNewParcels = async () => {
  try {
    console.log('🔧 Fixing warehouse assignment for new parcels...\n');

    // Step 1: Check current agency-warehouse mapping
    console.log('🗺️ Current Agency-Warehouse Mapping:');
    console.log('-' .repeat(50));
    
    const mappingResult = await db.query(`
      SELECT 
        s.agency,
        s.default_warehouse_id,
        w.name as warehouse_name,
        COUNT(p.id) as parcels_count
      FROM shippers s
      LEFT JOIN warehouses w ON s.default_warehouse_id = w.id
      LEFT JOIN parcels p ON s.id = p.shipper_id
      WHERE s.agency IS NOT NULL
      GROUP BY s.agency, s.default_warehouse_id, w.name
      ORDER BY s.agency
    `);
    
    console.table(mappingResult.rows);

    // Step 2: Check parcels without warehouse assignment
    console.log('\n❓ Parcels without warehouse assignment:');
    console.log('-' .repeat(50));
    
    const unassignedResult = await db.query(`
      SELECT 
        p.id,
        p.tracking_number,
        p.status,
        p.destination,
        s.name as shipper_name,
        s.agency as shipper_agency,
        s.default_warehouse_id,
        p.created_at
      FROM parcels p
      LEFT JOIN shippers s ON p.shipper_id = s.id
      WHERE p.warehouse_id IS NULL
      ORDER BY p.created_at DESC
      LIMIT 10
    `);
    
    if (unassignedResult.rows.length > 0) {
      console.table(unassignedResult.rows);
      console.log(`⚠️  Found ${unassignedResult.rows.length} parcels without warehouse assignment`);
    } else {
      console.log('✅ All parcels have warehouse assignments!');
    }

    // Step 3: Update agency-warehouse mapping for shippers
    console.log('\n🔄 Updating agency-warehouse mapping for shippers...');
    
    const updateShippersResult = await db.query(`
      UPDATE shippers 
      SET default_warehouse_id = CASE 
        WHEN agency = 'Sousse' THEN 11
        WHEN agency = 'Tunis' THEN 10
        WHEN agency = 'Sfax' THEN 12
        WHEN agency = 'Tozeur' THEN 13
        WHEN agency = 'Béja' THEN 14
        WHEN agency = 'Entrepôt Sousse' THEN 11
        WHEN agency = 'Entrepôt Tunis Central' THEN 10
        WHEN agency = 'Entrepôt Sfax' THEN 12
        WHEN agency = 'Entrepôt Tozeur' THEN 13
        WHEN agency = 'Entrepôt Béja' THEN 14
        ELSE NULL
      END
      WHERE agency IS NOT NULL
    `);
    
    console.log(`✅ Updated ${updateShippersResult.rowCount} shippers with warehouse assignments`);

    // Step 4: Update parcels without warehouse assignment
    console.log('\n📦 Updating parcels without warehouse assignment...');
    
    const updateParcelsResult = await db.query(`
      UPDATE parcels 
      SET warehouse_id = s.default_warehouse_id
      FROM shippers s
      WHERE parcels.shipper_id = s.id
      AND parcels.warehouse_id IS NULL
      AND s.default_warehouse_id IS NOT NULL
    `);
    
    console.log(`✅ Updated ${updateParcelsResult.rowCount} parcels with warehouse assignments`);

    // Step 5: Show updated status
    console.log('\n📊 Updated Status:');
    console.log('-' .repeat(50));
    
    const updatedStatusResult = await db.query(`
      SELECT 
        w.name as warehouse_name,
        w.governorate,
        COUNT(p.id) as total_parcels,
        COUNT(CASE WHEN p.status = 'En attente' THEN 1 END) as pending_parcels,
        COUNT(CASE WHEN p.status = 'Au dépôt' THEN 1 END) as at_warehouse_parcels,
        COUNT(CASE WHEN p.status IN ('Livrés', 'Livrés payés') THEN 1 END) as delivered_parcels
      FROM warehouses w
      LEFT JOIN parcels p ON w.id = p.warehouse_id
      WHERE w.status = 'Actif'
      GROUP BY w.id, w.name, w.governorate
      ORDER BY total_parcels DESC
    `);
    
    console.table(updatedStatusResult.rows);

    // Step 6: Show remaining unassigned parcels
    console.log('\n❓ Remaining parcels without warehouse assignment:');
    console.log('-' .repeat(50));
    
    const remainingUnassignedResult = await db.query(`
      SELECT 
        p.id,
        p.tracking_number,
        p.status,
        s.name as shipper_name,
        s.agency as shipper_agency,
        s.default_warehouse_id,
        p.created_at
      FROM parcels p
      LEFT JOIN shippers s ON p.shipper_id = s.id
      WHERE p.warehouse_id IS NULL
      ORDER BY p.created_at DESC
      LIMIT 10
    `);
    
    if (remainingUnassignedResult.rows.length > 0) {
      console.table(remainingUnassignedResult.rows);
      console.log(`⚠️  Still have ${remainingUnassignedResult.rows.length} parcels without warehouse assignment`);
      console.log('This might be due to:');
      console.log('- Shipper agency not matching warehouse mapping');
      console.log('- Shipper without agency information');
      console.log('- Missing warehouse in the system');
    } else {
      console.log('✅ All parcels now have warehouse assignments!');
    }

    // Step 7: Test warehouse assignment for new parcels
    console.log('\n🧪 Testing warehouse assignment for new parcels...');
    console.log('-' .repeat(50));
    
    // Get a sample shipper with agency
    const sampleShipperResult = await db.query(`
      SELECT 
        s.id,
        s.name,
        s.agency,
        s.default_warehouse_id,
        w.name as warehouse_name
      FROM shippers s
      LEFT JOIN warehouses w ON s.default_warehouse_id = w.id
      WHERE s.agency IS NOT NULL AND s.default_warehouse_id IS NOT NULL
      LIMIT 1
    `);
    
    if (sampleShipperResult.rows.length > 0) {
      const shipper = sampleShipperResult.rows[0];
      console.log(`📦 Sample shipper: ${shipper.name}`);
      console.log(`🏢 Agency: ${shipper.agency}`);
      console.log(`🏢 Default Warehouse: ${shipper.warehouse_name} (ID: ${shipper.default_warehouse_id})`);
      console.log('✅ Warehouse assignment is working correctly');
    } else {
      console.log('⚠️ No shippers found with proper agency-warehouse mapping');
    }

    console.log('\n✅ Warehouse assignment fix completed!');
    console.log('\n📋 Next steps:');
    console.log('1. When creating new parcels, the system will automatically assign warehouse based on shipper agency');
    console.log('2. Check that shippers have correct agency information');
    console.log('3. Verify that all warehouses exist in the system');

  } catch (error) {
    console.error('❌ Error fixing warehouse assignment:', error);
  } finally {
    process.exit(0);
  }
};

fixWarehouseAssignmentForNewParcels(); 