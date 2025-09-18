const db = require('../config/database');

const assignWarehousesToParcels = async () => {
  try {
    console.log('🚀 Assigning warehouses to parcels based on shipper agency...');

    // Step 1: Create agency-warehouse mapping
    const agencyWarehouseMapping = {
      'Sousse': 11, // Entrepôt Sousse
      'Tunis': 10,  // Entrepôt Tunis Central
      'Sfax': 12,   // Entrepôt Sfax
      'Tozeur': 13, // tesst
      'Béja': 14    // beja
    };

    console.log('🗺️ Agency-Warehouse Mapping:', agencyWarehouseMapping);

    // Step 2: Update parcels with agency and warehouse based on shipper
    console.log('📦 Updating parcels with agency and warehouse assignments...');
    
    const updateResult = await db.query(`
      UPDATE parcels 
      SET 
        agency = s.agency,
        warehouse_id = CASE 
          WHEN s.agency = 'Sousse' THEN 11
          WHEN s.agency = 'Tunis' THEN 10
          WHEN s.agency = 'Sfax' THEN 12
          WHEN s.agency = 'Tozeur' THEN 13
          WHEN s.agency = 'Béja' THEN 14
          ELSE NULL
        END
      FROM shippers s
      WHERE parcels.shipper_id = s.id
      AND (parcels.agency IS NULL OR parcels.warehouse_id IS NULL)
    `);

    console.log(`✅ Updated ${updateResult.rowCount} parcels`);

    // Step 3: Show results
    console.log('\n📊 Parcels by agency and warehouse:');
    const parcelsByAgency = await db.query(`
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
    
    console.table(parcelsByAgency.rows);

    // Step 4: Show parcels with "Au dépôt" status
    console.log('\n🏢 Parcels with "Au dépôt" status:');
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

    // Step 5: Show unassigned parcels
    console.log('\n❓ Parcels without warehouse assignment:');
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
      console.log('✅ All parcels have warehouse assignments!');
    }

    console.log('\n✅ Warehouse assignment completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error assigning warehouses:', error);
    process.exit(1);
  }
};

assignWarehousesToParcels(); 