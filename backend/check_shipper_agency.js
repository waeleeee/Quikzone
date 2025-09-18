const { pool } = require('./config/database');

async function checkShipperAgency() {
  const client = await pool.connect();
  try {
    console.log('🔍 CHECKING SHIPPER AGENCY FOR FILTERING\n');
    
    // Check shipper_id 60 agency
    const shipperResult = await client.query(`
      SELECT id, name, agency, email 
      FROM shippers 
      WHERE id = 60
    `);
    console.log('🔍 Shipper ID 60:', shipperResult.rows[0]);
    
    // Check all shippers with their agencies
    const allShippers = await client.query(`
      SELECT id, name, agency, email 
      FROM shippers 
      ORDER BY agency, name
    `);
    console.log('\n🔍 ALL SHIPPERS WITH AGENCIES:');
    allShippers.rows.forEach(s => {
      console.log(`  - ID: ${s.id} | Name: ${s.name} | Agency: ${s.agency}`);
    });
    
    // Check Chef d'agence agency
    const chefAgency = await client.query(`
      SELECT email, agency 
      FROM agency_managers 
      WHERE email = 'ibeabenzide@quickzone.tn'
    `);
    console.log('\n🔍 Chef d\'agence agency:', chefAgency.rows[0]);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

checkShipperAgency();













