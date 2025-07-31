const db = require('../config/database');

async function createDeliveryMissionsTable() {
  const client = await db.pool.connect();
  
  try {
    console.log('🔧 Creating delivery_missions table...');
    
    // Create delivery_missions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS delivery_missions (
        id SERIAL PRIMARY KEY,
        mission_number VARCHAR(50) UNIQUE NOT NULL,
        driver_id INTEGER NOT NULL,
        warehouse_id INTEGER NOT NULL,
        
        delivery_date DATE NOT NULL,
        estimated_parcels INTEGER DEFAULT 0,
        actual_parcels INTEGER DEFAULT 0,
        
        status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
        
        start_time TIMESTAMP NULL,
        end_time TIMESTAMP NULL,
        
        route_data JSONB,
        notes TEXT,
        created_by INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (driver_id) REFERENCES users(id),
        FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);
    
    console.log('✅ delivery_missions table created successfully');
    
    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_delivery_missions_driver ON delivery_missions(driver_id);
      CREATE INDEX IF NOT EXISTS idx_delivery_missions_date ON delivery_missions(delivery_date);
      CREATE INDEX IF NOT EXISTS idx_delivery_missions_status ON delivery_missions(status);
      CREATE INDEX IF NOT EXISTS idx_delivery_missions_warehouse ON delivery_missions(warehouse_id);
    `);
    
    console.log('✅ Indexes created successfully');
    
  } catch (error) {
    console.error('❌ Error creating delivery_missions table:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the migration
createDeliveryMissionsTable()
  .then(() => {
    console.log('🎉 Delivery missions table setup completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Delivery missions table setup failed:', error);
    process.exit(1);
  }); 