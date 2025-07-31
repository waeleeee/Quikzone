const db = require('./config/database');

async function checkAgencyStructure() {
  try {
    console.log('🔍 Checking current agency structure...');
    
    // Check if there's an agencies table
    const agenciesTable = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'agencies'
      );
    `);
    
    console.log('Agencies table exists:', agenciesTable.rows[0].exists);
    
    if (agenciesTable.rows[0].exists) {
      const agencies = await db.query('SELECT * FROM agencies ORDER BY name');
      console.log('\n📊 Current agencies:');
      agencies.rows.forEach(agency => {
        console.log(`- ${agency.name} (${agency.governorate})`);
      });
    }
    
    // Check agency managers
    const agencyManagers = await db.query(`
      SELECT id, name, email, agency, governorate 
      FROM agency_managers 
      ORDER BY agency, governorate
    `);
    
    console.log('\n📊 Current agency managers:');
    agencyManagers.rows.forEach(manager => {
      console.log(`- ${manager.name} (${manager.email}) - Agency: ${manager.agency}, Governorate: ${manager.governorate}`);
    });
    
    // Group by agency to see conflicts
    const agencyGroups = {};
    agencyManagers.rows.forEach(manager => {
      if (!agencyGroups[manager.agency]) {
        agencyGroups[manager.agency] = [];
      }
      agencyGroups[manager.agency].push(manager);
    });
    
    console.log('\n📊 Agency conflicts (multiple chefs per agency):');
    Object.entries(agencyGroups).forEach(([agency, managers]) => {
      if (managers.length > 1) {
        console.log(`⚠️  Agency "${agency}" has ${managers.length} chefs:`);
        managers.forEach(manager => {
          console.log(`   - ${manager.name} (${manager.email})`);
        });
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

checkAgencyStructure(); 