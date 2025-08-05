const { pool } = require('../config/database');

async function addInMissionField() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Adding in_mission field to demands table...');
    
    // Check if the column already exists
    const columnExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'demands' 
        AND column_name = 'in_mission'
      );
    `);
    
    if (columnExists.rows[0].exists) {
      console.log('✅ in_mission column already exists');
    } else {
      // Add the in_mission column
      await client.query(`
        ALTER TABLE demands 
        ADD COLUMN in_mission BOOLEAN DEFAULT FALSE
      `);
      console.log('✅ Added in_mission column to demands table');
    }
    
    // Update existing demands based on current mission assignments
    console.log('🔄 Updating existing demands...');
    await client.query(`
      UPDATE demands 
      SET in_mission = TRUE 
      WHERE id IN (
        SELECT DISTINCT md.demand_id 
        FROM mission_demands md 
        INNER JOIN pickup_missions pm ON md.mission_id = pm.id
      )
    `);
    
    // Check how many demands were updated
    const updatedCount = await client.query(`
      SELECT COUNT(*) as count 
      FROM demands 
      WHERE in_mission = TRUE
    `);
    
    console.log(`✅ Updated ${updatedCount.rows[0].count} demands to in_mission = TRUE`);
    
    // Show current status
    const allDemands = await client.query(`
      SELECT id, expediteur_name, in_mission 
      FROM demands 
      ORDER BY id
    `);
    
    console.log('\n📋 Current demands status:');
    allDemands.rows.forEach(demand => {
      const status = demand.in_mission ? '❌ In Mission' : '✅ Available';
      console.log(`  ${status} - Demand #${demand.id}: ${demand.expediteur_name}`);
    });
    
  } catch (error) {
    console.error('❌ Error adding in_mission field:', error);
  } finally {
    client.release();
  }
}

addInMissionField()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  }); 