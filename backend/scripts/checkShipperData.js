const db = require('../config/database');

async function checkShipperData() {
  const client = await db.pool.connect();
  
  try {
    console.log('🔍 Checking current shipper data...');
    
    // Get all shippers with their data
    const shippers = await client.query(`
      SELECT id, name, email, phone, address, company_address, governorate, company_governorate
      FROM shippers 
      ORDER BY name
    `);
    
    console.log(`📋 Found ${shippers.rows.length} shippers:`);
    console.log('\n' + '='.repeat(80));
    
    shippers.rows.forEach((shipper, index) => {
      console.log(`${index + 1}. ${shipper.name}`);
      console.log(`   Email: ${shipper.email}`);
      console.log(`   Phone: ${shipper.phone}`);
      console.log(`   Address: ${shipper.address || 'NULL'}`);
      console.log(`   Company Address: ${shipper.company_address || 'NULL'}`);
      console.log(`   Governorate: ${shipper.governorate || 'NULL'}`);
      console.log(`   Company Governorate: ${shipper.company_governorate || 'NULL'}`);
      console.log('');
    });
    
    // Check which shippers have empty addresses
    const emptyAddresses = shippers.rows.filter(s => 
      !s.address && !s.company_address
    );
    
    if (emptyAddresses.length > 0) {
      console.log(`⚠️  ${emptyAddresses.length} shippers with empty addresses:`);
      emptyAddresses.forEach(shipper => {
        console.log(`   - ${shipper.name} (${shipper.email})`);
      });
    } else {
      console.log('✅ All shippers have addresses!');
    }
    
    // Check the delivery missions query to see what's being returned
    console.log('\n🔍 Testing delivery mission query...');
    
    const deliveryMission = await client.query(`
      SELECT dm.id, dm.mission_number, dm.status
      FROM delivery_missions dm
      LIMIT 1
    `);
    
    if (deliveryMission.rows.length > 0) {
      const missionId = deliveryMission.rows[0].id;
      console.log(`Testing with mission ID: ${missionId}`);
      
      const parcelsWithShippers = await client.query(`
        SELECT p.*, 
               dmp.sequence_order, 
               dmp.status as mission_status,
               s.name as shipper_name,
               s.phone as shipper_phone,
               s.email as shipper_email,
               COALESCE(s.address, s.company_address, 'N/A') as shipper_address
        FROM delivery_mission_parcels dmp
        JOIN parcels p ON dmp.parcel_id = p.id
        JOIN shippers s ON p.shipper_id = s.id
        WHERE dmp.mission_id = $1
        ORDER BY dmp.sequence_order
      `, [missionId]);
      
      console.log(`📦 Found ${parcelsWithShippers.rows.length} parcels for this mission:`);
      parcelsWithShippers.rows.forEach((parcel, index) => {
        console.log(`\nParcel ${index + 1}:`);
        console.log(`  Tracking: ${parcel.tracking_number}`);
        console.log(`  Shipper: ${parcel.shipper_name}`);
        console.log(`  Phone: ${parcel.shipper_phone}`);
        console.log(`  Email: ${parcel.shipper_email}`);
        console.log(`  Address: ${parcel.shipper_address}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking shipper data:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the check
checkShipperData()
  .then(() => {
    console.log('✅ Data check completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Data check failed:', error);
    process.exit(1);
  }); 