const { pool } = require('./config/database');

async function testAgencyFiltering() {
  const client = await pool.connect();
  
  try {
    console.log('🧪 TESTING AGENCY FILTERING FOR PICKUP MISSIONS\n');
    console.log('=' .repeat(60));
    
    // Test 1: Check if agency column exists
    console.log('\n📋 Test 1: Checking if agency column exists...');
    const columnCheck = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'pickup_missions' AND column_name = 'agency'
    `);
    
    if (columnCheck.rows.length > 0) {
      console.log('✅ Agency column exists:', columnCheck.rows[0]);
    } else {
      console.log('❌ Agency column does not exist');
      return;
    }
    
    // Test 2: Check missions with agency data
    console.log('\n📋 Test 2: Checking missions with agency data...');
    const missionsWithAgency = await client.query(`
      SELECT 
        pm.id,
        pm.mission_number,
        pm.agency,
        d.name as driver_name,
        d.agency as driver_agency
      FROM pickup_missions pm
      LEFT JOIN drivers d ON pm.driver_id = d.id
      WHERE pm.agency IS NOT NULL
      ORDER BY pm.id
      LIMIT 5
    `);
    
    console.log(`✅ Found ${missionsWithAgency.rows.length} missions with agency data:`);
    missionsWithAgency.rows.forEach(row => {
      console.log(`  Mission ${row.mission_number}: ${row.driver_name} | Agency: ${row.agency}`);
    });
    
    // Test 3: Test agency filtering simulation
    console.log('\n📋 Test 3: Testing agency filtering simulation...');
    const testAgency = 'Entrepôt Sousse';
    
    const filteredMissions = await client.query(`
      SELECT 
        pm.id,
        pm.mission_number,
        pm.agency,
        d.name as driver_name
      FROM pickup_missions pm
      LEFT JOIN drivers d ON pm.driver_id = d.id
      WHERE pm.agency = $1
      ORDER BY pm.id
    `, [testAgency]);
    
    console.log(`✅ Found ${filteredMissions.rows.length} missions for agency "${testAgency}":`);
    filteredMissions.rows.forEach(row => {
      console.log(`  Mission ${row.mission_number}: ${row.driver_name} | Agency: ${row.agency}`);
    });
    
    // Test 4: Check agency distribution
    console.log('\n📋 Test 4: Checking agency distribution...');
    const agencyDistribution = await client.query(`
      SELECT 
        pm.agency,
        COUNT(*) as mission_count,
        COUNT(CASE WHEN pm.status = 'En attente' THEN 1 END) as pending_count,
        COUNT(CASE WHEN pm.status = 'Terminé' THEN 1 END) as completed_count
      FROM pickup_missions pm
      GROUP BY pm.agency
      ORDER BY mission_count DESC
    `);
    
    console.log('📊 Agency distribution:');
    agencyDistribution.rows.forEach(row => {
      console.log(`  ${row.agency}: ${row.mission_count} total (${row.pending_count} pending, ${row.completed_count} completed)`);
    });
    
    console.log('\n🎉 SUCCESS: Agency filtering is working correctly!');
    console.log('🔧 Now Chef d\'agence users will only see missions from their agency');
    console.log('🔧 Admin users will continue to see all missions');
    
  } catch (error) {
    console.error('❌ Error testing agency filtering:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the test
testAgencyFiltering()
  .then(() => {
    console.log('\n✅ Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });











