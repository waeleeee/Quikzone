const db = require('./config/database');

// Parcels data for fedi shipper (ID 43 based on the data overview)
const fediParcels = [
  // 2 Delivered parcels (Livrés)
  {
    tracking_number: "C-123456",
    shipper_id: 43, // fedi shipper ID
    destination: "Ahmed Ben Ali - Tunis Centre, Tunis, Tunis",
    status: "Livrés",
    weight: 2.5,
    price: 45.00,
    delivery_fees: 8.00,
    type: "Livraison",
    estimated_delivery_date: "2025-07-15",
    actual_delivery_date: "2025-07-16",
    // Client information
    recipient_name: "Ahmed Ben Ali",
    recipient_phone: "71234567",
    recipient_phone2: null,
    recipient_address: "Tunis Centre, Tunis",
    recipient_governorate: "Tunis",
    // Additional info
    article_name: "Vêtements",
    remark: "Livraison standard"
  },
  {
    tracking_number: "C-123457",
    shipper_id: 43, // fedi shipper ID
    destination: "Fatima Mansouri - Sousse Médina, Sousse, Sousse",
    status: "Livrés",
    weight: 1.8,
    price: 32.00,
    delivery_fees: 8.00,
    type: "Livraison",
    estimated_delivery_date: "2025-07-14",
    actual_delivery_date: "2025-07-15",
    // Client information
    recipient_name: "Fatima Mansouri",
    recipient_phone: "73456789",
    recipient_phone2: null,
    recipient_address: "Sousse Médina, Sousse",
    recipient_governorate: "Sousse",
    // Additional info
    article_name: "Électronique",
    remark: "Livraison express"
  },
  // 2 Returned parcels (Retour)
  {
    tracking_number: "C-123458",
    shipper_id: 43, // fedi shipper ID
    destination: "Mohamed Karray - Sfax Ville, Sfax, Sfax",
    status: "Retour",
    weight: 3.2,
    price: 55.00,
    delivery_fees: 8.00,
    return_fees: 4.00,
    type: "Livraison",
    estimated_delivery_date: "2025-07-13",
    actual_delivery_date: "2025-07-14",
    // Client information
    recipient_name: "Mohamed Karray",
    recipient_phone: "74567890",
    recipient_phone2: null,
    recipient_address: "Sfax Ville, Sfax",
    recipient_governorate: "Sfax",
    // Additional info
    article_name: "Livres",
    remark: "Retour client"
  },
  {
    tracking_number: "C-123459",
    shipper_id: 43, // fedi shipper ID
    destination: "Leila Trabelsi - Monastir Centre, Monastir, Monastir",
    status: "Retour",
    weight: 1.5,
    price: 28.00,
    delivery_fees: 8.00,
    return_fees: 4.00,
    type: "Livraison",
    estimated_delivery_date: "2025-07-12",
    actual_delivery_date: "2025-07-13",
    // Client information
    recipient_name: "Leila Trabelsi",
    recipient_phone: "75678901",
    recipient_phone2: null,
    recipient_address: "Monastir Centre, Monastir",
    recipient_governorate: "Monastir",
    // Additional info
    article_name: "Accessoires",
    remark: "Retour définitif"
  }
];

async function addFediParcels() {
  try {
    console.log('🚀 Adding parcels for fedi shipper...');
    
    // First, verify fedi shipper exists
    const shipperCheck = await db.query(`
      SELECT id, name, email FROM shippers WHERE id = 43
    `);
    
    if (shipperCheck.rows.length === 0) {
      console.error('❌ Shipper with ID 43 (fedi) not found!');
      return;
    }
    
    console.log(`✅ Found shipper: ${shipperCheck.rows[0].name} (${shipperCheck.rows[0].email})`);
    
    for (const parcel of fediParcels) {
      console.log(`📦 Creating parcel: ${parcel.tracking_number} - ${parcel.status}`);
      
      const result = await db.query(`
        INSERT INTO parcels (
          tracking_number, shipper_id, destination, status, weight, price, type,
          estimated_delivery_date, actual_delivery_date, delivery_fees, return_fees,
          recipient_name, recipient_phone, recipient_phone2, recipient_address, recipient_governorate,
          article_name, remark
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
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
        parcel.actual_delivery_date,
        parcel.delivery_fees,
        parcel.return_fees || null,
        parcel.recipient_name,
        parcel.recipient_phone,
        parcel.recipient_phone2,
        parcel.recipient_address,
        parcel.recipient_governorate,
        parcel.article_name,
        parcel.remark
      ]);
      
      console.log(`✅ Created parcel ${parcel.tracking_number}:`, {
        id: result.rows[0].id,
        status: result.rows[0].status,
        recipient_name: result.rows[0].recipient_name,
        price: result.rows[0].price
      });
    }
    
    console.log('🎉 All fedi parcels created successfully!');
    
    // Verify the parcels were created
    console.log('\n📋 Verifying created parcels...');
    const verifyResult = await db.query(`
      SELECT 
        p.tracking_number,
        p.status,
        p.recipient_name,
        p.recipient_phone,
        p.recipient_address,
        p.price,
        p.weight,
        s.name as shipper_name
      FROM parcels p
      LEFT JOIN shippers s ON p.shipper_id = s.id
      WHERE p.tracking_number IN ('C-123456', 'C-123457', 'C-123458', 'C-123459')
      ORDER BY p.tracking_number
    `);
    
    console.log('📊 Created parcels summary:');
    verifyResult.rows.forEach(row => {
      console.log(`  ${row.tracking_number}: ${row.recipient_name} (${row.recipient_phone}) - ${row.price} DT - ${row.status}`);
    });
    
    // Show summary by status
    const statusSummary = verifyResult.rows.reduce((acc, row) => {
      acc[row.status] = (acc[row.status] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\n📈 Status summary:');
    Object.entries(statusSummary).forEach(([status, count]) => {
      console.log(`  ${status}: ${count} parcels`);
    });
    
  } catch (error) {
    console.error('❌ Error creating fedi parcels:', error);
  } finally {
    process.exit(0);
  }
}

addFediParcels(); 