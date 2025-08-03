const { Pool } = require('pg');
require('dotenv').config({ path: './config.env' });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

async function updatePickupMissionsTable() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Updating existing missions_pickup table...');
    
    // First, let's check if the table exists and see its current structure
    const checkTableQuery = `
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'missions_pickup'
      ORDER BY ordinal_position;
    `;
    
    const tableStructure = await client.query(checkTableQuery);
    console.log('📋 Current table structure:', tableStructure.rows);
    
    // Add new columns to support demands-based system
    const alterQueries = [
      // Add mission_code column for unique mission identification
      `ALTER TABLE missions_pickup ADD COLUMN IF NOT EXISTS mission_code VARCHAR(20) UNIQUE;`,
      
      // Add livreur_name and livreur_agency for better tracking
      `ALTER TABLE missions_pickup ADD COLUMN IF NOT EXISTS livreur_name VARCHAR(100);`,
      `ALTER TABLE missions_pickup ADD COLUMN IF NOT EXISTS livreur_agency VARCHAR(100);`,
      
      // Add created_by information
      `ALTER TABLE missions_pickup ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id) ON DELETE SET NULL;`,
      `ALTER TABLE missions_pickup ADD COLUMN IF NOT EXISTS created_by_name VARCHAR(100);`,
      `ALTER TABLE missions_pickup ADD COLUMN IF NOT EXISTS created_by_role VARCHAR(50);`,
      
      // Add status tracking timestamps
      `ALTER TABLE missions_pickup ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP;`,
      `ALTER TABLE missions_pickup ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;`,
      
      // Add notes column
      `ALTER TABLE missions_pickup ADD COLUMN IF NOT EXISTS notes TEXT;`,
      
      // Add total_parcels count
      `ALTER TABLE missions_pickup ADD COLUMN IF NOT EXISTS total_parcels INTEGER DEFAULT 0;`
    ];
    
    // Execute all alter queries
    for (const query of alterQueries) {
      try {
        await client.query(query);
        console.log('✅ Executed:', query.trim());
      } catch (error) {
        if (error.code === '42701') { // Column already exists
          console.log('ℹ️ Column already exists, skipping:', query.trim());
        } else {
          console.error('❌ Error executing query:', query.trim(), error.message);
        }
      }
    }
    
    // Create mission_demands table if it doesn't exist
    console.log('🔧 Creating mission_demands table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS mission_demands (
        id SERIAL PRIMARY KEY,
        mission_id INTEGER NOT NULL,
        demand_id INTEGER NOT NULL,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (mission_id) REFERENCES missions_pickup(id) ON DELETE CASCADE,
        FOREIGN KEY (demand_id) REFERENCES demands(id) ON DELETE CASCADE,
        UNIQUE(mission_id, demand_id)
      )
    `);
    
    // Create mission_parcels table if it doesn't exist
    console.log('🔧 Creating mission_parcels table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS mission_parcels (
        id SERIAL PRIMARY KEY,
        mission_id INTEGER NOT NULL,
        parcel_id INTEGER NOT NULL,
        demand_id INTEGER NOT NULL,
        status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Picked Up', 'Delivered', 'Failed')),
        picked_up_at TIMESTAMP,
        delivered_at TIMESTAMP,
        notes TEXT,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (mission_id) REFERENCES missions_pickup(id) ON DELETE CASCADE,
        FOREIGN KEY (parcel_id) REFERENCES parcels(id) ON DELETE CASCADE,
        FOREIGN KEY (demand_id) REFERENCES demands(id) ON DELETE CASCADE,
        UNIQUE(mission_id, parcel_id)
      )
    `);
    
    // Create indexes for better performance
    console.log('🔧 Creating indexes...');
    const indexQueries = [
      `CREATE INDEX IF NOT EXISTS idx_missions_pickup_livreur_id ON missions_pickup(driver_id);`,
      `CREATE INDEX IF NOT EXISTS idx_missions_pickup_status ON missions_pickup(status);`,
      `CREATE INDEX IF NOT EXISTS idx_missions_pickup_created_at ON missions_pickup(created_at);`,
      `CREATE INDEX IF NOT EXISTS idx_missions_pickup_agency ON missions_pickup(livreur_agency);`,
      `CREATE INDEX IF NOT EXISTS idx_mission_demands_mission_id ON mission_demands(mission_id);`,
      `CREATE INDEX IF NOT EXISTS idx_mission_demands_demand_id ON mission_demands(demand_id);`,
      `CREATE INDEX IF NOT EXISTS idx_mission_parcels_mission_id ON mission_parcels(mission_id);`,
      `CREATE INDEX IF NOT EXISTS idx_mission_parcels_parcel_id ON mission_parcels(parcel_id);`,
      `CREATE INDEX IF NOT EXISTS idx_mission_parcels_status ON mission_parcels(status);`
    ];
    
    for (const query of indexQueries) {
      try {
        await client.query(query);
        console.log('✅ Created index:', query.trim());
      } catch (error) {
        console.log('ℹ️ Index already exists or error:', query.trim(), error.message);
      }
    }
    
    // Update existing missions to have mission codes if they don't have them
    console.log('🔄 Updating existing missions with mission codes...');
    const updateMissionCodesQuery = `
      UPDATE missions_pickup 
      SET mission_code = 'M-' || LPAD(id::text, 6, '0') || '-' || LPAD(FLOOR(RANDOM() * 1000)::text, 3, '0')
      WHERE mission_code IS NULL;
    `;
    
    await client.query(updateMissionCodesQuery);
    console.log('✅ Updated existing missions with mission codes');
    
    // Update livreur information for existing missions
    console.log('🔄 Updating livreur information for existing missions...');
    const updateLivreurInfoQuery = `
      UPDATE missions_pickup 
      SET 
        livreur_name = u.first_name || ' ' || u.last_name,
        livreur_agency = l.agency
      FROM users u, livreurs l
      WHERE missions_pickup.driver_id = u.id 
        AND u.id = l.user_id
        AND missions_pickup.livreur_name IS NULL;
    `;
    
    try {
      await client.query(updateLivreurInfoQuery);
      console.log('✅ Updated livreur information');
    } catch (error) {
      console.log('ℹ️ Could not update livreur information (might not have livreurs table):', error.message);
    }
    
    console.log('✅ Pickup missions table updated successfully!');
    
  } catch (error) {
    console.error('❌ Error updating pickup missions table:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    await updatePickupMissionsTable();
    console.log('🎉 Database migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  }
}

main(); 