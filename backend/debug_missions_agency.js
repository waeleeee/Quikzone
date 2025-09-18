const { query } = require('./config/database');

async function debugMissions() {
  try {
    console.log('🔍 CHECKING ALL MISSIONS AND AGENCIES...\n');
    
    // Check all missions
    const missions = await query(`
      SELECT 
        pm.id,
        pm.mission_number,
        pm.driver_id,
        pm.shipper_id,
        pm.status,
        d.name as driver_name,
        d.agency as driver_agency,
        s.name as shipper_name,
        s.agency as shipper_agency
      FROM pickup_missions pm
      LEFT JOIN drivers d ON pm.driver_id = d.id
      LEFT JOIN shippers s ON pm.shipper_id = s.id
      ORDER BY pm.created_at DESC
    `);
    
    console.log('📦 ALL MISSIONS:', JSON.stringify(missions.rows, null, 2));
    
    // Check Chef d'agence agency
    const chefAgency = await query(`
      SELECT email, agency, governorate
      FROM agency_managers
      WHERE email = 'ibeabenzide@quickzone.tn'
    `);
    
    console.log('👨‍💼 CHEF D\'AGENCE AGENCY:', JSON.stringify(chefAgency.rows, null, 2));
    
    // Check all shippers
    const shippers = await query(`
      SELECT id, name, email, agency
      FROM shippers
      ORDER BY agency
    `);
    
    console.log('📤 ALL SHIPPERS:', JSON.stringify(shippers.rows, null, 2));
    
    // Check all drivers
    const drivers = await query(`
      SELECT id, name, email, agency, status
      FROM drivers
      WHERE status = 'Disponible' OR status IS NULL
      ORDER BY agency
    `);
    
    console.log('🚚 ALL DRIVERS:', JSON.stringify(drivers.rows, null, 2));
    
    // Test the exact filtering logic
    if (chefAgency.rows.length > 0) {
      const userAgency = chefAgency.rows[0].agency;
      console.log('\n🔍 TESTING FILTERING LOGIC...');
      console.log('🔍 Chef d\'agence agency:', userAgency);
      
      const filteredMissions = await query(`
        SELECT 
          pm.id,
          pm.mission_number,
          pm.shipper_id,
          s.name as shipper_name,
          s.agency as shipper_agency
        FROM pickup_missions pm
        LEFT JOIN shippers s ON pm.shipper_id = s.id
        WHERE s.agency = $1
      `, [userAgency]);
      
      console.log('🔍 MISSIONS MATCHING AGENCY:', JSON.stringify(filteredMissions.rows, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

debugMissions();
