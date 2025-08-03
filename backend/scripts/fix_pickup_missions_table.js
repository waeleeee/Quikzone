const { Pool } = require('pg');
require('dotenv').config({ path: './config.env' });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

async function fixPickupMissionsTable() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Fixing pickup_missions table structure...');
    
    // Drop the existing foreign key constraint
    await client.query(`
      ALTER TABLE pickup_missions 
      DROP CONSTRAINT IF EXISTS pickup_missions_livreur_id_fkey
    `);
    
    // Update the livreur_id column to reference users table
    await client.query(`
      ALTER TABLE pickup_missions 
      ADD CONSTRAINT pickup_missions_livreur_id_fkey 
      FOREIGN KEY (livreur_id) REFERENCES users(id) ON DELETE CASCADE
    `);
    
    // Update status values to match our French statuses
    await client.query(`
      ALTER TABLE pickup_missions 
      DROP CONSTRAINT IF EXISTS pickup_missions_status_check
    `);
    
    await client.query(`
      ALTER TABLE pickup_missions 
      ADD CONSTRAINT pickup_missions_status_check 
      CHECK (status IN ('En attente', 'Acceptée', 'Refusée', 'En cours', 'Terminée', 'Annulée'))
    `);
    
    // Update default status
    await client.query(`
      ALTER TABLE pickup_missions 
      ALTER COLUMN status SET DEFAULT 'En attente'
    `);
    
    console.log('✅ pickup_missions table structure fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing pickup_missions table:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    await fixPickupMissionsTable();
    console.log('🎉 Table structure fix completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('💥 Fix failed:', error);
    process.exit(1);
  }
}

main(); 