const { pool } = require('./config/database');

async function showMissionTable() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 SHOWING PICKUP MISSIONS TABLE\n');
    console.log('=' .repeat(80));
    
    // 1. Table Structure
    console.log('\n📋 1. TABLE STRUCTURE:');
    console.log('-'.repeat(50));
    const tableStructure = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'pickup_missions' 
      ORDER BY ordinal_position
    `);
    
    console.log('Pickup Missions Table Columns:');
    tableStructure.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default})`);
    });
    
    // 2. All Mission Data
    console.log('\n📋 2. ALL MISSION DATA:');
    console.log('-'.repeat(50));
    const allMissions = await client.query(`
      SELECT *
      FROM pickup_missions 
      ORDER BY id
    `);
    
    console.log(`Total Missions: ${allMissions.rows.length}`);
    if (allMissions.rows.length > 0) {
      console.log('\nMission Details:');
      allMissions.rows.forEach((mission, index) => {
        console.log(`\n--- Mission #${index + 1} ---`);
        Object.keys(mission).forEach(key => {
          const value = mission[key];
          const displayValue = value === null ? 'NULL' : value;
          console.log(`  ${key}: ${displayValue}`);
        });
      });
    } else {
      console.log('No missions found in the table');
    }
    
    // 3. Missions with Driver Information (if available)
    console.log('\n📋 3. MISSIONS WITH DRIVER INFO:');
    console.log('-'.repeat(50));
    try {
      const missionsWithDrivers = await client.query(`
        SELECT pm.*, d.name as driver_name, d.email as driver_email, d.agency as driver_agency
        FROM pickup_missions pm
        LEFT JOIN drivers d ON pm.driver_id = d.id
        ORDER BY pm.id
      `);
      
      console.log(`Missions with Driver Info: ${missionsWithDrivers.rows.length}`);
      missionsWithDrivers.rows.forEach(mission => {
        const statusColor = mission.status === 'En attente' ? '⏳' : 
                           mission.status === 'À enlever' ? '🚚' : 
                           mission.status === 'Enlevé' ? '✅' : 
                           mission.status === 'Au dépôt' ? '🏢' : '❓';
        console.log(`${statusColor} Mission #${mission.id} | Status: ${mission.status} | Driver: ${mission.driver_name || 'N/A'} | Agency: ${mission.driver_agency || 'N/A'}`);
      });
    } catch (error) {
      console.log('Could not fetch driver information (driver_id column might not exist)');
    }
    
    // 4. Mission Status Summary
    console.log('\n📋 4. MISSION STATUS SUMMARY:');
    console.log('-'.repeat(50));
    const statusSummary = await client.query(`
      SELECT status, COUNT(*) as count
      FROM pickup_missions 
      GROUP BY status
      ORDER BY status
    `);
    
    statusSummary.rows.forEach(row => {
      const statusColor = row.status === 'En attente' ? '⏳' : 
                         row.status === 'À enlever' ? '🚚' : 
                         row.status === 'Enlevé' ? '✅' : 
                         row.status === 'Au dépôt' ? '🏢' : '❓';
      console.log(`${statusColor} ${row.status}: ${row.count} missions`);
    });
    
    // 5. Missions with Completion Codes
    console.log('\n📋 5. MISSIONS WITH COMPLETION CODES:');
    console.log('-'.repeat(50));
    const missionsWithCodes = await client.query(`
      SELECT id, status, completion_code, created_at
      FROM pickup_missions 
      WHERE completion_code IS NOT NULL
      ORDER BY id
    `);
    
    console.log(`Missions with Completion Codes: ${missionsWithCodes.rows.length}`);
    missionsWithCodes.rows.forEach(mission => {
      console.log(`🎉 Mission #${mission.id} | Status: ${mission.status} | Code: ${mission.completion_code}`);
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ MISSION TABLE OVERVIEW FINISHED');
    
  } catch (error) {
    console.error('❌ Error showing mission table:', error);
  } finally {
    client.release();
  }
}

showMissionTable()
  .then(() => {
    console.log('\n✅ Mission table overview completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Mission table overview failed:', error);
    process.exit(1);
  }); 