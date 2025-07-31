const { Pool } = require('pg');
require('dotenv').config({ path: './config.env' });

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function debugArticleFields() {
  try {
    console.log('🔍 Debugging article_name and remark fields...\n');

    // Check if columns exist
    console.log('1️⃣ Checking if columns exist...');
    const columnsResult = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'parcels' 
      AND column_name IN ('article_name', 'remark')
      ORDER BY column_name
    `);
    
    console.log('Columns found:', columnsResult.rows);
    console.log('');

    // Check sample data
    console.log('2️⃣ Checking sample parcel data...');
    const sampleResult = await pool.query(`
      SELECT id, tracking_number, article_name, remark, destination
      FROM parcels 
      ORDER BY created_at DESC 
      LIMIT 3
    `);
    
    console.log('Sample parcels:', sampleResult.rows);
    console.log('');

    // Try to insert a test record directly
    console.log('3️⃣ Testing direct database insert...');
    const insertResult = await pool.query(`
      INSERT INTO parcels (
        tracking_number, shipper_id, destination, status, weight, price, type,
        article_name, remark
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, tracking_number, article_name, remark
    `, ['TEST-DIRECT', 39, 'Test Destination', 'En attente', 1, 10, 'Livraison', 'Test Article', 'Test Remark']);
    
    console.log('Direct insert result:', insertResult.rows[0]);
    console.log('');

    // Clean up test record
    await pool.query('DELETE FROM parcels WHERE tracking_number = $1', ['TEST-DIRECT']);
    console.log('🧹 Cleaned up test record');

  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await pool.end();
  }
}

debugArticleFields(); 