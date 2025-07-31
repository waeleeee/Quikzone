const { Pool } = require('pg');
require('dotenv').config({ path: './config.env' });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'quickzone_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'waelrh',
});

async function addAddressColumn() {
  try {
    console.log('🔍 Adding address column to agency_members table...\n');
    
    // Check if address column already exists
    const columnCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'agency_members' 
        AND column_name = 'address'
      );
    `);
    
    if (columnCheck.rows[0].exists) {
      console.log('ℹ️  Address column already exists in agency_members table.');
      return;
    }
    
    // Add address column
    await pool.query(`
      ALTER TABLE agency_members 
      ADD COLUMN address VARCHAR(255)
    `);
    
    console.log('✅ Successfully added address column to agency_members table!');
    
    // Update existing records with default addresses based on their agency
    const updateResult = await pool.query(`
      UPDATE agency_members 
      SET address = CASE 
        WHEN agency = 'Tunis' THEN 'Adresse par défaut, Tunis'
        WHEN agency = 'Sfax' THEN 'Adresse par défaut, Sfax'
        WHEN agency = 'Sousse' THEN 'Adresse par défaut, Sousse'
        WHEN agency = 'Monastir' THEN 'Adresse par défaut, Monastir'
        ELSE 'Adresse par défaut'
      END
      WHERE address IS NULL
    `);
    
    console.log(`✅ Updated ${updateResult.rowCount} existing records with default addresses.`);
    
    // Show the updated table structure
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'agency_members'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 UPDATED AGENCY_MEMBERS TABLE COLUMNS:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}) - Nullable: ${col.is_nullable}`);
    });
    
  } catch (error) {
    console.error('❌ Error adding address column:', error);
  } finally {
    await pool.end();
  }
}

addAddressColumn(); 