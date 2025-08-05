const { pool } = require('./config/database');

async function testUpdatedFiltering() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 TESTING UPDATED FILTERING LOGIC\n');
    console.log('=' .repeat(80));
    
    // Test the new filtering logic (exclude from ALL missions)
    console.log('\n📋 UPDATED FILTERING LOGIC (exclude from ALL missions):');
    console.log('-'.repeat(50));
    const updatedFilteredDemands = await client.query(`
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
    
    console.log(`Updated filtered demands: ${updatedFilteredDemands.rows.length}`);
    updatedFilteredDemands.rows.forEach(demand => {
      console.log(`  ✅ Demand #${demand.id}: ${demand.expediteur_name} (${demand.expediteur_agency})`);
    });
    
    // Compare with old logic
    console.log('\n📋 OLD FILTERING LOGIC (exclude from active missions only):');
    console.log('-'.repeat(50));
    const oldFilteredDemands = await client.query(`
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
    
    console.log(`Old filtered demands: ${oldFilteredDemands.rows.length}`);
    oldFilteredDemands.rows.forEach(demand => {
      console.log(`  ✅ Demand #${demand.id}: ${demand.expediteur_name} (${demand.expediteur_agency})`);
    });
    
    console.log('\n📋 SUMMARY:');
    console.log('-'.repeat(50));
    console.log(`Old logic showed: ${oldFilteredDemands.rows.length} demands`);
    console.log(`New logic shows: ${updatedFilteredDemands.rows.length} demands`);
    console.log(`Difference: ${oldFilteredDemands.rows.length - updatedFilteredDemands.rows.length} demands hidden`);
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ TEST COMPLETE');
    
  } catch (error) {
    console.error('❌ Error testing filtering:', error);
  } finally {
    client.release();
  }
}

testUpdatedFiltering()
  .then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  }); 