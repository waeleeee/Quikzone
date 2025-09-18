const { query } = require('./config/database');

async function testApiResponse() {
  try {
    console.log('🔍 TESTING ACTUAL API RESPONSE...\n');
    
    // Simulate the exact API query for Admin (no role filter)
    console.log('👑 TESTING ADMIN API RESPONSE:');
    const adminApiQuery = `
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
    
    const adminApiResult = await query(adminApiQuery);
    console.log('📊 ADMIN API - Total missions found:', adminApiResult.rows.length);
    
    // Simulate the exact API query for Chef d'agence (with agency filter)
    console.log('\n👨‍💼 TESTING CHEF D\'AGENCE API RESPONSE:');
    const chefApiQuery = `
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
      WHERE 1=1 AND s.agency = 'Entrepôt Zaghouan'
      GROUP BY pm.id, pm.mission_number, pm.driver_id, pm.shipper_id, pm.scheduled_date, pm.status, pm.created_by, pm.created_at, pm.updated_at, pm.completion_code, d.name, d.agency, d.governorate, s.name, s.agency
      ORDER BY pm.created_at DESC 
      LIMIT 10 OFFSET 0
    `;
    
    const chefApiResult = await query(chefApiQuery);
    console.log('📊 CHEF D\'AGENCE API - Total missions found:', chefApiResult.rows.length);
    
    // Check if there are any issues with the GROUP BY or JOINs
    console.log('\n🔍 CHECKING FOR POTENTIAL ISSUES:');
    
    // Check if any missions have NULL driver_id or shipper_id
    const nullCheck = await query(`
      SELECT 
        COUNT(*) as total_missions,
        COUNT(CASE WHEN driver_id IS NULL THEN 1 END) as null_driver_id,
        COUNT(CASE WHEN shipper_id IS NULL THEN 1 END) as null_shipper_id
      FROM pickup_missions
    `);
    
    console.log('📊 NULL CHECK:', nullCheck.rows[0]);
    
    // Check if the issue might be with the driver status filter
    console.log('\n🔍 CHECKING DRIVER STATUS IMPACT:');
    const driverStatusCheck = await query(`
      SELECT 
        pm.id,
        pm.mission_number,
        pm.driver_id,
        d.name as driver_name,
        d.status as driver_status
      FROM pickup_missions pm
      LEFT JOIN drivers d ON pm.driver_id = d.id
      WHERE pm.driver_id IS NOT NULL
      ORDER BY pm.created_at DESC
      LIMIT 5
    `);
    
    console.log('📊 DRIVER STATUS CHECK:', JSON.stringify(driverStatusCheck.rows, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

testApiResponse();













