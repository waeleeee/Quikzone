const db = require('./config/database');

const testParcelsFiltering = async () => {
  try {
    console.log('🔍 Testing parcels filtering with real data...\n');

    const chefAgenceEmail = 'bensalah@quickzone.tn';

    // Get Chef d'agence agency
    const chefResult = await db.query(`
      SELECT agency FROM agency_managers WHERE email = $1
    `, [chefAgenceEmail]);

    if (chefResult.rows.length === 0) {
      console.log('❌ Chef d\'agence not found');
      return;
    }

    const chefAgency = chefResult.rows[0].agency;
    console.log(`📋 Chef d'agence agency: "${chefAgency}"`);

    // Get all parcels with warehouse info
    const allParcelsResult = await db.query(`
      SELECT 
        p.id,
        p.tracking_number,
        p.destination,
        p.status,
        s.name as shipper_name,
        s.agency as shipper_agency,
        w.name as warehouse_name,
        w.id as warehouse_id
      FROM parcels p
      LEFT JOIN shippers s ON p.shipper_id = s.id
      LEFT JOIN warehouses w ON p.warehouse_id = w.id
      ORDER BY p.created_at DESC
      LIMIT 20
    `);

    console.log(`\n📦 All parcels (first 20):`);
    console.log(`Total: ${allParcelsResult.rows.length} parcels\n`);

    allParcelsResult.rows.forEach((parcel, index) => {
      console.log(`${index + 1}. ${parcel.tracking_number} - ${parcel.destination}`);
      console.log(`   Shipper: ${parcel.shipper_name} (${parcel.shipper_agency})`);
      console.log(`   Warehouse: ${parcel.warehouse_name} (ID: ${parcel.warehouse_id})`);
      console.log(`   Status: ${parcel.status}`);
      console.log('');
    });

    // Test the filtering logic
    console.log(`\n🔍 Testing filtering for agency "${chefAgency}":`);
    
    const filteredParcelsResult = await db.query(`
      SELECT 
        p.id,
        p.tracking_number,
        p.destination,
        p.status,
        s.name as shipper_name,
        s.agency as shipper_agency,
        w.name as warehouse_name,
        w.id as warehouse_id
      FROM parcels p
      LEFT JOIN shippers s ON p.shipper_id = s.id
      LEFT JOIN warehouses w ON p.warehouse_id = w.id
      WHERE w.name = $1
      ORDER BY p.created_at DESC
    `, [chefAgency]);

    console.log(`\n📦 Filtered parcels for "${chefAgency}":`);
    console.log(`Total: ${filteredParcelsResult.rows.length} parcels\n`);

    filteredParcelsResult.rows.forEach((parcel, index) => {
      console.log(`${index + 1}. ${parcel.tracking_number} - ${parcel.destination}`);
      console.log(`   Shipper: ${parcel.shipper_name} (${parcel.shipper_agency})`);
      console.log(`   Warehouse: ${parcel.warehouse_name} (ID: ${parcel.warehouse_id})`);
      console.log(`   Status: ${parcel.status}`);
      console.log('');
    });

    // Check warehouse assignments
    console.log(`\n🏢 Checking warehouse assignments:`);
    const warehouseResult = await db.query(`
      SELECT id, name, governorate, address
      FROM warehouses
      ORDER BY name
    `);

    warehouseResult.rows.forEach((warehouse, index) => {
      console.log(`${index + 1}. ${warehouse.name} (${warehouse.governorate})`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
};

testParcelsFiltering(); 