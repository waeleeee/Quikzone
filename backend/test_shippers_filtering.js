const db = require('./config/database');

const testShippersFiltering = async () => {
  try {
    console.log('🔍 Testing shippers filtering for Chef d\'agence...\n');

    const userEmail = 'bensalah@quickzone.tn';
    const expectedAgency = 'Entrepôt Sidi bouzid';

    // Check user's agency
    console.log('📋 Checking user agency...');
    console.log('-' .repeat(50));
    
    const agencyResult = await db.query(`
      SELECT agency FROM agency_managers 
      WHERE email = $1
    `, [userEmail]);
    
    if (agencyResult.rows.length > 0) {
      const userAgency = agencyResult.rows[0].agency;
      console.log('✅ User agency:', userAgency);
    } else {
      console.log('❌ No agency found for user:', userEmail);
      return;
    }

    // Test the filtering query
    console.log('\n📋 Testing shippers filtering...');
    console.log('-' .repeat(50));
    
    const shippersResult = await db.query(`
      SELECT 
        s.id,
        s.name,
        s.email,
        s.agency,
        s.governorate,
        s.created_at
      FROM shippers s
      WHERE s.agency = $1
      ORDER BY s.created_at DESC
    `, [expectedAgency]);
    
    console.log(`✅ Shippers filtered by agency "${expectedAgency}": ${shippersResult.rows.length} shippers`);
    
    if (shippersResult.rows.length > 0) {
      console.log('📋 Found shippers:');
      shippersResult.rows.forEach(shipper => {
        console.log(`  - ID: ${shipper.id}, Name: ${shipper.name}, Email: ${shipper.email}, Agency: ${shipper.agency}, Governorate: ${shipper.governorate}`);
      });
    } else {
      console.log('⚠️ No shippers found for this agency');
      
      // Check if there are any shippers at all
      const allShippersResult = await db.query(`
        SELECT id, name, email, agency, governorate
        FROM shippers
        ORDER BY created_at DESC
        LIMIT 5
      `);
      
      console.log('\n📋 All shippers in system (sample):');
      allShippersResult.rows.forEach(shipper => {
        console.log(`  - ID: ${shipper.id}, Name: ${shipper.name}, Email: ${shipper.email}, Agency: ${shipper.agency || 'NULL'}, Governorate: ${shipper.governorate || 'NULL'}`);
      });
    }

    // Check if the specific expéditeur we updated is there
    console.log('\n📋 Checking specific expéditeur...');
    console.log('-' .repeat(50));
    
    const specificShipperResult = await db.query(`
      SELECT id, name, email, agency, governorate
      FROM shippers
      WHERE email = 'testbensalhexp@quickzone.tn'
    `);
    
    if (specificShipperResult.rows.length > 0) {
      const shipper = specificShipperResult.rows[0];
      console.log('✅ Specific expéditeur found:');
      console.log(`  - ID: ${shipper.id}`);
      console.log(`  - Name: ${shipper.name}`);
      console.log(`  - Email: ${shipper.email}`);
      console.log(`  - Agency: ${shipper.agency || 'NULL'}`);
      console.log(`  - Governorate: ${shipper.governorate || 'NULL'}`);
      
      if (shipper.agency === expectedAgency) {
        console.log('✅ Agency is correct!');
      } else {
        console.log('❌ Agency is incorrect!');
      }
    } else {
      console.log('❌ Specific expéditeur not found');
    }

  } catch (error) {
    console.error('❌ Error testing shippers filtering:', error);
  } finally {
    process.exit(0);
  }
};

testShippersFiltering(); 