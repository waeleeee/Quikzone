const db = require('./config/database');

async function testPickupMissions() {
  try {
    console.log('🔍 Testing pickup missions...');
    
    // Check existing missions
    const existingMissions = await db.query('SELECT * FROM pickup_missions');
    console.log('📦 Existing missions:', existingMissions.rows.length);
    
    if (existingMissions.rows.length > 0) {
      console.log('📋 Sample mission:', existingMissions.rows[0]);
    }
    
    // Get adem's driver ID
    const ademDriver = await db.query('SELECT id, name, email FROM drivers WHERE email = $1', ['adouma@gmail.com']);
    console.log('🚚 Adem driver info:', ademDriver.rows[0]);
    
    // Get available shippers
    const shippers = await db.query('SELECT id, name, email FROM shippers LIMIT 3');
    console.log('📦 Available shippers:', shippers.rows);
    
    // Get available parcels
    const parcels = await db.query('SELECT id, tracking_number, shipper_id, status FROM parcels WHERE status = $1 LIMIT 5', ['En attente']);
    console.log('📦 Available parcels:', parcels.rows);
    
    // Create a test mission for adem if none exist
    if (existingMissions.rows.length === 0 && ademDriver.rows.length > 0 && shippers.rows.length > 0) {
      console.log('🚀 Creating test mission for adem...');
      
      const ademId = ademDriver.rows[0].id;
      const shipperId = shippers.rows[0].id;
      const missionNumber = `PIK${Date.now()}`;
      const scheduledTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
      
      // Insert mission
      const missionResult = await db.query(`
        INSERT INTO pickup_missions (mission_number, driver_id, shipper_id, scheduled_date, status, created_by)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [missionNumber, ademId, shipperId, scheduledTime, 'En attente', 1]);
      
      console.log('✅ Mission created:', missionResult.rows[0]);
      
      // Assign parcels to mission if available
      if (parcels.rows.length > 0) {
        const missionId = missionResult.rows[0].id;
        const parcelIds = parcels.rows.slice(0, 2).map(p => p.id); // Take first 2 parcels
        
        for (const parcelId of parcelIds) {
          await db.query(`
            INSERT INTO mission_parcels (mission_id, parcel_id, status)
            VALUES ($1, $2, $3)
          `, [missionId, parcelId, 'pending']);
        }
        
        console.log('✅ Assigned parcels to mission:', parcelIds);
      }
    }
    
    // Check missions again
    const updatedMissions = await db.query('SELECT * FROM pickup_missions');
    console.log('📦 Updated missions count:', updatedMissions.rows.length);
    
  } catch (error) {
    console.error('❌ Error testing pickup missions:', error);
  } finally {
    process.exit(0);
  }
}

testPickupMissions(); 