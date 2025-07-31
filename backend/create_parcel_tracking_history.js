const { pool } = require('./config/database');

async function createParcelTrackingHistory() {
  try {
    console.log('🔧 CREATING PARCEL TRACKING HISTORY SYSTEM\n');
    
    // 1. Create parcel_tracking_history table if it doesn't exist
    console.log('📋 Creating parcel_tracking_history table...');
    console.log('=====================================');
    
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS parcel_tracking_history (
        id SERIAL PRIMARY KEY,
        parcel_id INTEGER NOT NULL,
        status VARCHAR(50) NOT NULL,
        previous_status VARCHAR(50),
        mission_id INTEGER,
        updated_by INTEGER,
        location VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (parcel_id) REFERENCES parcels(id) ON DELETE CASCADE,
        FOREIGN KEY (mission_id) REFERENCES pickup_missions(id) ON DELETE SET NULL,
        FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
      );
    `;
    
    await pool.query(createTableQuery);
    console.log('✅ parcel_tracking_history table created successfully');
    
    // 2. Create indexes for better performance
    console.log('\n📊 Creating indexes...');
    console.log('=====================================');
    
    const createIndexesQuery = `
      CREATE INDEX IF NOT EXISTS idx_parcel_tracking_history_parcel_id ON parcel_tracking_history(parcel_id);
      CREATE INDEX IF NOT EXISTS idx_parcel_tracking_history_status ON parcel_tracking_history(status);
      CREATE INDEX IF NOT EXISTS idx_parcel_tracking_history_created_at ON parcel_tracking_history(created_at);
      CREATE INDEX IF NOT EXISTS idx_parcel_tracking_history_mission_id ON parcel_tracking_history(mission_id);
    `;
    
    await pool.query(createIndexesQuery);
    console.log('✅ Indexes created successfully');
    
    // 3. Insert initial tracking records for existing parcels
    console.log('\n📦 Creating initial tracking records for existing parcels...');
    console.log('=====================================');
    
    const insertInitialRecordsQuery = `
      INSERT INTO parcel_tracking_history (parcel_id, status, previous_status, created_at)
      SELECT 
        id,
        status,
        NULL,
        created_at
      FROM parcels 
      WHERE id NOT IN (
        SELECT DISTINCT parcel_id FROM parcel_tracking_history
      )
    `;
    
    const insertResult = await pool.query(insertInitialRecordsQuery);
    console.log(`✅ Created ${insertResult.rowCount} initial tracking records`);
    
    // 4. Show sample of tracking history
    console.log('\n📊 Sample tracking history:');
    console.log('=====================================');
    
    const sampleQuery = `
      SELECT 
        pth.id,
        p.tracking_number,
        pth.status,
        pth.previous_status,
        pth.created_at,
        pth.notes
      FROM parcel_tracking_history pth
      JOIN parcels p ON pth.parcel_id = p.id
      ORDER BY pth.created_at DESC
      LIMIT 10
    `;
    
    const sampleResult = await pool.query(sampleQuery);
    
    if (sampleResult.rows.length > 0) {
      console.log('ID'.padEnd(5) + 'Tracking'.padEnd(15) + 'Status'.padEnd(20) + 'Previous'.padEnd(20) + 'Created');
      console.log('-'.repeat(80));
      
      sampleResult.rows.forEach(row => {
        console.log(
          row.id.toString().padEnd(5) + 
          (row.tracking_number || '').padEnd(15) + 
          (row.status || '').padEnd(20) + 
          (row.previous_status || 'N/A').padEnd(20) + 
          new Date(row.created_at).toLocaleString('fr-FR')
        );
      });
    } else {
      console.log('No tracking history found.');
    }
    
    console.log('\n✅ PARCEL TRACKING HISTORY SYSTEM SETUP COMPLETED!');
    console.log('=====================================');
    console.log('• parcel_tracking_history table created');
    console.log('• Indexes created for performance');
    console.log('• Initial tracking records inserted');
    console.log('• Ready for real-time status tracking');
    
  } catch (error) {
    console.error('❌ Error creating parcel tracking history:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await pool.end();
  }
}

// Run the setup
createParcelTrackingHistory(); 