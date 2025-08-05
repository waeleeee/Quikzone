const { pool } = require('../config/database');

async function checkMissionParcelsStructure() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 CHECKING MISSION PARCELS STRUCTURE\n');
    console.log('='.repeat(60));
    
    // Check mission_parcels table structure
    const tableStructure = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'mission_parcels'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 MISSION_PARCELS TABLE STRUCTURE:');
    console.log('-'.repeat(50));
    tableStructure.rows.forEach(col => {
      console.log(`${col.column_name.padEnd(20)} | ${col.data_type.padEnd(15)} | ${col.is_nullable}`);
    });
    
    // Check demand_parcels table structure
    const demandParcelsStructure = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'demand_parcels'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 DEMAND_PARCELS TABLE STRUCTURE:');
    console.log('-'.repeat(50));
    demandParcelsStructure.rows.forEach(col => {
      console.log(`${col.column_name.padEnd(20)} | ${col.data_type.padEnd(15)} | ${col.is_nullable}`);
    });
    
    // Check mission_demands table structure
    const missionDemandsStructure = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'mission_demands'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 MISSION_DEMANDS TABLE STRUCTURE:');
    console.log('-'.repeat(50));
    missionDemandsStructure.rows.forEach(col => {
      console.log(`${col.column_name.padEnd(20)} | ${col.data_type.padEnd(15)} | ${col.is_nullable}`);
    });
    
    // Check actual data for mission #15
    console.log('\n🔍 ACTUAL DATA FOR MISSION #15:');
    console.log('-'.repeat(50));
    
    // Mission parcels
    const missionParcels = await client.query(`
      SELECT * FROM mission_parcels WHERE mission_id = 15
    `);
    
    console.log('📦 MISSION_PARCELS for mission 15:');
    console.log(missionParcels.rows);
    
    // Mission demands
    const missionDemands = await client.query(`
      SELECT * FROM mission_demands WHERE mission_id = 15
    `);
    
    console.log('\n📋 MISSION_DEMANDS for mission 15:');
    console.log(missionDemands.rows);
    
    // Demand parcels for the demands in mission 15
    const demandIds = missionDemands.rows.map(md => md.demand_id);
    if (demandIds.length > 0) {
      const demandParcels = await client.query(`
        SELECT * FROM demand_parcels WHERE demand_id = ANY($1)
      `, [demandIds]);
      
      console.log('\n📦 DEMAND_PARCELS for demands in mission 15:');
      console.log(demandParcels.rows);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ MISSION PARCELS STRUCTURE CHECK COMPLETE');
    
  } catch (error) {
    console.error('❌ Error checking mission parcels structure:', error);
  } finally {
    client.release();
  }
}

checkMissionParcelsStructure()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  }); 