const db = require('./config/database');

// Copy the getFullMission function here for testing
async function getFullMission(row) {
  try {
    console.log('🔍 getFullMission called with row:', row);
    
    // Get driver info from drivers table
    const driverRes = await db.query('SELECT id, name, email FROM drivers WHERE id = $1', [row.driver_id]);
    console.log('🚚 Driver query result:', driverRes.rows[0]);
    
    const driver = driverRes.rows[0] ? { 
      id: driverRes.rows[0].id, 
      name: driverRes.rows[0].name,
      email: driverRes.rows[0].email
    } : null;
    
    console.log('🚚 Final driver object:', driver);
    
    // Get shipper info
    const shipperRes = await db.query('SELECT id, name, email, phone, company_address FROM shippers WHERE id = $1', [row.shipper_id]);
    console.log('📦 Shipper query result:', shipperRes.rows[0]);
    
    const shipper = shipperRes.rows[0] ? { 
      id: shipperRes.rows[0].id, 
      name: shipperRes.rows[0].name,
      email: shipperRes.rows[0].email,
      phone: shipperRes.rows[0].phone,
      address: shipperRes.rows[0].company_address
    } : null;
    
    console.log('📦 Final shipper object:', shipper);
    
    // Get parcels for this mission
    const parcelsRes = await db.query(`
      SELECT p.id, p.tracking_number, p.destination, p.status
      FROM parcels p 
      INNER JOIN mission_parcels mp ON p.id = mp.parcel_id 
      WHERE mp.mission_id = $1
    `, [row.id]);
    
    console.log('📦 Parcels query result:', parcelsRes.rows);
    
    const parcels = parcelsRes.rows.map(p => ({
      id: p.id,
      tracking_number: p.tracking_number,
      destination: p.destination,
      status: p.status
    }));
    
    console.log('📦 Final parcels array:', parcels);
    
    // Get creator info (using a default for now since we don't have role-based users)
    const createdBy = {
      id: row.created_by || 1,
      name: 'Admin QuickZone',
      email: 'admin@quickzone.tn',
      role: 'Administration'
    };
    
    const result = {
      id: row.id,
      mission_number: row.mission_number,
      driver,
      shipper,
      parcels,
      scheduled_time: row.scheduled_date,
      status: row.status,
      created_by: createdBy,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
    
    console.log('✅ Final result:', result);
    return result;
  } catch (error) {
    console.error('Error in getFullMission:', error);
    // Return basic mission data if joins fail
    return {
      id: row.id,
      mission_number: row.mission_number,
      driver: null,
      shipper: null,
      parcels: [],
      scheduled_time: row.scheduled_date,
      status: row.status,
      created_by: {
        id: 1,
        name: 'Admin QuickZone',
        email: 'admin@quickzone.tn',
        role: 'Administration'
      },
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }
}

async function testGetFullMission() {
  try {
    console.log('🔍 Testing getFullMission function...');
    
    // Get the mission data
    const missionRow = await db.query('SELECT * FROM pickup_missions WHERE id = 15');
    console.log('📋 Mission row:', missionRow.rows[0]);
    
    if (missionRow.rows[0]) {
      const result = await getFullMission(missionRow.rows[0]);
      console.log('🎯 Final result:', JSON.stringify(result, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error testing getFullMission:', error);
  } finally {
    process.exit(0);
  }
}

testGetFullMission(); 