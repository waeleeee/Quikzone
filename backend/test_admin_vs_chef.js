const { query } = require('./config/database');

async function testAdminVsChef() {
  try {
    console.log('🔍 TESTING ADMIN VS CHEF D\'AGENCE ACCESS...\n');
    
    // Test 1: Admin should see ALL missions (no agency filter)
    console.log('👑 TESTING ADMIN ACCESS (should see ALL missions):');
    const adminQuery = `
      SELECT 
        pm.id,
        pm.mission_number,
        pm.status,
        d.name as driver_name,
        d.agency as driver_agency,
        s.name as shipper_name,
        s.agency as shipper_agency
      FROM pickup_missions pm
      LEFT JOIN drivers d ON pm.driver_id = d.id
      LEFT JOIN shippers s ON pm.shipper_id = s.id
      ORDER BY pm.created_at DESC
    `;
    
    const adminResult = await query(adminQuery);
    console.log('📊 ADMIN - Total missions found:', adminResult.rows.length);
    console.log('📊 ADMIN - Missions by agency:');
    
    const adminByAgency = {};
    adminResult.rows.forEach(mission => {
      const agency = mission.shipper_agency || 'Unknown';
      adminByAgency[agency] = (adminByAgency[agency] || 0) + 1;
    });
    console.log(JSON.stringify(adminByAgency, null, 2));
    
    // Test 2: Chef d'agence should see only Zaghouan missions
    console.log('\n👨‍💼 TESTING CHEF D\'AGENCE ACCESS (should see only Zaghouan missions):');
    const chefQuery = `
      SELECT 
        pm.id,
        pm.mission_number,
        pm.status,
        d.name as driver_name,
        d.agency as driver_agency,
        s.name as shipper_name,
        s.agency as shipper_agency
      FROM pickup_missions pm
      LEFT JOIN drivers d ON pm.driver_id = d.id
      LEFT JOIN shippers s ON pm.shipper_id = s.id
      WHERE s.agency = 'Entrepôt Zaghouan'
      ORDER BY pm.created_at DESC
    `;
    
    const chefResult = await query(chefQuery);
    console.log('📊 CHEF D\'AGENCE - Total missions found:', chefResult.rows.length);
    console.log('📊 CHEF D\'AGENCE - Missions:');
    console.log(JSON.stringify(chefResult.rows, null, 2));
    
    // Test 3: Check if the filtering logic is working correctly
    console.log('\n🔍 VERIFYING FILTERING LOGIC:');
    console.log('✅ Admin should see:', adminResult.rows.length, 'missions');
    console.log('✅ Chef d\'agence should see:', chefResult.rows.length, 'missions');
    console.log('✅ Zaghouan missions exist:', adminByAgency['Entrepôt Zaghouan'] || 0, 'missions');
    
    if (chefResult.rows.length === (adminByAgency['Entrepôt Zaghouan'] || 0)) {
      console.log('✅ FILTERING LOGIC IS WORKING CORRECTLY!');
    } else {
      console.log('❌ FILTERING LOGIC HAS ISSUES!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

testAdminVsChef();













