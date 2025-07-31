const db = require('../config/database');

async function createDeliveryMissionParcelsTable() {
  const client = await db.pool.connect();
  
  try {
    console.log('🔧 Creating delivery_mission_parcels table...');
    
    // Create delivery_mission_parcels table
    await client.query(`
      CREATE TABLE IF NOT EXISTS delivery_mission_parcels (
        id SERIAL PRIMARY KEY,
        mission_id INTEGER NOT NULL,
        parcel_id INTEGER NOT NULL,
        sequence_order INTEGER DEFAULT 0,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'skipped')),
        completed_at TIMESTAMP NULL,
        notes TEXT,
        
        FOREIGN KEY (mission_id) REFERENCES delivery_missions(id) ON DELETE CASCADE,
        FOREIGN KEY (parcel_id) REFERENCES parcels(id) ON DELETE CASCADE,
        
        CONSTRAINT unique_delivery_mission_parcel UNIQUE (mission_id, parcel_id)
      )
    `);
    
    console.log('✅ delivery_mission_parcels table created successfully');
    
    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_delivery_mission_parcels_mission ON delivery_mission_parcels(mission_id);
      CREATE INDEX IF NOT EXISTS idx_delivery_mission_parcels_parcel ON delivery_mission_parcels(parcel_id);
      CREATE INDEX IF NOT EXISTS idx_delivery_mission_parcels_status ON delivery_mission_parcels(status);
    `);
    
    console.log('✅ Indexes created successfully');
    
  } catch (error) {
    console.error('❌ Error creating delivery_mission_parcels table:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the migration
createDeliveryMissionParcelsTable()
  .then(() => {
    console.log('🎉 Delivery mission parcels table setup completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Delivery mission parcels table setup failed:', error);
    process.exit(1);
  }); 