const { Pool } = require('pg');
require('dotenv').config({ path: './config.env' });

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function addNbPiecesColumn() {
  try {
    console.log('🔧 Adding nb_pieces column to parcels table...');
    
    const result = await pool.query(`
      ALTER TABLE parcels
      ADD COLUMN IF NOT EXISTS nb_pieces INTEGER DEFAULT 1
    `);
    
    console.log('✅ Successfully added nb_pieces column to parcels table');
    
    // Update existing records to have default value
    await pool.query(`
      UPDATE parcels 
      SET nb_pieces = COALESCE(nb_pieces, 1)
      WHERE nb_pieces IS NULL
    `);
    
    console.log('✅ Updated existing records with default nb_pieces value');
    
  } catch (error) {
    console.error('❌ Error adding column:', error);
  } finally {
    await pool.end();
  }
}

addNbPiecesColumn(); 