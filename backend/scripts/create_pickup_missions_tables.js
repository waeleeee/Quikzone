const { Pool } = require('pg');
require('dotenv').config({ path: './config.env' });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

async function createPickupMissionsTables() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Creating pickup missions tables...');
    
    // Create pickup_missions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS pickup_missions (
        id SERIAL PRIMARY KEY,
        mission_code VARCHAR(20) UNIQUE NOT NULL,
        livreur_id INTEGER NOT NULL,
        livreur_name VARCHAR(100) NOT NULL,
        livreur_agency VARCHAR(100) NOT NULL,
        status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Accepted', 'Refused', 'In Progress', 'Completed', 'Cancelled')),
        total_parcels INTEGER DEFAULT 0,
        created_by INTEGER NOT NULL,
        created_by_name VARCHAR(100) NOT NULL,
        created_by_role VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        accepted_at TIMESTAMP,
        completed_at TIMESTAMP,
        notes TEXT,
        FOREIGN KEY (livreur_id) REFERENCES livreurs(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    // Create mission_demands table (many-to-many relationship)
    await client.query(`
      CREATE TABLE IF NOT EXISTS mission_demands (
        id SERIAL PRIMARY KEY,
        mission_id INTEGER NOT NULL,
        demand_id INTEGER NOT NULL,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (mission_id) REFERENCES pickup_missions(id) ON DELETE CASCADE,
        FOREIGN KEY (demand_id) REFERENCES demands(id) ON DELETE CASCADE,
        UNIQUE(mission_id, demand_id)
      )
    `);
    
    // Create mission_parcels table (to track individual parcels in missions)
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
        FOREIGN KEY (mission_id) REFERENCES pickup_missions(id) ON DELETE CASCADE,
        FOREIGN KEY (parcel_id) REFERENCES parcels(id) ON DELETE CASCADE,
        FOREIGN KEY (demand_id) REFERENCES demands(id) ON DELETE CASCADE,
        UNIQUE(mission_id, parcel_id)
      )
    `);
    
    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_pickup_missions_livreur_id ON pickup_missions(livreur_id);
      CREATE INDEX IF NOT EXISTS idx_pickup_missions_status ON pickup_missions(status);
      CREATE INDEX IF NOT EXISTS idx_pickup_missions_created_at ON pickup_missions(created_at);
      CREATE INDEX IF NOT EXISTS idx_pickup_missions_agency ON pickup_missions(livreur_agency);
      CREATE INDEX IF NOT EXISTS idx_mission_demands_mission_id ON mission_demands(mission_id);
      CREATE INDEX IF NOT EXISTS idx_mission_demands_demand_id ON mission_demands(demand_id);
      CREATE INDEX IF NOT EXISTS idx_mission_parcels_mission_id ON mission_parcels(mission_id);
      CREATE INDEX IF NOT EXISTS idx_mission_parcels_parcel_id ON mission_parcels(parcel_id);
      CREATE INDEX IF NOT EXISTS idx_mission_parcels_status ON mission_parcels(status);
    `);
    
    console.log('✅ Pickup missions tables created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating pickup missions tables:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    await createPickupMissionsTables();
    console.log('🎉 Database migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  }
}

main(); 