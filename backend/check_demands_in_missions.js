const { pool } = require('./config/database');

async function checkDemandsInMissions() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking if demands 5, 6, 8, 9, 10 are assigned to missions...\n');
    
    // Check each specific demand
    const demandIds = [5, 6, 8, 9, 10];
    
    for (const demandId of demandIds) {
      console.log(`📋 Checking Demand #${demandId}:`);
      
      // Check if this demand is in any mission_demands
      const missionCheck = await client.query(`
        SELECT md.mission_id, md.demand_id, pm.status as mission_status, pm.created_at
        FROM mission_demands md
        INNER JOIN pickup_missions pm ON md.mission_id = pm.id
        WHERE md.demand_id = $1
        ORDER BY pm.created_at DESC
      `, [demandId]);
      
      if (missionCheck.rows.length > 0) {
        console.log(`  ❌ Demand #${demandId} IS assigned to missions:`);
        missionCheck.rows.forEach(row => {
          console.log(`    - Mission #${row.mission_id} (Status: ${row.mission_status}, Created: ${row.created_at})`);
        });
      } else {
        console.log(`  ✅ Demand #${demandId} is NOT assigned to any missions`);
      }
      
      // Also check the demand details
      const demandDetails = await client.query(`
        SELECT id, expediteur_name, expediteur_email, expediteur_agency, status, created_at
        FROM demands
        WHERE id = $1
      `, [demandId]);
      
      if (demandDetails.rows.length > 0) {
        const demand = demandDetails.rows[0];
        console.log(`  📝 Demand details: ${demand.expediteur_name} (${demand.expediteur_email}) - Agency: ${demand.expediteur_agency} - Status: ${demand.status}`);
      }
      
      console.log('');
    }
    
    // Also check all active missions
    console.log('📋 All active pickup missions:');
    const activeMissions = await client.query(`
      SELECT pm.id, pm.status, pm.created_at, 
             array_agg(md.demand_id) as demand_ids
      FROM pickup_missions pm
      LEFT JOIN mission_demands md ON pm.id = md.mission_id
      WHERE pm.status IN ('En attente', 'À enlever', 'Enlevé', 'Au dépôt')
      GROUP BY pm.id, pm.status, pm.created_at
      ORDER BY pm.created_at DESC
    `);
    
    console.log(`Found ${activeMissions.rows.length} active missions:`);
    activeMissions.rows.forEach(mission => {
      console.log(`  - Mission #${mission.id} (Status: ${mission.status}, Created: ${mission.created_at})`);
      if (mission.demand_ids && mission.demand_ids[0] !== null) {
        console.log(`    Demands: ${mission.demand_ids.join(', ')}`);
      } else {
        console.log(`    Demands: None`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error checking demands in missions:', error);
  } finally {
    client.release();
  }
}

checkDemandsInMissions()
  .then(() => {
    console.log('\n✅ Check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Check failed:', error);
    process.exit(1);
  }); 