const db = require('./config/database');

async function testParcelsQuery() {
  const client = await db.pool.connect();
  
  try {
    console.log('🔍 Testing parcels table structure...');
    
    // First, let's see what columns exist in the parcels table
    const columnsResult = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'parcels' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Parcels table columns:');
    columnsResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });
    
    // Check if shipper_id column exists
    const shipperIdExists = columnsResult.rows.some(row => row.column_name === 'shipper_id');
    console.log(`\n🔍 shipper_id column exists: ${shipperIdExists}`);
    
    // Check if client_id column exists
    const clientIdExists = columnsResult.rows.some(row => row.column_name === 'client_id');
    console.log(`🔍 client_id column exists: ${clientIdExists}`);
    
    // Check if assigned_driver_id column exists
    const assignedDriverIdExists = columnsResult.rows.some(row => row.column_name === 'assigned_driver_id');
    console.log(`🔍 assigned_driver_id column exists: ${assignedDriverIdExists}`);
    
    // Try a simple query to see what statuses exist
    const statusResult = await client.query(`
      SELECT DISTINCT status, COUNT(*) as count
      FROM parcels
      GROUP BY status
      ORDER BY status
    `);
    
    console.log('\n📊 Parcel statuses:');
    statusResult.rows.forEach(row => {
      console.log(`  - ${row.status}: ${row.count} parcels`);
    });
    
    // Try the actual query with error handling
    console.log('\n🔍 Testing the actual query...');
    try {
      const result = await client.query(`
        SELECT p.*, s.name as client_name
        FROM parcels p
        JOIN shippers s ON p.shipper_id = s.id
        WHERE p.status = 'au_depot' 
          AND p.assigned_driver_id IS NULL
        ORDER BY p.created_at DESC
        LIMIT 5
      `);
      
      console.log(`✅ Query successful! Found ${result.rows.length} parcels`);
      if (result.rows.length > 0) {
        console.log('📦 Sample parcel:', result.rows[0]);
      }
    } catch (queryError) {
      console.error('❌ Query failed:', queryError.message);
      console.error('❌ Error details:', queryError);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    client.release();
  }
}

// Run the test
testParcelsQuery()
  .then(() => {
    console.log('\n🎉 Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  }); 