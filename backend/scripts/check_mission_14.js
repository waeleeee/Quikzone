const { pool } = require('../config/database');

async function checkMission14() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 CHECKING MISSION #14\n');
    console.log('='.repeat(50));
    
    // Get mission details
    const missionResult = await client.query(`
      SELECT id, mission_number, status, security_code, completion_code, driver_id, shipper_id
      FROM pickup_missions 
      WHERE id = 14
    `);
    
    if (missionResult.rows.length === 0) {
      console.log('❌ Mission #14 not found');
      return;
    }
    
    const mission = missionResult.rows[0];
    console.log('📋 MISSION #14 DATA:');
    console.log('-'.repeat(30));
    console.log('ID:', mission.id);
    console.log('Mission Number:', mission.mission_number);
    console.log('Status:', mission.status);
    console.log('Security Code:', mission.security_code);
    console.log('Completion Code:', mission.completion_code);
    console.log('Driver ID:', mission.driver_id);
    console.log('Shipper ID:', mission.shipper_id);
    
    // Get parcels for this mission
    const parcelsResult = await client.query(`
      SELECT p.id, p.tracking_number, p.status
      FROM parcels p
      INNER JOIN mission_parcels mp ON p.id = mp.parcel_id
      WHERE mp.mission_id = 14
    `);
    
    console.log('\n📦 PARCELS IN MISSION #14:');
    console.log('-'.repeat(30));
    console.log('Total parcels:', parcelsResult.rows.length);
    parcelsResult.rows.forEach((parcel, index) => {
      console.log(`Parcel ${index + 1}:`, {
        id: parcel.id,
        tracking_number: parcel.tracking_number,
        status: parcel.status
      });
    });
    
    // Get demands for this mission
    const demandsResult = await client.query(`
      SELECT d.id, d.expediteur_name, d.status
      FROM demands d
      INNER JOIN mission_demands md ON d.id = md.demand_id
      WHERE md.mission_id = 14
    `);
    
    console.log('\n📋 DEMANDS IN MISSION #14:');
    console.log('-'.repeat(30));
    console.log('Total demands:', demandsResult.rows.length);
    demandsResult.rows.forEach((demand, index) => {
      console.log(`Demand ${index + 1}:`, {
        id: demand.id,
        expediteur_name: demand.expediteur_name,
        status: demand.status
      });
    });
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ MISSION #14 CHECK COMPLETE');
    
  } catch (error) {
    console.error('❌ Error checking mission #14:', error);
  } finally {
    client.release();
  }
}

checkMission14()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  }); 