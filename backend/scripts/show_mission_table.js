const { pool } = require('../config/database');

async function showMissionTable() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 SHOWING PICKUP MISSIONS TABLE\n');
    console.log('='.repeat(80));
    
    // Get all pickup missions with driver and shipper info
    const missionsResult = await client.query(`
      SELECT 
        pm.id,
        pm.mission_number,
        pm.status,
        pm.security_code,
        pm.completion_code,
        pm.created_at,
        pm.updated_at,
        d.name as driver_name,
        s.name as shipper_name,
        COALESCE(COUNT(DISTINCT md.demand_id), 0) as demand_count,
        COALESCE(COUNT(DISTINCT mp.parcel_id), 0) as parcel_count
      FROM pickup_missions pm
      LEFT JOIN drivers d ON pm.driver_id = d.id
      LEFT JOIN shippers s ON pm.shipper_id = s.id
      LEFT JOIN mission_demands md ON pm.id = md.mission_id
      LEFT JOIN mission_parcels mp ON pm.id = mp.mission_id
      GROUP BY pm.id, d.name, s.name
      ORDER BY pm.id DESC
    `);
    
    console.log('📋 ALL PICKUP MISSIONS:');
    console.log('-'.repeat(80));
    console.log('ID | Mission Number | Status | Security Code | Completion Code | Driver | Shipper | Demands | Parcels | Created At');
    console.log('-'.repeat(80));
    
    missionsResult.rows.forEach(mission => {
      const securityCode = mission.security_code || 'NULL';
      const completionCode = mission.completion_code || 'NULL';
      const driverName = mission.driver_name || 'N/A';
      const shipperName = mission.shipper_name || 'N/A';
      const createdAt = new Date(mission.created_at).toLocaleDateString('fr-FR');
      
      console.log(`${mission.id.toString().padStart(2)} | ${mission.mission_number.padEnd(15)} | ${mission.status.padEnd(8)} | ${securityCode.padEnd(13)} | ${completionCode.padEnd(16)} | ${driverName.padEnd(15)} | ${shipperName.padEnd(15)} | ${mission.demand_count.toString().padStart(7)} | ${mission.parcel_count.toString().padStart(7)} | ${createdAt}`);
    });
    
    console.log('-'.repeat(80));
    console.log(`Total missions: ${missionsResult.rows.length}`);
    
    // Show status distribution
    console.log('\n📊 STATUS DISTRIBUTION:');
    console.log('-'.repeat(30));
    const statusCount = {};
    missionsResult.rows.forEach(mission => {
      statusCount[mission.status] = (statusCount[mission.status] || 0) + 1;
    });
    
    Object.entries(statusCount).forEach(([status, count]) => {
      console.log(`${status.padEnd(15)}: ${count}`);
    });
    
    // Show missions with security codes
    console.log('\n🔐 MISSIONS WITH SECURITY CODES:');
    console.log('-'.repeat(40));
    const missionsWithSecurityCodes = missionsResult.rows.filter(m => m.security_code);
    missionsWithSecurityCodes.forEach(mission => {
      console.log(`Mission #${mission.id} (${mission.mission_number}): ${mission.security_code}`);
    });
    
    // Show missions with completion codes
    console.log('\n✅ MISSIONS WITH COMPLETION CODES:');
    console.log('-'.repeat(40));
    const missionsWithCompletionCodes = missionsResult.rows.filter(m => m.completion_code);
    missionsWithCompletionCodes.forEach(mission => {
      console.log(`Mission #${mission.id} (${mission.mission_number}): ${mission.completion_code}`);
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ MISSION TABLE DISPLAY COMPLETE');
    
  } catch (error) {
    console.error('❌ Error showing mission table:', error);
  } finally {
    client.release();
  }
}

showMissionTable()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  }); 