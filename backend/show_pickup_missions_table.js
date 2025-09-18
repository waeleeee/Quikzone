const { Pool } = require('pg');
require('dotenv').config({ path: './config.env' });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

async function showPickupMissionsTable() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 PICKUP MISSIONS TABLE ANALYSIS\n');
    console.log('=' .repeat(60));
    
    // Step 1: Show table structure
    console.log('📋 Step 1: Table Structure');
    console.log('-' .repeat(40));
    
    const structureResult = await client.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = 'pickup_missions' 
      ORDER BY ordinal_position
    `);
    
    console.log('📊 Table: pickup_missions');
    console.log('📊 Columns:');
    structureResult.rows.forEach((col, index) => {
      console.log(`  ${index + 1}. ${col.column_name.padEnd(25)} | ${col.data_type.padEnd(15)} | ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'} | ${col.column_default || 'No default'}`);
    });
    
    // Step 2: Show table constraints and indexes
    console.log('\n📋 Step 2: Table Constraints & Indexes');
    console.log('-' .repeat(40));
    
    const constraintsResult = await client.query(`
      SELECT 
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints tc
      LEFT JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      LEFT JOIN information_schema.constraint_column_usage ccu 
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.table_name = 'pickup_missions'
      ORDER BY tc.constraint_type, tc.constraint_name
    `);
    
    console.log('📊 Constraints:');
    constraintsResult.rows.forEach((constraint, index) => {
      if (constraint.constraint_type === 'FOREIGN KEY') {
        console.log(`  ${index + 1}. ${constraint.constraint_type.padEnd(15)} | ${constraint.column_name} → ${constraint.foreign_table_name}.${constraint.foreign_column_name}`);
      } else {
        console.log(`  ${index + 1}. ${constraint.constraint_type.padEnd(15)} | ${constraint.column_name || 'N/A'}`);
      }
    });
    
    // Step 3: Show indexes
    const indexesResult = await client.query(`
      SELECT 
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE tablename = 'pickup_missions'
      ORDER BY indexname
    `);
    
    console.log('\n📊 Indexes:');
    indexesResult.rows.forEach((index, indexNum) => {
      console.log(`  ${indexNum + 1}. ${index.indexname}`);
      console.log(`     ${index.indexdef}`);
    });
    
    // Step 4: Show row count and sample data
    console.log('\n📋 Step 3: Data Overview');
    console.log('-' .repeat(40));
    
    const countResult = await client.query('SELECT COUNT(*) as total FROM pickup_missions');
    const totalRows = parseInt(countResult.rows[0].count);
    console.log(`📊 Total rows: ${totalRows}`);
    
    if (totalRows > 0) {
      // Show sample data
      const sampleResult = await client.query(`
        SELECT 
          pm.*,
          d.name as driver_name,
          d.agency as driver_agency,
          s.name as shipper_name,
          s.agency as shipper_agency
        FROM pickup_missions pm
        LEFT JOIN drivers d ON pm.driver_id = d.id
        LEFT JOIN shippers s ON pm.shipper_id = s.id
        ORDER BY pm.created_at DESC
        LIMIT 5
      `);
      
      console.log('\n📊 Sample Data (Latest 5 missions):');
      sampleResult.rows.forEach((mission, index) => {
        console.log(`\n  Mission ${index + 1}:`);
        console.log(`    ID: ${mission.id}`);
        console.log(`    Mission Number: ${mission.mission_number}`);
        console.log(`    Status: ${mission.status}`);
        console.log(`    Agency: ${mission.agency || 'NULL'}`);
        console.log(`    Driver: ${mission.driver_name || 'N/A'} (${mission.driver_agency || 'N/A'})`);
        console.log(`    Shipper: ${mission.shipper_name || 'N/A'} (${mission.shipper_agency || 'N/A'})`);
        console.log(`    Created: ${mission.created_at}`);
        console.log(`    Updated: ${mission.updated_at}`);
      });
      
      // Show agency distribution
      const agencyResult = await client.query(`
        SELECT 
          COALESCE(agency, 'NULL') as agency,
          COUNT(*) as count
        FROM pickup_missions 
        GROUP BY agency 
        ORDER BY count DESC
      `);
      
      console.log('\n📊 Agency Distribution:');
      agencyResult.rows.forEach((row, index) => {
        console.log(`  ${index + 1}. ${row.agency.padEnd(20)} | ${row.count} missions`);
      });
      
      // Show status distribution
      const statusResult = await client.query(`
        SELECT 
          COALESCE(status, 'NULL') as status,
          COUNT(*) as count
        FROM pickup_missions 
        GROUP BY status 
        ORDER BY count DESC
      `);
      
      console.log('\n📊 Status Distribution:');
      statusResult.rows.forEach((row, index) => {
        console.log(`  ${index + 1}. ${row.status.padEnd(20)} | ${row.count} missions`);
      });
      
    } else {
      console.log('📊 No data found in pickup_missions table');
    }
    
    // Step 5: Check for any data integrity issues
    console.log('\n📋 Step 4: Data Integrity Check');
    console.log('-' .repeat(40));
    
    // Check for missions without agency
    const noAgencyResult = await client.query(`
      SELECT COUNT(*) as count 
      FROM pickup_missions 
      WHERE agency IS NULL
    `);
    const noAgencyCount = parseInt(noAgencyResult.rows[0].count);
    
    if (noAgencyCount > 0) {
      console.log(`⚠️  ${noAgencyCount} missions have NULL agency (this will cause filtering issues)`);
    } else {
      console.log('✅ All missions have agency values');
    }
    
    // Check for orphaned missions (no driver)
    const noDriverResult = await client.query(`
      SELECT COUNT(*) as count 
      FROM pickup_missions pm
      LEFT JOIN drivers d ON pm.driver_id = d.id
      WHERE d.id IS NULL
    `);
    const noDriverCount = parseInt(noDriverResult.rows[0].count);
    
    if (noDriverCount > 0) {
      console.log(`⚠️  ${noDriverCount} missions have no valid driver`);
    } else {
      console.log('✅ All missions have valid drivers');
    }
    
    // Check for orphaned missions (no shipper)
    const noShipperResult = await client.query(`
      SELECT COUNT(*) as count 
      FROM pickup_missions pm
      LEFT JOIN shippers s ON pm.shipper_id = s.id
      WHERE s.id IS NULL
    `);
    const noShipperCount = parseInt(noShipperResult.rows[0].count);
    
    if (noShipperCount > 0) {
      console.log(`⚠️  ${noShipperCount} missions have no valid shipper`);
    } else {
      console.log('✅ All missions have valid shippers');
    }
    
    console.log('\n🎉 Pickup missions table analysis completed!');
    
  } catch (error) {
    console.error('❌ Error analyzing pickup missions table:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

showPickupMissionsTable()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });










