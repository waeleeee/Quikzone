const db = require('./config/database');

async function testAccountantsAPI() {
  const client = await db.pool.connect();
  
  try {
    console.log('🧪 Testing accountants API locally...');

    // Test the exact query used in the API
    const result = await client.query(`
      SELECT 
        id,
        name,
        email,
        phone,
        governorate,
        address,
        title,
        agency,
        created_at,
        'Comptable' as role
      FROM accountants
      WHERE 1=1
      ORDER BY created_at DESC
    `);

    console.log(`✅ Query successful: Found ${result.rows.length} accountants`);
    
    if (result.rows.length > 0) {
      console.log('\n📋 Sample data:');
      result.rows.slice(0, 3).forEach(acc => {
        console.log(`  ID: ${acc.id}, Name: ${acc.name}, Email: ${acc.email}`);
      });
    } else {
      console.log('❌ No data returned - this explains the empty table');
    }

    // Test pagination
    const paginatedResult = await client.query(`
      SELECT 
        id,
        name,
        email,
        phone,
        governorate,
        address,
        title,
        agency,
        created_at,
        'Comptable' as role
      FROM accountants
      WHERE 1=1
      ORDER BY created_at DESC
      LIMIT 10 OFFSET 0
    `);

    console.log(`\n📄 Pagination test: ${paginatedResult.rows.length} records`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    client.release();
    process.exit(0);
  }
}

testAccountantsAPI();