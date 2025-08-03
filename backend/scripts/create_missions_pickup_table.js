const { Pool } = require('pg');
require('dotenv').config({ path: './config.env' });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

async function createMissionsPickupTable() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Creating missions_pickup table...');
    
    // Create the main missions_pickup table
    await client.query(`
      CREATE TABLE IF NOT EXISTS missions_pickup (
        id SERIAL PRIMARY KEY,
        mission_code VARCHAR(20) UNIQUE NOT NULL,
        driver_id INTEGER REFERENCES drivers(id) ON DELETE SET NULL,
        shipper_id INTEGER REFERENCES shippers(id) ON DELETE SET NULL,
        colis_ids INTEGER[] NOT NULL,
        scheduled_time TIMESTAMP NOT NULL,
        status TEXT NOT NULL DEFAULT 'En attente',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        
        -- New columns for demands-based system
        livreur_name VARCHAR(100),
        livreur_agency VARCHAR(100),
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_by_name VARCHAR(100),
        created_by_role VARCHAR(50),
        accepted_at TIMESTAMP,
        completed_at TIMESTAMP,
        notes TEXT,
        total_parcels INTEGER DEFAULT 0
      )
    `);
    
    console.log('✅ missions_pickup table created successfully!');
    
    // Create mission_demands table
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
    
    // Create mission_parcels table
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
      `CREATE INDEX IF NOT EXISTS idx_missions_pickup_driver_id ON missions_pickup(driver_id);`,
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
    
    console.log('✅ All tables and indexes created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating missions_pickup table:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    await createMissionsPickupTable();
    console.log('🎉 Database setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('💥 Setup failed:', error);
    process.exit(1);
  }
}

main(); 