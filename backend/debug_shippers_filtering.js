const db = require('./config/database');

const debugShippersFiltering = async () => {
  try {
    console.log('🔍 Debugging shippers filtering...\n');

    const userEmail = 'bensalah@quickzone.tn';

    // Get user's agency from agency_managers table
    console.log('📋 Getting user agency...');
    const agencyResult = await db.query(`
      SELECT agency FROM agency_managers 
      WHERE email = $1
    `, [userEmail]);

    if (agencyResult.rows.length === 0) {
      console.log('❌ No agency found for user');
      return;
    }

    const userAgency = agencyResult.rows[0].agency;
    console.log('✅ User agency:', userAgency);

    // Get all shippers with their agencies
    console.log('\n📋 All shippers in database:');
    const allShippersResult = await db.query(`
      SELECT id, name, email, agency, governorate
      FROM shippers
      ORDER BY created_at DESC
    `);

    console.log(`📋 Total shippers: ${allShippersResult.rows.length}`);
    allShippersResult.rows.forEach(shipper => {
      console.log(`  - ID: ${shipper.id}, Name: ${shipper.name}, Email: ${shipper.email}, Agency: "${shipper.agency || 'NULL'}"`);
    });

    // Test the exact filtering query
    console.log('\n📋 Testing exact filtering query...');
    const filteredResult = await db.query(`
      SELECT id, name, email, agency, governorate
      FROM shippers
      WHERE agency = $1
    `, [userAgency]);

    console.log(`📋 Filtered shippers for agency "${userAgency}": ${filteredResult.rows.length}`);
    filteredResult.rows.forEach(shipper => {
      console.log(`  - ID: ${shipper.id}, Name: ${shipper.name}, Email: ${shipper.email}, Agency: "${shipper.agency}"`);
    });

    // Check for any shippers with similar agency names
    console.log('\n📋 Checking for similar agency names...');
    const similarResult = await db.query(`
      SELECT id, name, email, agency, governorate
      FROM shippers
      WHERE agency ILIKE $1
    `, [`%${userAgency}%`]);

    console.log(`📋 Shippers with similar agency names: ${similarResult.rows.length}`);
    similarResult.rows.forEach(shipper => {
      console.log(`  - ID: ${shipper.id}, Name: ${shipper.name}, Email: ${shipper.email}, Agency: "${shipper.agency}"`);
    });

    // Check the exact agency names in the database
    console.log('\n📋 All unique agency names in shippers table:');
    const uniqueAgenciesResult = await db.query(`
      SELECT DISTINCT agency
      FROM shippers
      WHERE agency IS NOT NULL
      ORDER BY agency
    `);

    uniqueAgenciesResult.rows.forEach(row => {
      console.log(`  - "${row.agency}"`);
    });

  } catch (error) {
    console.error('❌ Error debugging shippers filtering:', error);
  } finally {
    process.exit(0);
  }
};

debugShippersFiltering(); 