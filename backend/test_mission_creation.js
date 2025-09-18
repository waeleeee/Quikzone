const { pool } = require('./config/database');

async function testMissionCreation() {
  const client = await pool.connect();
  try {
    console.log('🔍 TESTING MISSION CREATION DEBUG\n');
    
    // Test 1: Check if there are any demands with status "Accepted"
    console.log('1️⃣ Checking for Accepted demands:');
    const demandsResult = await client.query(`
      SELECT id, status, expediteur_agency 
      FROM demands 
      WHERE status = 'Accepted'
      LIMIT 5
    `);
    console.log('Accepted demands:', demandsResult.rows);
    
    if (demandsResult.rows.length === 0) {
      console.log('❌ No accepted demands found!');
      return;
    }
    
    // Test 2: Check if the first demand has parcels
    const firstDemand = demandsResult.rows[0];
    console.log('\n2️⃣ Checking parcels for demand ID:', firstDemand.id);
    
    const parcelsResult = await client.query(`
      SELECT dp.parcel_id, p.tracking_number, p.shipper_id
      FROM demand_parcels dp
      LEFT JOIN parcels p ON dp.parcel_id = p.id
      WHERE dp.demand_id = $1
    `, [firstDemand.id]);
    console.log('Parcels for this demand:', parcelsResult.rows);
    
    if (parcelsResult.rows.length === 0) {
      console.log('❌ No parcels found for this demand!');
      return;
    }
    
    // Test 3: Check shipper information
    const firstParcel = parcelsResult.rows[0];
    console.log('\n3️⃣ Checking shipper for parcel ID:', firstParcel.parcel_id);
    
    const shipperResult = await client.query(`
      SELECT id, name, agency, email
      FROM shippers
      WHERE id = $1
    `, [firstParcel.shipper_id]);
    console.log('Shipper info:', shipperResult.rows[0]);
    
    // Test 4: Test the problematic query
    console.log('\n4️⃣ Testing the problematic shipper query:');
    const problematicQuery = `
      SELECT s.id as shipper_id, s.agency as shipper_agency, s.name as shipper_name
      FROM shippers s
      INNER JOIN parcels p ON s.id = p.shipper_id
      INNER JOIN demand_parcels dp ON p.id = dp.parcel_id
      WHERE dp.demand_id = $1
      LIMIT 1
    `;
    
    try {
      const testResult = await client.query(problematicQuery, [firstDemand.id]);
      console.log('✅ Problematic query result:', testResult.rows);
    } catch (error) {
      console.log('❌ Problematic query failed:', error.message);
    }
    
    // Test 5: Check if there are any livreurs available
    console.log('\n5️⃣ Checking available livreurs:');
    const livreursResult = await client.query(`
      SELECT id, firstName, lastName, governorate
      FROM users
      WHERE role = 'Livreurs'
      LIMIT 5
    `);
    console.log('Available livreurs:', livreursResult.rows);
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

testMissionCreation();













