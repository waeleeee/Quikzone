const { Pool } = require('pg');
require('dotenv').config({ path: './config.env' });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'quickzone_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'waelrh',
});

async function debugAgencyData() {
  try {
    console.log('🔍 Debugging agency data...\n');
    
    // Check agency managers
    console.log('📋 AGENCY MANAGERS:');
    const managers = await pool.query('SELECT id, name, email, agency FROM agency_managers ORDER BY agency');
    console.log(`Found ${managers.rows.length} agency managers:`);
    managers.rows.forEach(row => {
      console.log(`  - ${row.name} (${row.email}) - Agency: ${row.agency}`);
    });
    
    console.log('\n📋 AGENCY MEMBERS:');
    const members = await pool.query('SELECT id, name, email, agency, role FROM agency_members ORDER BY agency');
    console.log(`Found ${members.rows.length} agency members:`);
    members.rows.forEach(row => {
      console.log(`  - ${row.name} (${row.email}) - Agency: ${row.agency} - Role: ${row.role}`);
    });
    
    // Check for any data inconsistencies
    console.log('\n🔍 DATA ANALYSIS:');
    
    // Check unique agencies in managers
    const managerAgencies = await pool.query('SELECT DISTINCT agency FROM agency_managers ORDER BY agency');
    console.log('Agencies in agency_managers:', managerAgencies.rows.map(r => r.agency));
    
    // Check unique agencies in members
    const memberAgencies = await pool.query('SELECT DISTINCT agency FROM agency_members ORDER BY agency');
    console.log('Agencies in agency_members:', memberAgencies.rows.map(r => r.agency));
    
    // Check for any null or empty agency values
    const nullManagerAgencies = await pool.query('SELECT COUNT(*) FROM agency_managers WHERE agency IS NULL OR agency = \'\'');
    const nullMemberAgencies = await pool.query('SELECT COUNT(*) FROM agency_members WHERE agency IS NULL OR agency = \'\'');
    
    console.log(`Null/empty agency values in managers: ${nullManagerAgencies.rows[0].count}`);
    console.log(`Null/empty agency values in members: ${nullMemberAgencies.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Error debugging agency data:', error);
  } finally {
    await pool.end();
  }
}

debugAgencyData(); 