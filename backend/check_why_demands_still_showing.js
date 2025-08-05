const { pool } = require('./config/database');

async function checkWhyDemandsStillShowing() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 CHECKING WHY DEMANDS ARE STILL SHOWING\n');
    console.log('=' .repeat(80));
    
    // 1. Check ALL missions (not just active ones)
    console.log('\n📋 1. ALL MISSIONS (including completed):');
    console.log('-'.repeat(50));
    const allMissions = await client.query(`
      SELECT id, status, created_at
      FROM pickup_missions 
      ORDER BY id
    `);
    
    console.log(`Total Missions: ${allMissions.rows.length}`);
    allMissions.rows.forEach(mission => {
      console.log(`  - Mission #${mission.id}: ${mission.status}`);
    });
    
    // 2. Check ALL mission-demand relationships
    console.log('\n📋 2. ALL MISSION-DEMAND RELATIONSHIPS:');
    console.log('-'.repeat(50));
    const allRelationships = await client.query(`
      SELECT md.mission_id, md.demand_id, pm.status as mission_status
      FROM mission_demands md
      INNER JOIN pickup_missions pm ON md.mission_id = pm.id
      ORDER BY md.mission_id, md.demand_id
    `);
    
    console.log(`Total Relationships: ${allRelationships.rows.length}`);
    allRelationships.rows.forEach(rel => {
      console.log(`  - Mission #${rel.mission_id} (${rel.mission_status}) -> Demand #${rel.demand_id}`);
    });
    
    // 3. Check which demands are in ANY mission (not just active)
    console.log('\n📋 3. DEMANDS IN ANY MISSION:');
    console.log('-'.repeat(50));
    const demandsInAnyMission = await client.query(`
      SELECT DISTINCT d.id, d.expediteur_name, d.expediteur_agency
      FROM demands d
      INNER JOIN mission_demands md ON d.id = md.demand_id
      INNER JOIN pickup_missions pm ON md.mission_id = pm.id
      WHERE d.status = 'Accepted'
      ORDER BY d.id
    `);
    
    console.log(`Demands in ANY mission: ${demandsInAnyMission.rows.length}`);
    demandsInAnyMission.rows.forEach(demand => {
      console.log(`  ❌ Demand #${demand.id}: ${demand.expediteur_name} (${demand.expediteur_agency})`);
    });
    
    // 4. Check which demands are NOT in ANY mission
    console.log('\n📋 4. DEMANDS NOT IN ANY MISSION:');
    console.log('-'.repeat(50));
    const demandsNotInAnyMission = await client.query(`
      SELECT d.id, d.expediteur_name, d.expediteur_agency
      FROM demands d
      WHERE d.status = 'Accepted' 
      AND d.id NOT IN (
        SELECT DISTINCT md.demand_id 
        FROM mission_demands md 
        INNER JOIN pickup_missions pm ON md.mission_id = pm.id
      )
      ORDER BY d.id
    `);
    
    console.log(`Demands NOT in ANY mission: ${demandsNotInAnyMission.rows.length}`);
    demandsNotInAnyMission.rows.forEach(demand => {
      console.log(`  ✅ Demand #${demand.id}: ${demand.expediteur_name} (${demand.expediteur_agency})`);
    });
    
    // 5. Test the current filtering logic (only active missions)
    console.log('\n📋 5. CURRENT FILTERING LOGIC (only active missions):');
    console.log('-'.repeat(50));
    const currentFilteredDemands = await client.query(`
      SELECT d.id, d.expediteur_name, d.expediteur_agency
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
    
    console.log(`Current filtered demands: ${currentFilteredDemands.rows.length}`);
    currentFilteredDemands.rows.forEach(demand => {
      console.log(`  ✅ Demand #${demand.id}: ${demand.expediteur_name} (${demand.expediteur_agency})`);
    });
    
    // 6. Check if there are any missions with status that should be excluded
    console.log('\n📋 6. ALL MISSION STATUSES:');
    console.log('-'.repeat(50));
    const allStatuses = await client.query(`
      SELECT status, COUNT(*) as count
      FROM pickup_missions 
      GROUP BY status
      ORDER BY status
    `);
    
    allStatuses.rows.forEach(row => {
      console.log(`  - ${row.status}: ${row.count} missions`);
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('🔍 ANALYSIS COMPLETE');
    
  } catch (error) {
    console.error('❌ Error checking demands:', error);
  } finally {
    client.release();
  }
}

checkWhyDemandsStillShowing()
  .then(() => {
    console.log('\n✅ Check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Check failed:', error);
    process.exit(1);
  }); 