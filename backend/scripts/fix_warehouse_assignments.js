const db = require('../config/database');

const fixWarehouseAssignments = async () => {
  try {
    console.log('🔧 Fixing warehouse assignments for parcels with "Entrepôt" agency names...');

    // Step 1: Fix warehouse assignments for parcels with "Entrepôt" in agency name
    console.log('📦 Updating warehouse assignments...');
    
    const updateResult = await db.query(`
      UPDATE parcels 
      SET warehouse_id = CASE 
        WHEN agency LIKE '%Sousse%' THEN 11
        WHEN agency LIKE '%Tunis%' THEN 10
        WHEN agency LIKE '%Sfax%' THEN 12
        WHEN agency LIKE '%Tozeur%' THEN 13
        WHEN agency LIKE '%Béja%' THEN 14
        ELSE warehouse_id
      END
      WHERE warehouse_id IS NULL 
      AND agency IS NOT NULL
    `);

    console.log(`✅ Updated ${updateResult.rowCount} parcels`);

    // Step 2: Show final results
    console.log('\n📊 Final parcels by agency and warehouse:');
    const finalResults = await db.query(`
      SELECT 
        p.agency,
        w.name as warehouse_name,
        COUNT(*) as parcel_count,
        COUNT(CASE WHEN p.status = 'Au dépôt' THEN 1 END) as at_warehouse_count
      FROM parcels p
      LEFT JOIN warehouses w ON p.warehouse_id = w.id
      WHERE p.agency IS NOT NULL
      GROUP BY p.agency, w.name
      ORDER BY p.agency
    `);
    
    console.table(finalResults.rows);

    // Step 3: Show parcels with "Au dépôt" status and their warehouses
    console.log('\n🏢 Parcels with "Au dépôt" status and warehouse assignments:');
    const depotParcels = await db.query(`
      SELECT 
        p.id,
        p.tracking_number,
        p.status,
        p.agency,
        w.name as warehouse_name,
        s.name as shipper_name
      FROM parcels p
      LEFT JOIN warehouses w ON p.warehouse_id = w.id
      LEFT JOIN shippers s ON p.shipper_id = s.id
      WHERE p.status = 'Au dépôt'
      ORDER BY p.agency, w.name
    `);
    
    console.table(depotParcels.rows);

    // Step 4: Show remaining unassigned parcels
    console.log('\n❓ Remaining parcels without warehouse assignment:');
    const unassignedParcels = await db.query(`
      SELECT 
        p.id,
        p.tracking_number,
        p.status,
        p.agency,
        s.name as shipper_name,
        s.agency as shipper_agency
      FROM parcels p
      LEFT JOIN shippers s ON p.shipper_id = s.id
      WHERE p.warehouse_id IS NULL
      ORDER BY p.status
    `);
    
    if (unassignedParcels.rows.length > 0) {
      console.table(unassignedParcels.rows);
    } else {
      console.log('✅ All parcels now have warehouse assignments!');
    }

    // Step 5: Show warehouse statistics
    console.log('\n🏢 Warehouse Statistics:');
    const warehouseStats = await db.query(`
      SELECT 
        w.name as warehouse_name,
        w.governorate,
        COUNT(p.id) as total_parcels,
        COUNT(CASE WHEN p.status = 'Au dépôt' THEN 1 END) as at_warehouse,
        COUNT(CASE WHEN p.status = 'En attente' THEN 1 END) as pending,
        COUNT(CASE WHEN p.status = 'En cours' THEN 1 END) as in_transit,
        COUNT(CASE WHEN p.status = 'Livrés' THEN 1 END) as delivered
      FROM warehouses w
      LEFT JOIN parcels p ON w.id = p.warehouse_id
      WHERE w.status = 'Actif'
      GROUP BY w.id, w.name, w.governorate
      ORDER BY w.name
    `);
    
    console.table(warehouseStats.rows);

    console.log('\n✅ Warehouse assignment fix completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing warehouse assignments:', error);
    process.exit(1);
  }
};

fixWarehouseAssignments(); 