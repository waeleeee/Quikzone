const { pool } = require('./config/database');

async function checkShippers() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking shippers in database...');
    
    // Check if shippers table exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'shippers'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('❌ Shippers table does not exist!');
      return;
    }
    
    // Get all shippers
    const shippers = await client.query(`
      SELECT id, name, email, phone, company_address 
      FROM shippers 
      ORDER BY id;
    `);
    
    console.log(`📋 Found ${shippers.rows.length} shippers:`);
    
    if (shippers.rows.length === 0) {
      console.log('⚠️  No shippers found in database!');
      console.log('💡 You need to create at least one shipper first.');
    } else {
      shippers.rows.forEach(shipper => {
        console.log(`  - ID: ${shipper.id}, Name: ${shipper.name}, Email: ${shipper.email}`);
      });
    }
    
    // Check parcels table structure
    console.log('\n🔍 Checking parcels table structure...');
    const parcelsColumns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'parcels' 
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Parcels table columns:');
    parcelsColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default})`);
    });
    
  } catch (error) {
    console.error('❌ Error checking shippers:', error);
  } finally {
    client.release();
  }
}

checkShippers()
  .then(() => {
    console.log('✅ Check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Check failed:', error);
    process.exit(1);
  }); 