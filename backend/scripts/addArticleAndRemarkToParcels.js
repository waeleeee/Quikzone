const { Pool } = require('pg');
require('dotenv').config({ path: './config.env' });

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function addArticleAndRemarkColumns() {
  try {
    console.log('🔧 Adding article_name and remark columns to parcels table...');
    
    const result = await pool.query(`
      ALTER TABLE parcels
      ADD COLUMN IF NOT EXISTS article_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS remark TEXT
    `);
    
    console.log('✅ Successfully added article_name and remark columns to parcels table');
    
    // Update existing records to have some default values
    await pool.query(`
      UPDATE parcels 
      SET article_name = COALESCE(article_name, 'Livraison'),
          remark = COALESCE(remark, 'Livraison')
      WHERE article_name IS NULL OR remark IS NULL
    `);
    
    console.log('✅ Updated existing records with default values');
    
  } catch (error) {
    console.error('❌ Error adding columns:', error);
  } finally {
    await pool.end();
  }
}

addArticleAndRemarkColumns(); 