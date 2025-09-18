const { Pool } = require('pg');
require('dotenv').config({ path: './config.env' });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

async function createTestPickupMissions() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 CREATING TEST PICKUP MISSIONS\n');
    console.log('=' .repeat(60));
    
    // Step 1: Check what we have to work with
    console.log('📋 Step 1: Checking available resources...');
    
    // Check available drivers
    const driversResult = await client.query(`
      SELECT id, name, agency, status 
      FROM drivers 
      WHERE status = 'Disponible' OR status IS NULL
      LIMIT 5
    `);
    
    console.log(`📊 Available drivers: ${driversResult.rows.length}`);
    driversResult.rows.forEach((driver, index) => {
      console.log(`  ${index + 1}. ${driver.name} (${driver.agency || 'No agency'})`);
    });
    
    // Check accepted demands
    const demandsResult = await client.query(`
      SELECT id, expediteur_name, expediteur_agency, status, created_at
      FROM demands 
      WHERE status = 'Accepted'
      AND NOT EXISTS (
        SELECT 1 FROM mission_demands md 
        INNER JOIN pickup_missions pm ON md.mission_id = pm.id 
        WHERE md.demand_id = demands.id
      )
      LIMIT 5
    `);
    
    console.log(`📊 Available accepted demands: ${demandsResult.rows.length}`);
    demandsResult.rows.forEach((demand, index) => {
      console.log(`  ${index + 1}. ${demand.expediteur_name} (${demand.expediteur_agency || 'No agency'})`);
    });
    
    if (driversResult.rows.length === 0) {
      console.log('❌ No drivers available. Cannot create missions.');
      return;
    }
    
    if (demandsResult.rows.length === 0) {
      console.log('❌ No accepted demands available. Cannot create missions.');
      return;
    }
    
    // Step 2: Create pickup missions
    console.log('\n📋 Step 2: Creating pickup missions...');
    
    let missionsCreated = 0;
    
    for (let i = 0; i < Math.min(3, demandsResult.rows.length); i++) {
      const driver = driversResult.rows[i % driversResult.rows.length];
      const demand = demandsResult.rows[i];
      
      try {
        // Generate mission number
        const missionNumber = `PM-${Date.now()}-${i + 1}`;
        
        // Get driver's agency for the mission
        const driverAgency = driver.agency || 'Default Agency';
        
        // Create pickup mission
        const createMissionResult = await client.query(`
          INSERT INTO pickup_missions (
            mission_number, driver_id, shipper_id, scheduled_date, 
            created_by, status, agency
          )
          VALUES ($1, $2, $3, $4, $5, 'En attente', $6)
          RETURNING id
        `, [
          missionNumber,
          driver.id,
          demand.id, // Using demand.id as shipper_id for simplicity
          new Date(),
          1, // Assuming user ID 1 is admin
          driverAgency
        ]);
        
        const missionId = createMissionResult.rows[0].id;
        
        // Link demand to mission
        await client.query(`
          INSERT INTO mission_demands (mission_id, demand_id, added_at)
          VALUES ($1, $2, $3)
        `, [missionId, demand.id, new Date()]);
        
        console.log(`✅ Created mission ${missionNumber} for driver ${driver.name} with demand from ${demand.expediteur_name}`);
        missionsCreated++;
        
      } catch (error) {
        console.error(`❌ Error creating mission ${i + 1}:`, error.message);
      }
    }
    
    // Step 3: Verify what was created
    console.log('\n📋 Step 3: Verifying created missions...');
    
    const verifyResult = await client.query(`
      SELECT 
        pm.id,
        pm.mission_number,
        pm.status,
        pm.agency,
        d.name as driver_name,
        d.agency as driver_agency,
        COUNT(md.demand_id) as demand_count
      FROM pickup_missions pm
      LEFT JOIN drivers d ON pm.driver_id = d.id
      LEFT JOIN mission_demands md ON pm.id = md.mission_id
      GROUP BY pm.id, pm.mission_number, pm.status, pm.agency, d.name, d.agency
      ORDER BY pm.created_at DESC
    `);
    
    console.log(`📊 Total pickup missions now: ${verifyResult.rows.length}`);
    verifyResult.rows.forEach((mission, index) => {
      console.log(`\n  Mission ${index + 1}:`);
      console.log(`    ID: ${mission.id}`);
      console.log(`    Number: ${mission.mission_number}`);
      console.log(`    Status: ${mission.status}`);
      console.log(`    Agency: ${mission.agency}`);
      console.log(`    Driver: ${mission.driver_name} (${mission.driver_agency})`);
      console.log(`    Demands: ${mission.demand_count}`);
    });
    
    console.log(`\n🎉 Successfully created ${missionsCreated} test pickup missions!`);
    console.log('🔧 Now when you refresh your frontend, you should see missions displayed.');
    
  } catch (error) {
    console.error('❌ Error creating test pickup missions:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createTestPickupMissions()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });










