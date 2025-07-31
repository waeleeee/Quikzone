const db = require('./config/database');

async function checkAgencyManagers() {
  try {
    console.log('🔍 Checking agency managers...\n');

    // Check agency managers table
    console.log('📋 Agency managers:');
    const managersResult = await db.query(`
      SELECT id, name, email, agency, governorate, 
             CASE WHEN password IS NOT NULL THEN 'Has password' ELSE 'No password' END as password_status
      FROM agency_managers
      ORDER BY agency
    `);
    
    managersResult.rows.forEach(manager => {
      console.log(`  ID: ${manager.id}, Name: ${manager.name}, Email: ${manager.email}, Agency: ${manager.agency}, Governorate: ${manager.governorate}, Password: ${manager.password_status}`);
    });

    // Check which agencies are available
    console.log('\n🏢 Available agencies:');
    const allowedAgencies = ['Siège', 'Tunis', 'Sousse', 'Sfax', 'Monastir'];
    const usedAgencies = managersResult.rows.map(m => m.agency);
    
    allowedAgencies.forEach(agency => {
      const isUsed = usedAgencies.includes(agency);
      console.log(`  ${agency}: ${isUsed ? '❌ Occupied' : '✅ Available'}`);
    });

  } catch (error) {
    console.error('❌ Error checking agency managers:', error);
  } finally {
    process.exit(0);
  }
}

checkAgencyManagers(); 