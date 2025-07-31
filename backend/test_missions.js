const db = require('./config/database');

const testMissions = async () => {
  try {
    console.log('Testing missions pickup...');
    
    // Test basic query
    const result = await db.query('SELECT * FROM pickup_missions ORDER BY scheduled_date DESC');
    console.log('Basic query result:', result.rows.length, 'missions found');
    
    if (result.rows.length > 0) {
      const firstMission = result.rows[0];
      console.log('First mission:', firstMission);
      
      // Test driver query
      const driverRes = await db.query('SELECT id, first_name, last_name FROM users WHERE id = $1', [firstMission.driver_id]);
      console.log('Driver query result:', driverRes.rows[0]);
      
      // Test shipper query
      const shipperRes = await db.query('SELECT id, name FROM shippers WHERE id = $1', [firstMission.shipper_id]);
      console.log('Shipper query result:', shipperRes.rows[0]);
      
      // Test parcels query
      const parcelsRes = await db.query('SELECT p.id, p.destination, p.status FROM parcels p INNER JOIN mission_parcels mp ON p.id = mp.parcel_id WHERE mp.mission_id = $1', [firstMission.id]);
      console.log('Parcels query result:', parcelsRes.rows);
    }
    
  } catch (error) {
    console.error('Error testing missions:', error);
  } finally {
    process.exit(0);
  }
};

testMissions(); 