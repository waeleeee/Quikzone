const { Pool } = require('pg');
require('dotenv').config({ path: './config.env' });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

async function addAgencyToPickupMissions() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Adding agency column to pickup_missions table...');
    
    // Step 1: Add the agency column
    console.log('📋 Step 1: Adding agency column...');
    await client.query(`
      ALTER TABLE pickup_missions 
      ADD COLUMN IF NOT EXISTS agency VARCHAR(100)
    `);
    console.log('✅ Agency column added successfully!');
    
    // Step 2: Populate existing missions with driver agency data
    console.log('📋 Step 2: Populating existing missions with driver agency data...');
    const updateResult = await client.query(`
      UPDATE pickup_missions 
      SET agency = d.agency
      FROM drivers d
      WHERE pickup_missions.driver_id = d.id 
      AND pickup_missions.agency IS NULL
    `);
    console.log(`✅ Updated ${updateResult.rowCount} existing missions with agency data`);
    
    // Step 3: Make agency column NOT NULL after populating
    console.log('📋 Step 3: Making agency column NOT NULL...');
    await client.query(`
      ALTER TABLE pickup_missions 
      ALTER COLUMN agency SET NOT NULL
    `);
    console.log('✅ Agency column is now NOT NULL');
    
    // Step 4: Create index on agency column for better performance
    console.log('📋 Step 4: Creating index on agency column...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_pickup_missions_agency 
      ON pickup_missions(agency)
    `);
    console.log('✅ Agency index created successfully!');
    
    // Step 5: Verify the changes
    console.log('📋 Step 5: Verifying changes...');
    const verifyResult = await client.query(`
      SELECT 
        pm.id,
        pm.mission_number,
        pm.agency,
        d.name as driver_name,
        d.agency as driver_agency
      FROM pickup_missions pm
      LEFT JOIN drivers d ON pm.driver_id = d.id
      ORDER BY pm.id
      LIMIT 10
    `);
    
    console.log('📊 Sample missions with agency data:');
    verifyResult.rows.forEach(row => {
      console.log(`  Mission ${row.mission_number}: ${row.driver_name} | Agency: ${row.agency}`);
    });
    
    console.log('\n🎉 SUCCESS: Agency column added and populated successfully!');
    console.log('🔧 Now you can filter missions by agency in your API endpoints');
    
  } catch (error) {
    console.error('❌ Error adding agency column:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the function
addAgencyToPickupMissions()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });











