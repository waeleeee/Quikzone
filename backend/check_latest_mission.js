const { pool } = require('./config/database');

async function checkLatestMission() {
  const client = await pool.connect();
  try {
    console.log('🔍 CHECKING LATEST MISSION DATA\n');
    
    // Get the latest mission
    const latestMission = await client.query(`
      SELECT * FROM pickup_missions 
      ORDER BY created_at DESC 
      LIMIT 1
    `);
    
    if (latestMission.rows.length === 0) {
      console.log('❌ No missions found');
      return;
    }
    
    const mission = latestMission.rows[0];
    console.log('📊 Latest mission data:');
    Object.keys(mission).forEach(key => {
      console.log(`  ${key}: ${mission[key]}`);
    });
    
    // Check if driver exists
    console.log('\n🔍 Checking driver data:');
    const driverResult = await client.query(`
      SELECT id, name, agency, status FROM drivers WHERE id = $1
    `, [mission.driver_id]);
    
    if (driverResult.rows.length > 0) {
      console.log('✅ Driver found:', driverResult.rows[0]);
    } else {
      console.log('❌ Driver not found for ID:', mission.driver_id);
    }
    
    // Check if shipper exists
    console.log('\n🔍 Checking shipper data:');
    const shipperResult = await client.query(`
      SELECT id, name, agency FROM shippers WHERE id = $1
    `, [mission.shipper_id]);
    
    if (shipperResult.rows.length > 0) {
      console.log('✅ Shipper found:', shipperResult.rows[0]);
    } else {
      console.log('❌ Shipper not found for ID:', mission.shipper_id);
    }
    
    // Check mission demands
    console.log('\n🔍 Checking mission demands:');
    const demandsResult = await client.query(`
      SELECT md.demand_id, d.expediteur_name, d.expediteur_agency
      FROM mission_demands md
      LEFT JOIN demands d ON md.demand_id = d.id
      WHERE md.mission_id = $1
    `, [mission.id]);
    
    console.log('Mission demands:', demandsResult.rows);
    
    // Check mission parcels
    console.log('\n🔍 Checking mission parcels:');
    const parcelsResult = await client.query(`
      SELECT mp.parcel_id, p.tracking_number, p.destination
      FROM mission_parcels mp
      LEFT JOIN parcels p ON mp.parcel_id = p.id
      WHERE mp.mission_id = $1
    `, [mission.id]);
    
    console.log('Mission parcels:', parcelsResult.rows);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

checkLatestMission();













