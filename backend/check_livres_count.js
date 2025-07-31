const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'quickzone_db',
  password: 'waelrh',
  port: 5432,
});

async function checkLivresCount() {
  try {
    console.log('🔍 Checking "Livrés" count for Hayder altayeb...');
    
    // First, find the expediteur
    const expediteurResult = await pool.query(
      'SELECT id, name, email FROM shippers WHERE name = $1',
      ['Hayder altayeb ']
    );
    
    if (expediteurResult.rows.length === 0) {
      console.log('❌ No expediteur found with name "Hayder altayeb "');
      return;
    }
    
    const expediteur = expediteurResult.rows[0];
    console.log('✅ Found expediteur:', expediteur);
    
    // Get status counts for this expediteur
    const statusCountsResult = await pool.query(`
      SELECT status, COUNT(*) as count
      FROM parcels 
      WHERE shipper_id = $1
      GROUP BY status
      ORDER BY status
    `, [expediteur.id]);
    
    console.log('📊 Status counts for Hayder altayeb:');
    statusCountsResult.rows.forEach(row => {
      console.log(`   ${row.status}: ${row.count}`);
    });
    
    // Specifically check "Livrés" count
    const livresResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM parcels 
      WHERE shipper_id = $1 AND status = 'Livrés'
    `, [expediteur.id]);
    
    console.log(`\n🎯 "Livrés" count: ${livresResult.rows[0].count}`);
    
    // Check "Livrés payés" count
    const livresPayesResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM parcels 
      WHERE shipper_id = $1 AND status = 'Livrés payés'
    `, [expediteur.id]);
    
    console.log(`🎯 "Livrés payés" count: ${livresPayesResult.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Error checking livres count:', error);
  } finally {
    await pool.end();
  }
}

checkLivresCount(); 