const { pool } = require('../config/database');

async function checkMissionParcels() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 CHECKING MISSION PARCELS STRUCTURE\n');
    console.log('='.repeat(60));
    
    // Get all missions with their parcels
    const missionsResult = await client.query(`
      SELECT 
        pm.id,
        pm.mission_number,
        pm.status,
        pm.completion_code,
        d.name as driver_name,
        s.name as shipper_name,
        COUNT(DISTINCT md.demand_id) as demand_count,
        COUNT(DISTINCT mp.parcel_id) as parcel_count
      FROM pickup_missions pm
      LEFT JOIN drivers d ON pm.driver_id = d.id
      LEFT JOIN shippers s ON pm.shipper_id = s.id
      LEFT JOIN mission_demands md ON pm.id = md.mission_id
      LEFT JOIN mission_parcels mp ON pm.id = mp.mission_id
      GROUP BY pm.id, d.name, s.name
      ORDER BY pm.id DESC
    `);
    
    console.log('📋 MISSIONS WITH PARCEL COUNTS:');
    console.log('-'.repeat(80));
    console.log('ID | Mission Number | Status | Driver | Shipper | Demands | Parcels');
    console.log('-'.repeat(80));
    
    missionsResult.rows.forEach(mission => {
      const driverName = mission.driver_name || 'N/A';
      const shipperName = mission.shipper_name || 'N/A';
      
      console.log(`${mission.id.toString().padStart(2)} | ${mission.mission_number.padEnd(15)} | ${mission.status.padEnd(8)} | ${driverName.padEnd(15)} | ${shipperName.padEnd(15)} | ${mission.demand_count.toString().padStart(7)} | ${mission.parcel_count.toString().padStart(7)}`);
    });
    
    // Check specific mission (let's check the latest one)
    if (missionsResult.rows.length > 0) {
      const latestMission = missionsResult.rows[0];
      console.log(`\n🔍 DETAILED CHECK FOR MISSION #${latestMission.id} (${latestMission.mission_number}):`);
      console.log('-'.repeat(60));
      
      // Get demands for this mission
      const demandsResult = await client.query(`
        SELECT 
          d.id,
          d.expediteur_name,
          d.status,
          COUNT(dp.parcel_id) as parcel_count
        FROM demands d
        INNER JOIN mission_demands md ON d.id = md.demand_id
        LEFT JOIN demand_parcels dp ON d.id = dp.demand_id
        WHERE md.mission_id = $1
        GROUP BY d.id, d.expediteur_name, d.status
      `, [latestMission.id]);
      
      console.log('📦 DEMANDS IN THIS MISSION:');
      demandsResult.rows.forEach(demand => {
        console.log(`  - Demande #${demand.id}: ${demand.expediteur_name} (${demand.parcel_count} parcels, status: ${demand.status})`);
      });
      
      // Get parcels directly assigned to mission
      const missionParcelsResult = await client.query(`
        SELECT 
          p.id,
          p.tracking_number,
          p.destination,
          p.status
        FROM parcels p
        INNER JOIN mission_parcels mp ON p.id = mp.parcel_id
        WHERE mp.mission_id = $1
      `, [latestMission.id]);
      
      console.log('\n📦 PARCELS DIRECTLY ASSIGNED TO MISSION:');
      if (missionParcelsResult.rows.length === 0) {
        console.log('  ❌ No parcels directly assigned to mission');
      } else {
        missionParcelsResult.rows.forEach(parcel => {
          console.log(`  - Parcel #${parcel.id}: ${parcel.tracking_number} (${parcel.destination}, status: ${parcel.status})`);
        });
      }
      
      // Get parcels through demands
      const demandParcelsResult = await client.query(`
        SELECT 
          p.id,
          p.tracking_number,
          p.destination,
          p.status,
          d.expediteur_name
        FROM parcels p
        INNER JOIN demand_parcels dp ON p.id = dp.parcel_id
        INNER JOIN demands d ON dp.demand_id = d.id
        INNER JOIN mission_demands md ON d.id = md.demand_id
        WHERE md.mission_id = $1
      `, [latestMission.id]);
      
      console.log('\n📦 PARCELS THROUGH DEMANDS:');
      if (demandParcelsResult.rows.length === 0) {
        console.log('  ❌ No parcels found through demands');
      } else {
        demandParcelsResult.rows.forEach(parcel => {
          console.log(`  - Parcel #${parcel.id}: ${parcel.tracking_number} (${parcel.destination}, status: ${parcel.status}, shipper: ${parcel.expediteur_name})`);
        });
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ MISSION PARCELS CHECK COMPLETE');
    
  } catch (error) {
    console.error('❌ Error checking mission parcels:', error);
  } finally {
    client.release();
  }
}

checkMissionParcels()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  }); 