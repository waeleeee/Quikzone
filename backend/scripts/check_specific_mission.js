const { pool } = require('../config/database');

async function checkSpecificMission() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 CHECKING SPECIFIC MISSION: PIK234566E2\n');
    console.log('='.repeat(60));
    
    // Get the specific mission
    const missionResult = await client.query(`
      SELECT 
        pm.*,
        d.name as driver_name,
        d.email as driver_email,
        s.name as shipper_name
      FROM pickup_missions pm
      LEFT JOIN drivers d ON pm.driver_id = d.id
      LEFT JOIN shippers s ON pm.shipper_id = s.id
      WHERE pm.mission_number = 'PIK234566E2'
    `);
    
    if (missionResult.rows.length === 0) {
      console.log('❌ Mission PIK234566E2 not found in database');
      return;
    }
    
    const mission = missionResult.rows[0];
    console.log('📋 MISSION DETAILS:');
    console.log('-'.repeat(40));
    console.log(`ID: ${mission.id}`);
    console.log(`Mission Number: ${mission.mission_number}`);
    console.log(`Status: ${mission.status}`);
    console.log(`Security Code: ${mission.security_code || 'NULL'}`);
    console.log(`Completion Code: ${mission.completion_code || 'NULL'}`);
    console.log(`Driver: ${mission.driver_name || 'N/A'} (${mission.driver_email || 'N/A'})`);
    console.log(`Shipper: ${mission.shipper_name || 'N/A'}`);
    console.log(`Created: ${new Date(mission.created_at).toLocaleString('fr-FR')}`);
    console.log(`Updated: ${new Date(mission.updated_at).toLocaleString('fr-FR')}`);
    
    // Get demands for this mission
    const demandsResult = await client.query(`
      SELECT 
        d.*,
        md.mission_id
      FROM demands d
      INNER JOIN mission_demands md ON d.id = md.demand_id
      WHERE md.mission_id = $1
    `, [mission.id]);
    
    console.log('\n📦 DEMANDS IN THIS MISSION:');
    console.log('-'.repeat(40));
    if (demandsResult.rows.length === 0) {
      console.log('No demands found for this mission');
    } else {
      demandsResult.rows.forEach((demand, index) => {
        console.log(`${index + 1}. Demande #${demand.id} - ${demand.expediteur_name}`);
        console.log(`   Status: ${demand.status}`);
        console.log(`   In Mission: ${demand.in_mission}`);
        console.log(`   Created: ${new Date(demand.created_at).toLocaleDateString('fr-FR')}`);
        console.log('');
      });
    }
    
    // Get parcels for this mission
    const parcelsResult = await client.query(`
      SELECT 
        p.*,
        mp.mission_id
      FROM parcels p
      INNER JOIN mission_parcels mp ON p.id = mp.parcel_id
      WHERE mp.mission_id = $1
    `, [mission.id]);
    
    console.log('📦 PARCELS IN THIS MISSION:');
    console.log('-'.repeat(40));
    if (parcelsResult.rows.length === 0) {
      console.log('No parcels found for this mission');
    } else {
      parcelsResult.rows.forEach((parcel, index) => {
        console.log(`${index + 1}. Parcel #${parcel.id} - ${parcel.tracking_number}`);
        console.log(`   Status: ${parcel.status}`);
        console.log(`   Destination: ${parcel.destination}`);
        console.log(`   Client Code: ${parcel.client_code}`);
        console.log(`   Created: ${new Date(parcel.created_at).toLocaleDateString('fr-FR')}`);
        console.log('');
      });
    }
    
    console.log('='.repeat(60));
    console.log('✅ MISSION CHECK COMPLETE');
    
  } catch (error) {
    console.error('❌ Error checking specific mission:', error);
  } finally {
    client.release();
  }
}

checkSpecificMission()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  }); 