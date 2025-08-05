const { pool } = require('./config/database');

async function debugAgencyFiltering() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Debugging agency filtering...\n');
    
    // 1. Check all demands with their agency information
    console.log('📋 1. All demands with agency information:');
    const allDemands = await client.query(`
      SELECT id, expediteur_name, expediteur_email, expediteur_agency, status
      FROM demands 
      WHERE status = 'Accepted'
      ORDER BY id
    `);
    
    console.log(`Found ${allDemands.rows.length} accepted demands:`);
    allDemands.rows.forEach(demand => {
      console.log(`  - ID: ${demand.id}, Expéditeur: ${demand.expediteur_name}, Agency: "${demand.expediteur_agency}"`);
    });
    
    // 2. Check all drivers with their agency information
    console.log('\n📋 2. All drivers with agency information:');
    const allDrivers = await client.query(`
      SELECT id, name, email, agency, governorate
      FROM drivers 
      ORDER BY id
    `);
    
    console.log(`Found ${allDrivers.rows.length} drivers:`);
    allDrivers.rows.forEach(driver => {
      console.log(`  - ID: ${driver.id}, Name: ${driver.name}, Agency: "${driver.agency}", Governorate: "${driver.governorate}"`);
    });
    
    // 3. Check all users with their agency information
    console.log('\n📋 3. All users with agency information:');
    const allUsers = await client.query(`
      SELECT id, first_name, last_name, email, role, agency, governorate
      FROM users 
      WHERE role IN ('Admin', 'Administration', 'Chef d\'agence', 'Membre de l\'agence')
      ORDER BY id
    `);
    
    console.log(`Found ${allUsers.rows.length} relevant users:`);
    allUsers.rows.forEach(user => {
      console.log(`  - ID: ${user.id}, Name: ${user.first_name} ${user.last_name}, Role: ${user.role}, Agency: "${user.agency}", Governorate: "${user.governorate}"`);
    });
    
    // 4. Check agency_managers table
    console.log('\n📋 4. Agency managers:');
    const agencyManagers = await client.query(`
      SELECT email, agency
      FROM agency_managers 
      ORDER BY agency
    `);
    
    console.log(`Found ${agencyManagers.rows.length} agency managers:`);
    agencyManagers.rows.forEach(manager => {
      console.log(`  - Email: ${manager.email}, Agency: "${manager.agency}"`);
    });
    
    // 5. Test the exact filtering logic for "Entrepôt Sousse"
    console.log('\n📋 5. Testing filtering for "Entrepôt Sousse":');
    const testFiltering = await client.query(`
      SELECT id, expediteur_name, expediteur_agency
      FROM demands 
      WHERE status = 'Accepted'
      AND expediteur_agency ILIKE '%sousse%'
      ORDER BY id
    `);
    
    console.log(`Found ${testFiltering.rows.length} demands matching "Sousse":`);
    testFiltering.rows.forEach(demand => {
      console.log(`  - ID: ${demand.id}, Expéditeur: ${demand.expediteur_name}, Agency: "${demand.expediteur_agency}"`);
    });
    
    // 6. Check what demands would be shown for different user roles
    console.log('\n📋 6. Testing role-based filtering scenarios:');
    
    // Scenario 1: Admin user with driver from "Entrepôt Sousse"
    console.log('\n   Scenario 1: Admin user with driver from "Entrepôt Sousse"');
    const adminScenario = allDemands.rows.filter(demand => {
      const demandAgency = demand.expediteur_agency || "";
      const driverAgency = "Entrepôt Sousse";
      const matches = demandAgency.toLowerCase() === driverAgency.toLowerCase();
      const containsMatch = demandAgency.toLowerCase().includes(driverAgency.toLowerCase());
      return matches || containsMatch;
    });
    
    console.log(`   Would show ${adminScenario.length} demands:`);
    adminScenario.forEach(demand => {
      console.log(`     - ID: ${demand.id}, Agency: "${demand.expediteur_agency}"`);
    });
    
    // Scenario 2: Chef d'agence user from "Sousse" with driver from "Entrepôt Sousse"
    console.log('\n   Scenario 2: Chef d\'agence user from "Sousse" with driver from "Entrepôt Sousse"');
    const chefScenario = allDemands.rows.filter(demand => {
      const demandAgency = demand.expediteur_agency || "";
      const userAgency = "Sousse";
      const driverAgency = "Entrepôt Sousse";
      const matchesUser = demandAgency.toLowerCase() === userAgency.toLowerCase();
      const matchesDriver = demandAgency.toLowerCase() === driverAgency.toLowerCase();
      const containsDriverMatch = demandAgency.toLowerCase().includes(driverAgency.toLowerCase());
      return matchesUser && (matchesDriver || containsDriverMatch);
    });
    
    console.log(`   Would show ${chefScenario.length} demands:`);
    chefScenario.forEach(demand => {
      console.log(`     - ID: ${demand.id}, Agency: "${demand.expediteur_agency}"`);
    });
    
  } catch (error) {
    console.error('❌ Error debugging agency filtering:', error);
  } finally {
    client.release();
  }
}

debugAgencyFiltering()
  .then(() => {
    console.log('\n✅ Debug completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Debug failed:', error);
    process.exit(1);
  }); 