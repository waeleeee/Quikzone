const { pool } = require('./config/database');

async function debugTrackingQuery() {
  try {
    console.log('🔍 DEBUGGING TRACKING HISTORY QUERY\n');
    
    const parcelId = 221; // C-219017
    
    // Test the parcel query first
    console.log('1. Testing parcel query...');
    const parcelQuery = `
      SELECT 
        p.id,
        p.tracking_number,
        p.status as current_status,
        p.created_at,
        p.updated_at,
        s.name as shipper_name,
        s.company_address as shipper_address,
        s.city as shipper_city
      FROM parcels p
      LEFT JOIN shippers s ON p.shipper_id = s.id
      WHERE p.id = $1
    `;
    
    try {
      const parcelResult = await pool.query(parcelQuery, [parcelId]);
      console.log('✅ Parcel query successful');
      console.log('Parcel data:', parcelResult.rows[0]);
    } catch (error) {
      console.log('❌ Parcel query failed:', error.message);
      return;
    }
    
    // Test the tracking history query
    console.log('\n2. Testing tracking history query...');
    const historyQuery = `
      SELECT 
        pth.id,
        pth.status,
        pth.previous_status,
        pth.mission_id,
        pth.updated_by,
        pth.location,
        pth.notes,
        pth.created_at,
        pm.mission_number
      FROM parcel_tracking_history pth
      LEFT JOIN pickup_missions pm ON pth.mission_id = pm.id
      WHERE pth.parcel_id = $1
      ORDER BY pth.created_at ASC
    `;
    
    try {
      const historyResult = await pool.query(historyQuery, [parcelId]);
      console.log('✅ Tracking history query successful');
      console.log('History records:', historyResult.rows.length);
      historyResult.rows.forEach((row, index) => {
        console.log(`Record ${index + 1}:`, {
          id: row.id,
          status: row.status,
          timestamp: row.created_at,
          notes: row.notes
        });
      });
    } catch (error) {
      console.log('❌ Tracking history query failed:', error.message);
      console.log('Error details:', error);
    }
    
  } catch (error) {
    console.error('❌ Error debugging query:', error.message);
  } finally {
    await pool.end();
  }
}

debugTrackingQuery(); 