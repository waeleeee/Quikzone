const { pool } = require('./config/database');

async function checkPickupTimestamps() {
  try {
    console.log('🔍 CHECKING PICKUP MISSION TIMESTAMPS\n');
    
    // 1. Check pickup_missions table structure
    console.log('📋 Pickup missions table structure:');
    console.log('=====================================');
    
    const structureQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'pickup_missions'
      ORDER BY ordinal_position
    `;
    
    const structureResult = await pool.query(structureQuery);
    structureResult.rows.forEach(row => {
      console.log(`${row.column_name.padEnd(20)} ${row.data_type.padEnd(15)} ${row.is_nullable}`);
    });
    
    // 2. Check sample pickup missions
    console.log('\n📦 Sample pickup missions:');
    console.log('=====================================');
    
    const missionsQuery = `
      SELECT 
        id,
        status,
        created_at,
        updated_at
      FROM pickup_missions
      ORDER BY created_at DESC
      LIMIT 5
    `;
    
    const missionsResult = await pool.query(missionsQuery);
    
    if (missionsResult.rows.length > 0) {
      console.log('ID'.padEnd(5) + 'Status'.padEnd(20) + 'Created'.padEnd(25) + 'Updated'.padEnd(25));
      console.log('-'.repeat(80));
      
      missionsResult.rows.forEach(row => {
        console.log(
          row.id.toString().padEnd(5) + 
          (row.status || '').padEnd(20) + 
          (row.created_at ? new Date(row.created_at).toLocaleString('fr-FR') : 'N/A').padEnd(25) + 
          (row.updated_at ? new Date(row.updated_at).toLocaleString('fr-FR') : 'N/A').padEnd(25)
        );
      });
    } else {
      console.log('No pickup missions found');
    }
    
    // 3. Check parcels with their mission data
    console.log('\n📦 Parcels with mission data:');
    console.log('=====================================');
    
    const parcelsQuery = `
      SELECT 
        p.tracking_number,
        p.status,
        p.created_at,
        p.updated_at,
        pm.id as mission_id,
        pm.status as mission_status,
        pm.created_at as mission_created_at,
        pm.updated_at as mission_updated_at
      FROM parcels p
      LEFT JOIN mission_parcels mp ON p.id = mp.parcel_id
      LEFT JOIN pickup_missions pm ON mp.mission_id = pm.id
      WHERE pm.id IS NOT NULL
      ORDER BY p.created_at DESC
      LIMIT 10
    `;
    
    const parcelsResult = await pool.query(parcelsQuery);
    
    if (parcelsResult.rows.length > 0) {
      console.log('Tracking'.padEnd(15) + 'Status'.padEnd(15) + 'Created'.padEnd(25) + 'Mission'.padEnd(15) + 'Mission Status'.padEnd(20) + 'Mission Updated'.padEnd(25));
      console.log('-'.repeat(120));
      
      parcelsResult.rows.forEach(row => {
        console.log(
          (row.tracking_number || '').padEnd(15) + 
          (row.status || '').padEnd(15) + 
          (row.created_at ? new Date(row.created_at).toLocaleString('fr-FR') : 'N/A').padEnd(25) + 
          (row.mission_id || 'N/A').toString().padEnd(15) + 
          (row.mission_status || 'N/A').padEnd(20) + 
          (row.mission_updated_at ? new Date(row.mission_updated_at).toLocaleString('fr-FR') : 'N/A').padEnd(25)
        );
      });
    } else {
      console.log('No parcels with mission data found');
    }
    
    console.log('\n✅ TIMESTAMP ANALYSIS COMPLETED!');
    console.log('=====================================');
    
  } catch (error) {
    console.error('❌ Error checking pickup timestamps:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await pool.end();
  }
}

// Run the check
checkPickupTimestamps(); 