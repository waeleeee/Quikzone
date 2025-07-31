const { pool } = require('./config/database');

async function populateTrackingHistory() {
  try {
    console.log('🔧 POPULATING TRACKING HISTORY FOR EXISTING PARCELS\n');
    
    // 1. Get all parcels with their current status
    console.log('📦 Getting all parcels...');
    console.log('=====================================');
    
    const parcelsQuery = `
      SELECT 
        p.id,
        p.tracking_number,
        p.status,
        p.created_at,
        p.updated_at,
        s.name as shipper_name,
        s.company_address as shipper_address,
        s.city as shipper_city
      FROM parcels p
      LEFT JOIN shippers s ON p.shipper_id = s.id
      ORDER BY p.created_at DESC
    `;
    
    const parcelsResult = await pool.query(parcelsQuery);
    console.log(`✅ Found ${parcelsResult.rows.length} parcels`);
    
    // 2. Clear existing tracking history to avoid duplicates
    console.log('\n🗑️ Clearing existing tracking history...');
    console.log('=====================================');
    
    await pool.query('DELETE FROM parcel_tracking_history');
    console.log('✅ Existing tracking history cleared');
    
    // 3. Populate tracking history for each parcel
    console.log('\n📊 Populating tracking history...');
    console.log('=====================================');
    
    let totalRecords = 0;
    
    for (const parcel of parcelsResult.rows) {
      console.log(`\n📦 Processing parcel ${parcel.tracking_number} (Status: ${parcel.status})`);
      
      const timelineSteps = [];
      
      // Always start with "En attente" (creation)
      timelineSteps.push({
        status: 'En attente',
        timestamp: parcel.created_at,
        notes: 'Colis créé par l\'expéditeur'
      });
      
      // Add "À enlever" if status is beyond "En attente"
      if (["À enlever", "Enlevé", "Au dépôt", "En cours", "RTN dépot", "Livrés", "Livrés payés", "Retour définitif", "RTN client agence", "Retour Expéditeur", "Retour En Cours d'expédition", "Retour reçu"].includes(parcel.status)) {
        timelineSteps.push({
          status: 'À enlever',
          timestamp: new Date(parcel.created_at.getTime() + 24 * 60 * 60 * 1000), // 1 day after creation
          notes: 'Mission de ramassage créée'
        });
      }
      
      // Add "Enlevé" if status is beyond "À enlever"
      if (["Enlevé", "Au dépôt", "En cours", "RTN dépot", "Livrés", "Livrés payés", "Retour définitif", "RTN client agence", "Retour Expéditeur", "Retour En Cours d'expédition", "Retour reçu"].includes(parcel.status)) {
        timelineSteps.push({
          status: 'Enlevé',
          timestamp: new Date(parcel.created_at.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days after creation
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
    }
    
    // 4. Show sample of populated tracking history
    console.log('\n📊 Sample populated tracking history:');
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
    
    console.log('\n✅ TRACKING HISTORY POPULATION COMPLETED!');
    console.log('=====================================');
    console.log(`• Processed ${parcelsResult.rows.length} parcels`);
    console.log(`• Created ${totalRecords} tracking history records`);
    console.log('• Complete timeline now available for all parcels');
    console.log('• Ready for expéditeur timeline viewing');
    
  } catch (error) {
    console.error('❌ Error populating tracking history:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await pool.end();
  }
}

// Run the population
populateTrackingHistory(); 