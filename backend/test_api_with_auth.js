const { query } = require('./config/database');

async function testApiWithAuth() {
  try {
    console.log('🔍 TESTING API WITH AUTHENTICATION...\n');
    
    // Simulate the exact API call that the frontend makes
    const missionsQuery = `
      SELECT 
        pm.*,
        COALESCE(COUNT(DISTINCT md.demand_id), 0) as demand_count,
        COALESCE(COUNT(DISTINCT mp.parcel_id), 0) as parcel_count,
        d.name as driver_name,
        d.agency as driver_agency,
        d.governorate as driver_governorate,
        s.name as shipper_name,
        s.agency as shipper_agency
      FROM pickup_missions pm
      LEFT JOIN drivers d ON pm.driver_id = d.id
      LEFT JOIN shippers s ON pm.shipper_id = s.id
      LEFT JOIN mission_demands md ON pm.id = md.mission_id
      LEFT JOIN mission_parcels mp ON pm.id = mp.mission_id
      WHERE 1=1
      GROUP BY pm.id, pm.mission_number, pm.driver_id, pm.shipper_id, pm.scheduled_date, pm.status, pm.created_by, pm.created_at, pm.updated_at, pm.completion_code, d.name, d.agency, d.governorate, s.name, s.agency
      ORDER BY pm.created_at DESC 
      LIMIT 10 OFFSET 0
    `;
    
    const result = await query(missionsQuery);
    const total = result.rows.length;
    
    // Simulate the exact API response structure
    const apiResponse = {
      missions: result.rows,
      pagination: {
        page: 1,
        limit: 10,
        total,
        pages: Math.ceil(total / 10)
      }
    };
    
    console.log('📊 API RESPONSE FOR FRONTEND:');
    console.log('📊 Response structure:', JSON.stringify(apiResponse, null, 2));
    
    // Test what the frontend service returns
    console.log('\n🔍 FRONTEND SERVICE SIMULATION:');
    console.log('📊 pickupMissionsService.getPickupMissions() would return:');
    console.log('📊 response.data =', JSON.stringify(apiResponse, null, 2));
    
    // Test the frontend logic
    const missionsData = apiResponse; // This is what the service returns
    const missions = missionsData?.missions || missionsData?.data || missionsData || [];
    
    console.log('\n🔍 FRONTEND LOGIC TEST:');
    console.log('📊 missionsData?.missions:', missionsData?.missions?.length || 'undefined');
    console.log('📊 missionsData?.data:', missionsData?.data?.length || 'undefined');
    console.log('📊 Final missions array length:', missions.length);
    
    if (missions.length > 0) {
      console.log('✅ FRONTEND SHOULD SHOW MISSIONS!');
      console.log('📊 First mission:', missions[0]);
    } else {
      console.log('❌ FRONTEND WILL SHOW NO MISSIONS!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

testApiWithAuth();













