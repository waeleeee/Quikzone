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
    
    // Check if mission_parcels table exists, if not create it
    const missionParcelsExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'mission_parcels'
      )
    `);
    
    if (!missionParcelsExists.rows[0].exists) {
      console.log('🔧 Creating mission_parcels table...');
      
      await client.query(`
        CREATE TABLE mission_parcels (
          id SERIAL PRIMARY KEY,
          mission_id INTEGER NOT NULL,
          parcel_id INTEGER NOT NULL,
          mission_type VARCHAR(10) NOT NULL CHECK (mission_type IN ('pickup', 'delivery')),
          sequence_order INTEGER DEFAULT 0,
          status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'skipped')),
          completed_at TIMESTAMP NULL,
          notes TEXT,
          
          FOREIGN KEY (mission_id) REFERENCES delivery_missions(id) ON DELETE CASCADE,
          FOREIGN KEY (parcel_id) REFERENCES parcels(id) ON DELETE CASCADE,
          
          CONSTRAINT unique_mission_parcel UNIQUE (mission_id, parcel_id, mission_type)
        )
      `);
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_mission_parcels_mission ON mission_parcels(mission_id);
        CREATE INDEX IF NOT EXISTS idx_mission_parcels_parcel ON mission_parcels(parcel_id);
        CREATE INDEX IF NOT EXISTS idx_mission_parcels_status ON mission_parcels(status);
      `);
      
      console.log('✅ mission_parcels table created successfully');
    } else {
      console.log('✅ mission_parcels table already exists');
    }
    
    // Add security code columns to parcels table if they don't exist
    const clientCodeExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'parcels' AND column_name = 'client_code'
      )
    `);
    
    if (!clientCodeExists.rows[0].exists) {
      console.log('🔧 Adding security code fields to parcels table...');
      
      await client.query(`
        ALTER TABLE parcels 
        ADD COLUMN client_code VARCHAR(10),
        ADD COLUMN failed_code VARCHAR(10)
      `);
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_parcels_client_code ON parcels(client_code);
        CREATE INDEX IF NOT EXISTS idx_parcels_failed_code ON parcels(failed_code);
      `);
      
      // Update existing parcels with random security codes
      const updateResult = await client.query(`
        UPDATE parcels 
        SET client_code = SUBSTRING(MD5(RANDOM()::TEXT), 1, 6),
            failed_code = SUBSTRING(MD5(RANDOM()::TEXT), 1, 6)
        WHERE client_code IS NULL OR failed_code IS NULL
      `);
      
      console.log(`✅ Updated ${updateResult.rowCount} parcels with security codes`);
    } else {
      console.log('✅ Security code fields already exist in parcels table');
    }
    
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