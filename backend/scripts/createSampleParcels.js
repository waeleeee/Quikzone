const db = require('../config/database');

const createSampleParcels = async () => {
  try {
    console.log('📦 Creating sample parcels for shippers...\n');
    
    // Get all shippers
    const shippersResult = await db.query(`
      SELECT id, name, email, company 
      FROM shippers 
      ORDER BY name
    `);
    
    console.log(`📦 Found ${shippersResult.rows.length} shippers`);
    
    // Sample parcel data for each shipper
    const sampleParcels = [
      {
        tracking_number: 'QZ2024001',
        destination: 'Tunis Centre, Tunis',
        status: 'En cours',
        weight: 2.5,
        price: 15.50,
        type: 'Standard',
        estimated_delivery_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      {
        tracking_number: 'QZ2024002',
        destination: 'Sousse Médina, Sousse',
        status: 'Livrés',
        weight: 1.8,
        price: 12.00,
        type: 'Express',
        estimated_delivery_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      {
        tracking_number: 'QZ2024003',
        destination: 'Sfax Ville, Sfax',
        status: 'En attente',
        weight: 3.2,
        price: 18.75,
        type: 'Standard',
        estimated_delivery_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      {
        tracking_number: 'QZ2024004',
        destination: 'Monastir Centre, Monastir',
        status: 'Au dépôt',
        weight: 0.8,
        price: 8.50,
        type: 'Document',
        estimated_delivery_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      {
        tracking_number: 'QZ2024005',
        destination: 'Nabeul Hammamet, Nabeul',
        status: 'Livrés payés',
        weight: 4.1,
        price: 22.00,
        type: 'Fragile',
        estimated_delivery_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }
    ];
    
    let totalCreated = 0;
    
    for (const shipper of shippersResult.rows) {
      console.log(`\n📦 Creating parcels for ${shipper.name} (${shipper.email})`);
      
      for (let i = 0; i < sampleParcels.length; i++) {
        const parcel = sampleParcels[i];
        const trackingNumber = `${parcel.tracking_number}-${shipper.id}-${i + 1}`;
        
        try {
          await db.query(`
            INSERT INTO parcels (
              tracking_number, shipper_id, destination, status, weight, price, type,
              estimated_delivery_date, delivery_fees, return_fees, created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          `, [
            trackingNumber,
            shipper.id,
            parcel.destination,
            parcel.status,
            parcel.weight,
            parcel.price,
            parcel.type,
            parcel.estimated_delivery_date,
            parcel.price * 0.1, // 10% delivery fees
            parcel.price * 0.05  // 5% return fees
          ]);
          
          console.log(`  ✅ Created parcel: ${trackingNumber} - ${parcel.destination} (${parcel.status})`);
          totalCreated++;
        } catch (error) {
          if (error.code === '23505') { // Unique constraint violation
            console.log(`  ⚠️  Parcel ${trackingNumber} already exists, skipping...`);
          } else {
            console.error(`  ❌ Error creating parcel ${trackingNumber}:`, error.message);
          }
        }
      }
    }
    
    console.log(`\n🎉 Summary:`);
    console.log(`   - Total parcels created: ${totalCreated}`);
    console.log(`   - Parcels per shipper: ${sampleParcels.length}`);
    
    // Show some sample data
    console.log('\n📊 Sample parcels created:');
    const sampleResult = await db.query(`
      SELECT p.tracking_number, p.destination, p.status, p.weight, p.price, s.name as shipper_name
      FROM parcels p
      JOIN shippers s ON p.shipper_id = s.id
      ORDER BY p.created_at DESC
      LIMIT 10
    `);
    
    sampleResult.rows.forEach((parcel, index) => {
      console.log(`${index + 1}. ${parcel.tracking_number} - ${parcel.shipper_name} - ${parcel.destination} (${parcel.status})`);
    });
    
  } catch (error) {
    console.error('❌ Error creating sample parcels:', error);
  } finally {
    process.exit(0);
  }
};

createSampleParcels(); 