const { pool } = require('./config/database');

async function debugDemandsFiltering() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Debugging demands filtering...\n');
    
    // 1. Get all demands with "Accepted" status
    console.log('📋 1. All demands with "Accepted" status:');
    const acceptedDemands = await client.query(`
      SELECT id, expediteur_name, expediteur_email, status, created_at
      FROM demands 
      WHERE status = 'Accepted'
      ORDER BY id
    `);
    
    console.log(`Found ${acceptedDemands.rows.length} accepted demands:`);
    acceptedDemands.rows.forEach(demand => {
      console.log(`  - ID: ${demand.id}, Expéditeur: ${demand.expediteur_name}, Email: ${demand.expediteur_email}`);
    });
    
    // 2. Get all pickup missions
    console.log('\n📋 2. All pickup missions:');
    const missions = await client.query(`
      SELECT id, status, created_at
      FROM pickup_missions
      ORDER BY id
    `);
    
    console.log(`Found ${missions.rows.length} pickup missions:`);
    missions.rows.forEach(mission => {
      console.log(`  - ID: ${mission.id}, Status: ${mission.status}`);
    });
    
    // 3. Get all mission_demands relationships
    console.log('\n📋 3. All mission_demands relationships:');
    const missionDemands = await client.query(`
      SELECT md.mission_id, md.demand_id, pm.status as mission_status
      FROM mission_demands md
      INNER JOIN pickup_missions pm ON md.mission_id = pm.id
      ORDER BY md.mission_id, md.demand_id
    `);
    
    console.log(`Found ${missionDemands.rows.length} mission-demand relationships:`);
    missionDemands.rows.forEach(rel => {
      console.log(`  - Mission ${rel.mission_id} (${rel.mission_status}) -> Demand ${rel.demand_id}`);
    });
    
    // 4. Check which demands should be filtered out
    console.log('\n📋 4. Demands that should be filtered out (already in active missions):');
    const filteredDemands = await client.query(`
      SELECT DISTINCT d.id, d.expediteur_name, d.expediteur_email
      FROM demands d
      INNER JOIN mission_demands md ON d.id = md.demand_id
      INNER JOIN pickup_missions pm ON md.mission_id = pm.id
      WHERE d.status = 'Accepted' 
      AND pm.status IN ('En attente', 'À enlever', 'Enlevé', 'Au dépôt')
      ORDER BY d.id
    `);
    
    console.log(`Found ${filteredDemands.rows.length} demands that should be filtered out:`);
    filteredDemands.rows.forEach(demand => {
      console.log(`  - ID: ${demand.id}, Expéditeur: ${demand.expediteur_name}, Email: ${demand.expediteur_email}`);
    });
    
    // 5. Check which demands should be available (not in missions)
    console.log('\n📋 5. Demands that should be available (not in active missions):');
    const availableDemands = await client.query(`
      SELECT d.id, d.expediteur_name, d.expediteur_email
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
    
    console.log(`Found ${availableDemands.rows.length} demands that should be available:`);
    availableDemands.rows.forEach(demand => {
      console.log(`  - ID: ${demand.id}, Expéditeur: ${demand.expediteur_name}, Email: ${demand.expediteur_email}`);
    });
    
    // 6. Check the exact query that should be used
    console.log('\n📋 6. Testing the exact query used by the API:');
    const testQuery = await client.query(`
      SELECT 
        d.*,
        u.first_name as reviewer_first_name,
        u.last_name as reviewer_last_name,
        COALESCE(COUNT(dp.parcel_id), 0) as parcel_count
      FROM demands d
      LEFT JOIN users u ON d.reviewed_by = u.id
      LEFT JOIN demand_parcels dp ON d.id = dp.demand_id
      WHERE d.status = 'Accepted'
      AND d.id NOT IN (
        SELECT DISTINCT md.demand_id 
        FROM mission_demands md 
        INNER JOIN pickup_missions pm ON md.mission_id = pm.id 
        WHERE pm.status IN ('En attente', 'À enlever', 'Enlevé', 'Au dépôt')
      )
      GROUP BY d.id, u.first_name, u.last_name
      ORDER BY d.created_at DESC
    `);
    
    console.log(`API query returns ${testQuery.rows.length} demands:`);
    testQuery.rows.forEach(demand => {
      console.log(`  - ID: ${demand.id}, Expéditeur: ${demand.expediteur_name}, Email: ${demand.expediteur_email}`);
    });
    
  } catch (error) {
    console.error('❌ Error debugging demands filtering:', error);
  } finally {
    client.release();
  }
}

debugDemandsFiltering()
  .then(() => {
    console.log('\n✅ Debug completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Debug failed:', error);
    process.exit(1);
  }); 