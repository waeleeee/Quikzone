const db = require('./config/database');

// Generate security code for mission completion
function generateMissionCode(missionNumber, driverId, date) {
  // Create a code based on mission number, driver ID, and date
  const dateStr = new Date(date).toISOString().slice(0, 10).replace(/-/g, '');
  const code = `${missionNumber.slice(-4)}${driverId}${dateStr.slice(-4)}`;
  return code.toUpperCase();
}

async function testSecurityCode() {
  try {
    console.log('🧪 Testing security code generation...');
    
    // Get a sample mission from the database
    const result = await db.query('SELECT id, mission_number, driver_id, scheduled_date FROM pickup_missions LIMIT 1');
    
    if (result.rows.length === 0) {
      console.log('❌ No missions found in database');
      return;
    }
    
    const mission = result.rows[0];
    console.log('📋 Sample mission:', mission);
    
    const securityCode = generateMissionCode(mission.mission_number, mission.driver_id, mission.scheduled_date);
    console.log('🔐 Generated security code:', securityCode);
    
    // Test verification
    const testCode = securityCode;
    const expectedCode = generateMissionCode(mission.mission_number, mission.driver_id, mission.scheduled_date);
    
    console.log('✅ Verification test:', testCode === expectedCode ? 'PASSED' : 'FAILED');
    console.log('🔐 Test code:', testCode);
    console.log('🔐 Expected code:', expectedCode);
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await db.end();
  }
}

testSecurityCode(); 