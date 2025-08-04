const db = require('./config/database');

async function debugPickupMission() {
  try {
    console.log('🔍 Debugging pickup mission structure...');
    
    // Check pickup_missions table structure
    const missionStructure = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'pickup_missions' 
      ORDER BY ordinal_position
    `);
    console.log('📋 Pickup missions table structure:', missionStructure.rows);
    
    // Check if there are any pickup missions
    const missions = await db.query(`
      SELECT id, mission_number, status, created_at, shipper_id
      FROM pickup_missions 
      LIMIT 5
    `);
    console.log('📦 Sample pickup missions:', missions.rows);
    
    // Check mission_parcels table
    const missionParcels = await db.query(`
      SELECT mp.mission_id, mp.parcel_id, p.tracking_number, p.shipper_id
      FROM mission_parcels mp
      JOIN parcels p ON mp.parcel_id = p.id
      LIMIT 10
    `);
    console.log('📦 Sample mission parcels:', missionParcels.rows);
    
    // Check parcels table structure
    const parcelStructure = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'parcels' 
      ORDER BY ordinal_position
    `);
    console.log('📦 Parcels table structure:', parcelStructure.rows);
    
    // Check specific mission #8 (from the image)
    const mission8 = await db.query(`
      SELECT pm.id, pm.mission_number, pm.status, pm.shipper_id,
             s.name as shipper_name, s.address as shipper_address
      FROM pickup_missions pm
      LEFT JOIN shippers s ON pm.shipper_id = s.id
      WHERE pm.id = 8
    `);
    console.log('🎯 Mission #8 details:', mission8.rows);
    
    // Check parcels for mission #8
    const mission8Parcels = await db.query(`
      SELECT p.id, p.tracking_number, p.recipient_name, p.destination, 
             p.shipper_id, s.name as shipper_name, s.address as shipper_address
      FROM parcels p
      JOIN mission_parcels mp ON p.id = mp.parcel_id
      LEFT JOIN shippers s ON p.shipper_id = s.id
      WHERE mp.mission_id = 8
    `);
    console.log('📦 Mission #8 parcels:', mission8Parcels.rows);
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  } finally {
    process.exit(0);
  }
}

debugPickupMission(); 