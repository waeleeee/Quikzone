const { pool } = require('./config/database');

async function testSimpleFiltering() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 TESTING SIMPLE FILTERING WITH in_mission FIELD\n');
    console.log('=' .repeat(80));
    
    // Test the simple filtering logic
    console.log('\n📋 SIMPLE FILTERING (using in_mission field):');
    console.log('-'.repeat(50));
    const simpleFilteredDemands = await client.query(`
      SELECT d.id, d.expediteur_name, d.expediteur_agency, d.in_mission
      FROM demands d
      WHERE d.status = 'Accepted' 
      AND d.in_mission = FALSE
      ORDER BY d.id
    `);
    
    console.log(`Available demands (in_mission = FALSE): ${simpleFilteredDemands.rows.length}`);
    simpleFilteredDemands.rows.forEach(demand => {
      console.log(`  ✅ Demand #${demand.id}: ${demand.expediteur_name} (${demand.expediteur_agency})`);
    });
    
    // Show all demands with their in_mission status
    console.log('\n📋 ALL DEMANDS WITH in_mission STATUS:');
    console.log('-'.repeat(50));
    const allDemands = await client.query(`
      SELECT d.id, d.expediteur_name, d.expediteur_agency, d.in_mission
      FROM demands d
      WHERE d.status = 'Accepted'
      ORDER BY d.id
    `);
    
    allDemands.rows.forEach(demand => {
      const status = demand.in_mission ? '❌ In Mission' : '✅ Available';
      console.log(`  ${status} - Demand #${demand.id}: ${demand.expediteur_name} (${demand.expediteur_agency})`);
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ SIMPLE FILTERING TEST COMPLETE');
    
  } catch (error) {
    console.error('❌ Error testing simple filtering:', error);
  } finally {
    client.release();
  }
}

testSimpleFiltering()
  .then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  }); 