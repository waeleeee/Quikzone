const { pool } = require('../config/database');

async function testMissionData() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 TESTING MISSION DATA STRUCTURE\n');
    console.log('='.repeat(50));
    
    // Get a sample mission with full details
    const missionResult = await client.query(`
      SELECT 
        pm.*,
        d.name as driver_name,
        s.name as shipper_name
      FROM pickup_missions pm
      LEFT JOIN drivers d ON pm.driver_id = d.id
      LEFT JOIN shippers s ON pm.shipper_id = s.id
      WHERE pm.id = 13
    `);
    
    if (missionResult.rows.length === 0) {
      console.log('❌ Mission 13 not found');
      return;
    }
    
    const mission = missionResult.rows[0];
    console.log('📋 MISSION DATA:');
    console.log('-'.repeat(30));
    console.log('ID:', mission.id);
    console.log('Mission Number:', mission.mission_number);
    console.log('Status:', mission.status);
    console.log('Security Code:', mission.security_code);
    console.log('Completion Code:', mission.completion_code);
    console.log('Driver:', mission.driver_name);
    console.log('Shipper:', mission.shipper_name);
    
    // Get demands for this mission
    const demandsResult = await client.query(`
      SELECT 
        d.*,
        md.mission_id
      FROM demands d
      INNER JOIN mission_demands md ON d.id = md.demand_id
      WHERE md.mission_id = 13
    `);
    
    console.log('\n📋 DEMANDS:');
    console.log('-'.repeat(30));
    demandsResult.rows.forEach((demand, index) => {
      console.log(`Demand ${index + 1}:`, {
        id: demand.id,
        expediteur_name: demand.expediteur_name,
        status: demand.status,
        in_mission: demand.in_mission
      });
    });
    
    // Get parcels for this mission
    const parcelsResult = await client.query(`
      SELECT 
        p.*,
        mp.mission_id,
        mp.status as mission_parcel_status
      FROM parcels p
      INNER JOIN mission_parcels mp ON p.id = mp.parcel_id
      WHERE mp.mission_id = 13
    `);
    
    console.log('\n📋 PARCELS:');
    console.log('-'.repeat(30));
    parcelsResult.rows.forEach((parcel, index) => {
      console.log(`Parcel ${index + 1}:`, {
        id: parcel.id,
        tracking_number: parcel.tracking_number,
        status: parcel.status,
        mission_status: parcel.mission_parcel_status
      });
    });
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ MISSION DATA TEST COMPLETE');
    
  } catch (error) {
    console.error('❌ Error testing mission data:', error);
  } finally {
    client.release();
  }
}

testMissionData()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  }); 