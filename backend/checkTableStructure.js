const db = require('./config/database');

async function checkTableStructure() {
  try {
    console.log('🔍 Checking table structure...');
    
    // Check parcels table structure
    const parcelsColumns = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'parcels' 
      ORDER BY ordinal_position
    `);
    console.log('📦 Parcels table columns:', parcelsColumns.rows);
    
    // Check shippers table structure
    const shippersColumns = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'shippers' 
      ORDER BY ordinal_position
    `);
    console.log('📦 Shippers table columns:', shippersColumns.rows);
    
    // Check mission_parcels table structure
    const missionParcelsColumns = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'mission_parcels' 
      ORDER BY ordinal_position
    `);
    console.log('📦 Mission_parcels table columns:', missionParcelsColumns.rows);
    
    // Test a simple query to get parcels for mission 15
    const testParcels = await db.query(`
      SELECT p.id, p.tracking_number, p.destination, p.status
      FROM parcels p 
      INNER JOIN mission_parcels mp ON p.id = mp.parcel_id 
      WHERE mp.mission_id = 15
    `);
    console.log('🔍 Test parcels query result:', testParcels.rows);
    
    // Test a simple query to get shipper info
    const testShipper = await db.query('SELECT * FROM shippers WHERE id = 39');
    console.log('🔍 Test shipper query result:', testShipper.rows[0]);
    
  } catch (error) {
    console.error('❌ Error checking table structure:', error);
  } finally {
    process.exit(0);
  }
}

checkTableStructure(); 