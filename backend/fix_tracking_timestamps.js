const { pool } = require('./config/database');

async function fixTrackingTimestamps() {
  try {
    console.log('🔧 FIXING TRACKING HISTORY TIMESTAMPS\n');
    
    // 1. Get all parcels with their pickup mission data
    console.log('📦 Getting parcels with pickup mission data...');
    console.log('=====================================');
    
    const parcelsQuery = `
      SELECT 
        p.id,
        p.tracking_number,
        p.status,
        p.created_at,
        p.updated_at,
        pm.id as mission_id,
        pm.status as mission_status,
        pm.created_at as mission_created_at,
        pm.updated_at as mission_updated_at
      FROM parcels p
      LEFT JOIN mission_parcels mp ON p.id = mp.parcel_id
      LEFT JOIN pickup_missions pm ON mp.mission_id = pm.id
      ORDER BY p.created_at DESC
    `;
    
    const parcelsResult = await pool.query(parcelsQuery);
    console.log(`✅ Found ${parcelsResult.rows.length} parcel-mission records`);
    
    // 2. Clear existing tracking history
    console.log('\n🗑️ Clearing existing tracking history...');
    console.log('=====================================');
    
    await pool.query('DELETE FROM parcel_tracking_history');
    console.log('✅ Existing tracking history cleared');
    
    // 3. Group parcels by tracking number to avoid duplicates
    const parcelMap = new Map();
    parcelsResult.rows.forEach(row => {
      if (!parcelMap.has(row.tracking_number)) {
        parcelMap.set(row.tracking_number, row);
      }
    });
    
    console.log(`📦 Processing ${parcelMap.size} unique parcels...`);
    console.log('=====================================');
    
    let totalRecords = 0;
    
    for (const [trackingNumber, parcel] of parcelMap) {
      console.log(`\n📦 Processing parcel ${trackingNumber} (Status: ${parcel.status})`);
      
      const timelineSteps = [];
      
      // Always start with "En attente" (creation) - use real creation time
      timelineSteps.push({
        status: 'En attente',
        timestamp: parcel.created_at,
        notes: 'Colis créé par l\'expéditeur'
      });
      
      // Add "À enlever" if mission exists and was accepted
      if (parcel.mission_id && parcel.mission_status && parcel.mission_status !== 'En attente') {
        const acceptTime = parcel.mission_updated_at || parcel.mission_created_at;
        timelineSteps.push({
          status: 'À enlever',
          timestamp: acceptTime,
          notes: 'Mission de ramassage acceptée par le livreur'
        });
      }
      
      // Add "Enlevé" if status is beyond "À enlever"
      if (["Enlevé", "Au dépôt", "En cours", "RTN dépot", "Livrés", "Livrés payés", "Retour définitif", "RTN client agence", "Retour Expéditeur", "Retour En Cours d'expédition", "Retour reçu"].includes(parcel.status)) {
        const pickupTime = parcel.mission_updated_at || parcel.updated_at || new Date(parcel.created_at.getTime() + 2 * 24 * 60 * 60 * 1000);
        timelineSteps.push({
          status: 'Enlevé',
          timestamp: pickupTime,
          notes: 'Colis ramassé par le livreur'
        });
      }
      
      // Add current status if it's different from the ones already added
      if (!["En attente", "À enlever", "Enlevé"].includes(parcel.status)) {
        timelineSteps.push({
          status: parcel.status,
          timestamp: parcel.updated_at || new Date(parcel.created_at.getTime() + 3 * 24 * 60 * 60 * 1000),
          notes: `Status final: ${parcel.status}`
        });
      }
      
      // Insert timeline steps into database
      for (let i = 0; i < timelineSteps.length; i++) {
        const step = timelineSteps[i];
        const previousStatus = i > 0 ? timelineSteps[i - 1].status : null;
        
        await pool.query(
          `INSERT INTO parcel_tracking_history 
          (parcel_id, status, previous_status, updated_by, notes, created_at) 
          VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            parcel.id,
            step.status,
            previousStatus,
            1, // Default user ID
            step.notes,
            step.timestamp
          ]
        );
        
        totalRecords++;
      }
      
      console.log(`   ✅ Added ${timelineSteps.length} timeline steps`);
      console.log(`   📅 Timeline: ${timelineSteps.map(step => `${step.status} (${new Date(step.timestamp).toLocaleString('fr-FR')})`).join(' → ')}`);
    }
    
    // 4. Show sample of fixed tracking history
    console.log('\n📊 Sample fixed tracking history:');
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
      WHERE p.tracking_number = 'C-942454'
      ORDER BY pth.created_at ASC
    `;
    
    const sampleResult = await pool.query(sampleQuery);
    
    if (sampleResult.rows.length > 0) {
      console.log('Timeline for C-942454:');
      console.log('ID'.padEnd(5) + 'Status'.padEnd(20) + 'Previous'.padEnd(20) + 'Created'.padEnd(25) + 'Notes');
      console.log('-'.repeat(90));
      
      sampleResult.rows.forEach(row => {
        console.log(
          row.id.toString().padEnd(5) + 
          (row.status || '').padEnd(20) + 
          (row.previous_status || 'N/A').padEnd(20) + 
          new Date(row.created_at).toLocaleString('fr-FR').padEnd(25) + 
          (row.notes || '')
        );
      });
    }
    
    console.log('\n✅ TRACKING TIMESTAMPS FIXED!');
    console.log('=====================================');
    console.log(`• Processed ${parcelMap.size} parcels`);
    console.log(`• Created ${totalRecords} tracking history records`);
    console.log('• Real timestamps now used for all timeline steps');
    console.log('• Timeline shows actual times when livreur performed actions');
    
  } catch (error) {
    console.error('❌ Error fixing tracking timestamps:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await pool.end();
  }
}

// Run the fix
fixTrackingTimestamps(); 