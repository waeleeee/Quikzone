const db = require('../config/database');

const checkWarehouseParcels = async () => {
  try {
    console.log('🔍 Checking warehouse-parcel relationships...');

    // Check warehouses
    console.log('\n📦 Warehouses:');
    const warehousesResult = await db.query(`
      SELECT id, name, governorate, status FROM warehouses ORDER BY id
    `);
    console.table(warehousesResult.rows);

    // Check parcels with warehouse_id
    console.log('\n📦 Parcels with warehouse_id:');
    const parcelsWithWarehouseResult = await db.query(`
      SELECT 
        p.id,
        p.tracking_number,
        p.status,
        p.warehouse_id,
        p.agency,
        w.name as warehouse_name,
        s.name as shipper_name
      FROM parcels p
      LEFT JOIN warehouses w ON p.warehouse_id = w.id
      LEFT JOIN shippers s ON p.shipper_id = s.id
      WHERE p.warehouse_id IS NOT NULL
      ORDER BY p.warehouse_id, p.status
    `);
    console.table(parcelsWithWarehouseResult.rows);

    // Check parcels without warehouse_id
    console.log('\n❓ Parcels without warehouse_id:');
    const parcelsWithoutWarehouseResult = await db.query(`
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
    console.table(parcelsWithoutWarehouseResult.rows);

    // Check parcels by status for each warehouse
    console.log('\n📊 Parcels by status for each warehouse:');
    const parcelsByWarehouseStatusResult = await db.query(`
      SELECT 
        w.id as warehouse_id,
        w.name as warehouse_name,
        p.status,
        COUNT(*) as count
      FROM warehouses w
      LEFT JOIN parcels p ON w.id = p.warehouse_id
      GROUP BY w.id, w.name, p.status
      ORDER BY w.id, p.status
    `);
    console.table(parcelsByWarehouseStatusResult.rows);

    // Check agency-warehouse mapping
    console.log('\n🗺️ Agency-Warehouse mapping check:');
    const agencyMappingResult = await db.query(`
      SELECT 
        p.agency,
        p.warehouse_id,
        w.name as warehouse_name,
        COUNT(*) as parcel_count
      FROM parcels p
      LEFT JOIN warehouses w ON p.warehouse_id = w.id
      WHERE p.agency IS NOT NULL
      GROUP BY p.agency, p.warehouse_id, w.name
      ORDER BY p.agency
    `);
    console.table(agencyMappingResult.rows);

    // Check specific warehouse details (ID 11 - Entrepôt Sousse)
    console.log('\n🔍 Specific check for Entrepôt Sousse (ID 11):');
    const specificWarehouseResult = await db.query(`
      SELECT 
        p.id,
        p.tracking_number,
        p.status,
        p.warehouse_id,
        p.agency,
        w.name as warehouse_name
      FROM parcels p
      LEFT JOIN warehouses w ON p.warehouse_id = w.id
      WHERE p.warehouse_id = 11
      ORDER BY p.status
    `);
    console.table(specificWarehouseResult.rows);

    console.log('\n✅ Warehouse-parcel relationship check completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking warehouse parcels:', error);
    process.exit(1);
  }
};

checkWarehouseParcels(); 