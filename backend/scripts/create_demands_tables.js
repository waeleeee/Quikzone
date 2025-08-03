const { Pool } = require('pg');
require('dotenv').config({ path: './config.env' });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'quickzone_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'waelrh',
  max: 200,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: false
});

async function createDemandsTables() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Creating demands tables...');
    
    // Create demands table
    await client.query(`
      CREATE TABLE IF NOT EXISTS demands (
        id SERIAL PRIMARY KEY,
        expediteur_id INTEGER NOT NULL,
        expediteur_email VARCHAR(100) NOT NULL,
        expediteur_name VARCHAR(100) NOT NULL,
        expediteur_agency VARCHAR(100),
        status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Accepted', 'Not Accepted')),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reviewed_by INTEGER,
        reviewed_at TIMESTAMP,
        review_notes TEXT,
        FOREIGN KEY (expediteur_id) REFERENCES shippers(id) ON DELETE CASCADE,
        FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    
    console.log('✅ Demands table created successfully');
    
    // Create demand_parcels table (many-to-many relationship)
    await client.query(`
      CREATE TABLE IF NOT EXISTS demand_parcels (
        id SERIAL PRIMARY KEY,
        demand_id INTEGER NOT NULL,
        parcel_id INTEGER NOT NULL,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (demand_id) REFERENCES demands(id) ON DELETE CASCADE,
        FOREIGN KEY (parcel_id) REFERENCES parcels(id) ON DELETE CASCADE,
        UNIQUE(demand_id, parcel_id)
      )
    `);
    
    console.log('✅ Demand_parcels table created successfully');
    
    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_demands_expediteur_id ON demands(expediteur_id);
      CREATE INDEX IF NOT EXISTS idx_demands_status ON demands(status);
      CREATE INDEX IF NOT EXISTS idx_demands_created_at ON demands(created_at);
      CREATE INDEX IF NOT EXISTS idx_demand_parcels_demand_id ON demand_parcels(demand_id);
      CREATE INDEX IF NOT EXISTS idx_demand_parcels_parcel_id ON demand_parcels(parcel_id);
    `);
    
    console.log('✅ Indexes created successfully');
    
    console.log('🎉 All demands tables created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating demands tables:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    await createDemandsTables();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

main(); 