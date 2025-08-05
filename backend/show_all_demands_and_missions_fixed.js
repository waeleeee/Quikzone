const { pool } = require('./config/database');

async function showAllDemandsAndMissions() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 SHOWING ALL DEMANDS AND MISSIONS\n');
    console.log('=' .repeat(80));
    
    // 1. ALL DEMANDS (all statuses)
    console.log('\n📋 1. ALL DEMANDS (All Statuses):');
    console.log('-'.repeat(50));
    const allDemands = await client.query(`
      SELECT id, expediteur_name, expediteur_email, expediteur_agency, status, created_at
      FROM demands 
      ORDER BY id
    `);
    
    console.log(`Total Demands: ${allDemands.rows.length}`);
    allDemands.rows.forEach(demand => {
      const statusColor = demand.status === 'Accepted' ? '✅' : 
                         demand.status === 'Pending' ? '⏳' : 
                         demand.status === 'Completed' ? '🎉' : '❓';
      console.log(`${statusColor} ID: ${demand.id} | ${demand.expediteur_name} | Agency: ${demand.expediteur_agency} | Status: ${demand.status}`);
    });
    
    // 2. ALL PICKUP MISSIONS (with correct column names)
    console.log('\n📋 2. ALL PICKUP MISSIONS:');
    console.log('-'.repeat(50));
    const allMissions = await client.query(`
      SELECT id, status, created_at, completion_code
      FROM pickup_missions 
      ORDER BY id
    `);
    
    console.log(`Total Pickup Missions: ${allMissions.rows.length}`);
    allMissions.rows.forEach(mission => {
      const statusColor = mission.status === 'En attente' ? '⏳' : 
                         mission.status === 'À enlever' ? '🚚' : 
                         mission.status === 'Enlevé' ? '✅' : 
                         mission.status === 'Au dépôt' ? '🏢' : '❓';
      console.log(`${statusColor} Mission #${mission.id} | Status: ${mission.status} | Code: ${mission.completion_code || 'N/A'}`);
    });
    
    // 3. MISSION-DEMAND RELATIONSHIPS
    console.log('\n📋 3. MISSION-DEMAND RELATIONSHIPS:');
    console.log('-'.repeat(50));
    const missionDemands = await client.query(`
      SELECT md.mission_id, md.demand_id, pm.status as mission_status,
             d.expediteur_name, d.expediteur_agency, d.status as demand_status
      FROM mission_demands md
      INNER JOIN pickup_missions pm ON md.mission_id = pm.id
      INNER JOIN demands d ON md.demand_id = d.id
      ORDER BY md.mission_id, md.demand_id
    `);
    
    console.log(`Total Mission-Demand Relationships: ${missionDemands.rows.length}`);
    if (missionDemands.rows.length > 0) {
      missionDemands.rows.forEach(rel => {
        console.log(`🔗 Mission #${rel.mission_id} (${rel.mission_status}) -> Demand #${rel.demand_id} (${rel.expediteur_name} - ${rel.expediteur_agency})`);
      });
    } else {
      console.log('No mission-demand relationships found');
    }
    
    // 4. SUMMARY BY STATUS
    console.log('\n📋 4. SUMMARY BY STATUS:');
    console.log('-'.repeat(50));
    
    // Demands by status
    const demandsByStatus = await client.query(`
      SELECT status, COUNT(*) as count
      FROM demands 
      GROUP BY status
      ORDER BY status
    `);
    
    console.log('Demands by Status:');
    demandsByStatus.rows.forEach(row => {
      console.log(`  ${row.status}: ${row.count} demands`);
    });
    
    // Missions by status
    const missionsByStatus = await client.query(`
      SELECT status, COUNT(*) as count
      FROM pickup_missions 
      GROUP BY status
      ORDER BY status
    `);
    
    console.log('\nMissions by Status:');
    missionsByStatus.rows.forEach(row => {
      console.log(`  ${row.status}: ${row.count} missions`);
    });
    
    // 5. AVAILABLE DEMANDS (for new missions)
    console.log('\n📋 5. DEMANDS AVAILABLE FOR NEW MISSIONS:');
    console.log('-'.repeat(50));
    const availableDemands = await client.query(`
      SELECT d.id, d.expediteur_name, d.expediteur_email, d.expediteur_agency, d.status
      FROM demands d
      WHERE d.status = 'Accepted' 
      AND d.id NOT IN (
        SELECT DISTINCT md.demand_id 
        FROM mission_demands md 
        INNER JOIN pickup_missions pm ON md.mission_id = pm.id 
        WHERE pm.status IN ('En attente', 'À enlever', 'Enlevé', 'Au dépôt')
      )
      ORDER BY d.id
    `);
    
    console.log(`Available Demands: ${availableDemands.rows.length}`);
    availableDemands.rows.forEach(demand => {
      console.log(`✅ ID: ${demand.id} | ${demand.expediteur_name} | Agency: ${demand.expediteur_agency}`);
    });
    
    // 6. ASSIGNED DEMANDS (in active missions)
    console.log('\n📋 6. DEMANDS ASSIGNED TO ACTIVE MISSIONS:');
    console.log('-'.repeat(50));
    const assignedDemands = await client.query(`
      SELECT DISTINCT d.id, d.expediteur_name, d.expediteur_agency, d.status,
             md.mission_id, pm.status as mission_status
      FROM demands d
      INNER JOIN mission_demands md ON d.id = md.demand_id
      INNER JOIN pickup_missions pm ON md.mission_id = pm.id
      WHERE pm.status IN ('En attente', 'À enlever', 'Enlevé', 'Au dépôt')
      ORDER BY md.mission_id, d.id
    `);
    
    console.log(`Assigned Demands: ${assignedDemands.rows.length}`);
    assignedDemands.rows.forEach(demand => {
      console.log(`🔗 Demand #${demand.id} (${demand.expediteur_name}) -> Mission #${demand.mission_id} (${demand.mission_status})`);
    });
    
    // 7. COMPLETED MISSIONS
    console.log('\n📋 7. COMPLETED MISSIONS:');
    console.log('-'.repeat(50));
    const completedMissions = await client.query(`
      SELECT id, status, completion_code, created_at
      FROM pickup_missions 
      WHERE status NOT IN ('En attente', 'À enlever', 'Enlevé', 'Au dépôt')
      ORDER BY id
    `);
    
    console.log(`Completed Missions: ${completedMissions.rows.length}`);
    completedMissions.rows.forEach(mission => {
      console.log(`🎉 Mission #${mission.id} | Status: ${mission.status} | Code: ${mission.completion_code || 'N/A'}`);
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ COMPLETE OVERVIEW FINISHED');
    
  } catch (error) {
    console.error('❌ Error showing all demands and missions:', error);
  } finally {
    client.release();
  }
}

showAllDemandsAndMissions()
  .then(() => {
    console.log('\n✅ Overview completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Overview failed:', error);
    process.exit(1);
  }); 