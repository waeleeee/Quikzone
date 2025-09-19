const db = require('./config/database');

async function checkAccountants() {
  const client = await db.pool.connect();
  
  try {
    console.log('🔍 Checking accountants table...');

    const result = await client.query(`
      SELECT id, name, email, phone, title, agency, governorate, address, created_at
      FROM accountants
      ORDER BY id
    `);

    console.log(`Found ${result.rows.length} accountants:`);
    result.rows.forEach(acc => {
      console.log(`  ID: ${acc.id}, Name: ${acc.name}, Email: ${acc.email}, Phone: ${acc.phone || 'N/A'}`);
    });

    if (result.rows.length === 0) {
      console.log('\n❌ No accountants found in accountants table!');
      console.log('This explains why the API returns empty data.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    process.exit(0);
  }
}

checkAccountants();
