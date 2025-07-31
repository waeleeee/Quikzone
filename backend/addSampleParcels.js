const db = require('./config/database');

// Sample parcels data with real information
const sampleParcels = [
  {
    tracking_number: "C-487315",
    shipper_id: 39, // Ritej Chaieb's shipper ID
    destination: "Nour - korba ,Nabeul, Nabeul",
    status: "En attente",
    weight: 1.0,
    price: 208.00,
    delivery_fees: 8.00,
    type: "Livraison",
    estimated_delivery_date: "2025-07-19",
    // Client information
    recipient_name: "Nour",
    recipient_phone: "90401638",
    recipient_phone2: null,
    recipient_address: "korba ,Nabeul",
    recipient_governorate: "Nabeul",
    // Additional info
    article_name: "Zina Wear coli 1",
    remarks: "Zina Wear coli 1"
  },
  {
    tracking_number: "C-487316",
    shipper_id: 39, // Ritej Chaieb's shipper ID
    destination: "sana - Msaken , Sousse, Sousse",
    status: "En attente",
    weight: 1.0,
    price: 450.00,
    delivery_fees: 8.00,
    type: "Livraison",
    estimated_delivery_date: "2025-07-19",
    // Client information
    recipient_name: "sana",
    recipient_phone: "28615601",
    recipient_phone2: null,
    recipient_address: "Msaken , Sousse",
    recipient_governorate: "Sousse",
    // Additional info
    article_name: "Zina Wear coli 2",
    remarks: "Zina Wear coli 2"
  },
  {
    tracking_number: "C-487317",
    shipper_id: 39, // Ritej Chaieb's shipper ID
    destination: "achref - hajeb layoun , kairauan, Kairouan",
    status: "En attente",
    weight: 1.0,
    price: 68.00,
    delivery_fees: 8.00,
    type: "Livraison",
    estimated_delivery_date: "2025-07-19",
    // Client information
    recipient_name: "achref",
    recipient_phone: "255998659",
    recipient_phone2: null,
    recipient_address: "hajeb layoun , kairauan",
    recipient_governorate: "Kairouan",
    // Additional info
    article_name: "Zina Wear coli 3",
    remarks: "Zina Wear coli 3"
  }
];

async function addSampleParcels() {
  try {
    console.log('🚀 Adding sample parcels with real client information...');
    
    for (const parcel of sampleParcels) {
      console.log(`📦 Creating parcel: ${parcel.tracking_number}`);
      
      const result = await db.query(`
        INSERT INTO parcels (
          tracking_number, shipper_id, destination, status, weight, price, type,
          estimated_delivery_date, delivery_fees, return_fees,
          recipient_name, recipient_phone, recipient_phone2, recipient_address, recipient_governorate
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *
      `, [
        parcel.tracking_number,
        parcel.shipper_id,
        parcel.destination,
        parcel.status,
        parcel.weight,
        parcel.price,
        parcel.type,
        parcel.estimated_delivery_date,
        parcel.delivery_fees,
        null, // return_fees
        parcel.recipient_name,
        parcel.recipient_phone,
        parcel.recipient_phone2,
        parcel.recipient_address,
        parcel.recipient_governorate
      ]);
      
      console.log(`✅ Created parcel ${parcel.tracking_number}:`, {
        id: result.rows[0].id,
        recipient_name: result.rows[0].recipient_name,
        recipient_phone: result.rows[0].recipient_phone,
        recipient_address: result.rows[0].recipient_address,
        price: result.rows[0].price
      });
    }
    
    console.log('🎉 All sample parcels created successfully!');
    
    // Verify the parcels were created
    console.log('\n📋 Verifying created parcels...');
    const verifyResult = await db.query(`
      SELECT 
        p.tracking_number,
        p.recipient_name,
        p.recipient_phone,
        p.recipient_address,
        p.price,
        s.name as shipper_name,
        s.phone as shipper_phone
      FROM parcels p
      LEFT JOIN shippers s ON p.shipper_id = s.id
      WHERE p.tracking_number IN ('C-487315', 'C-487316', 'C-487317')
      ORDER BY p.tracking_number
    `);
    
    console.log('📊 Created parcels summary:');
    verifyResult.rows.forEach(row => {
      console.log(`  ${row.tracking_number}: ${row.recipient_name} (${row.recipient_phone}) - ${row.price} DT`);
    });
    
  } catch (error) {
    console.error('❌ Error creating sample parcels:', error);
  } finally {
    process.exit();
  }
}

addSampleParcels(); 