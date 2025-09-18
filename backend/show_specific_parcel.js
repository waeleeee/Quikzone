const db = require('./config/database');

const showSpecificParcel = async (trackingNumber) => {
  try {
    console.log(`📦 DETAILED INFORMATION FOR PARCEL: ${trackingNumber}\n`);
    console.log('=' .repeat(80));

    // Get detailed parcel information
    const parcelResult = await db.query(`
      SELECT 
        p.*,
        s.name as shipper_name,
        s.email as shipper_email,
        s.phone as shipper_phone,
        s.company as shipper_company,
        s.company_name as shipper_company_name,
        s.code as shipper_code,
        s.fiscal_number as shipper_fiscal_number,
        s.tax_number as shipper_tax_number,
        s.company_governorate as shipper_company_governorate,
        s.company_address as shipper_company_address,
        s.city as shipper_city,
        s.agency as shipper_agency,
        s.default_warehouse_id as shipper_default_warehouse,
        w.name as warehouse_name,
        w.governorate as warehouse_governorate,
        w.address as warehouse_address,
        u.first_name || ' ' || u.last_name as warehouse_manager_name
      FROM parcels p
      LEFT JOIN shippers s ON p.shipper_id = s.id
      LEFT JOIN warehouses w ON p.warehouse_id = w.id
      LEFT JOIN users u ON w.manager_id = u.id
      WHERE p.tracking_number = $1
    `, [trackingNumber]);

    if (parcelResult.rows.length === 0) {
      console.log(`❌ Parcel with tracking number ${trackingNumber} not found!`);
      return;
    }

    const parcel = parcelResult.rows[0];

    // Display basic parcel information
    console.log('\n📋 BASIC INFORMATION:');
    console.log('-' .repeat(50));
    console.log(`ID: ${parcel.id}`);
    console.log(`Tracking Number: ${parcel.tracking_number}`);
    console.log(`Status: ${parcel.status}`);
    console.log(`Destination: ${parcel.destination}`);
    console.log(`Weight: ${parcel.weight} kg`);
    console.log(`Price: ${parcel.price} TND`);
    console.log(`Type: ${parcel.type}`);
    console.log(`Client Code: ${parcel.client_code || 'Not generated'}`);
    console.log(`Created: ${parcel.created_at}`);
    console.log(`Updated: ${parcel.updated_at}`);

    // Display recipient information
    console.log('\n👤 RECIPIENT INFORMATION:');
    console.log('-' .repeat(50));
    console.log(`Name: ${parcel.recipient_name || 'Not specified'}`);
    console.log(`Phone: ${parcel.recipient_phone || 'Not specified'}`);
    console.log(`Phone 2: ${parcel.recipient_phone2 || 'Not specified'}`);
    console.log(`Address: ${parcel.recipient_address || 'Not specified'}`);
    console.log(`Governorate: ${parcel.recipient_governorate || 'Not specified'}`);

    // Display shipper information
    console.log('\n📦 SHIPPER INFORMATION:');
    console.log('-' .repeat(50));
    console.log(`Name: ${parcel.shipper_name || 'Not specified'}`);
    console.log(`Email: ${parcel.shipper_email || 'Not specified'}`);
    console.log(`Phone: ${parcel.shipper_phone || 'Not specified'}`);
    console.log(`Company: ${parcel.shipper_company || 'Not specified'}`);
    console.log(`Company Name: ${parcel.shipper_company_name || 'Not specified'}`);
    console.log(`Code: ${parcel.shipper_code || 'Not specified'}`);
    console.log(`Agency: ${parcel.shipper_agency || 'Not specified'}`);
    console.log(`Default Warehouse ID: ${parcel.shipper_default_warehouse || 'Not assigned'}`);

         // Display warehouse information
     console.log('\n🏢 WAREHOUSE INFORMATION:');
     console.log('-' .repeat(50));
     if (parcel.warehouse_id) {
       console.log(`Warehouse ID: ${parcel.warehouse_id}`);
       console.log(`Warehouse Name: ${parcel.warehouse_name || 'Not specified'}`);
       console.log(`Governorate: ${parcel.warehouse_governorate || 'Not specified'}`);
       console.log(`Address: ${parcel.warehouse_address || 'Not specified'}`);
       console.log(`Manager: ${parcel.warehouse_manager_name || 'Not assigned'}`);
     } else {
       console.log('❌ No warehouse assigned to this parcel');
     }

    // Display delivery information
    console.log('\n📅 DELIVERY INFORMATION:');
    console.log('-' .repeat(50));
    console.log(`Estimated Delivery Date: ${parcel.estimated_delivery_date || 'Not specified'}`);
    console.log(`Actual Delivery Date: ${parcel.actual_delivery_date || 'Not delivered yet'}`);
    console.log(`Pickup Date: ${parcel.pickup_date || 'Not specified'}`);

    // Display financial information
    console.log('\n💰 FINANCIAL INFORMATION:');
    console.log('-' .repeat(50));
    console.log(`Price: ${parcel.price || 0} TND`);
    console.log(`Delivery Fees: ${parcel.delivery_fees || 0} TND`);
    console.log(`Return Fees: ${parcel.return_fees || 0} TND`);

    // Display package details
    console.log('\n📦 PACKAGE DETAILS:');
    console.log('-' .repeat(50));
    console.log(`Article Name: ${parcel.article_name || 'Not specified'}`);
    console.log(`Number of Pieces: ${parcel.nb_pieces || 'Not specified'}`);
    console.log(`Remark: ${parcel.remark || 'No remarks'}`);

    // Display timeline information
    console.log('\n🕒 TIMELINE INFORMATION:');
    console.log('-' .repeat(50));
    console.log(`Created Date: ${parcel.created_date || parcel.created_at}`);
    console.log(`Created At: ${parcel.created_at}`);
    console.log(`Updated At: ${parcel.updated_at}`);

    // Check if there are any timeline entries
    const timelineResult = await db.query(`
      SELECT 
        status,
        location,
        timestamp,
        description,
        u.first_name || ' ' || u.last_name as updated_by_name
      FROM parcel_timeline pt
      LEFT JOIN users u ON pt.user_id = u.id
      WHERE pt.parcel_id = $1
      ORDER BY pt.timestamp DESC
    `, [parcel.id]);

    if (timelineResult.rows.length > 0) {
      console.log('\n📋 STATUS TIMELINE:');
      console.log('-' .repeat(50));
      timelineResult.rows.forEach((entry, index) => {
        console.log(`${index + 1}. ${entry.timestamp} - ${entry.status}`);
        if (entry.location) console.log(`   Location: ${entry.location}`);
        if (entry.description) console.log(`   Description: ${entry.description}`);
        if (entry.updated_by_name) console.log(`   Updated by: ${entry.updated_by_name}`);
        console.log('');
      });
    } else {
      console.log('No timeline entries found for this parcel');
    }

    // Check if parcel is assigned to any missions
    const missionResult = await db.query(`
      SELECT 
        mp.mission_id,
        mp.status as mission_parcel_status,
        pm.mission_number,
        pm.scheduled_date,
        pm.status as mission_status,
        d.first_name || ' ' || d.last_name as driver_name
      FROM mission_parcels mp
      LEFT JOIN pickup_missions pm ON mp.mission_id = pm.id
      LEFT JOIN drivers d ON pm.driver_id = d.id
      WHERE mp.parcel_id = $1
    `, [parcel.id]);

    if (missionResult.rows.length > 0) {
      console.log('\n🚚 MISSION ASSIGNMENTS:');
      console.log('-' .repeat(50));
      missionResult.rows.forEach((mission, index) => {
        console.log(`${index + 1}. Mission: ${mission.mission_number}`);
        console.log(`   Status: ${mission.mission_parcel_status}`);
        console.log(`   Scheduled: ${mission.scheduled_date}`);
        console.log(`   Mission Status: ${mission.mission_status}`);
        console.log(`   Driver: ${mission.driver_name || 'Not assigned'}`);
        console.log('');
      });
    } else {
      console.log('No mission assignments found for this parcel');
    }

    console.log('\n✅ Parcel information displayed successfully!');

  } catch (error) {
    console.error('❌ Error retrieving parcel information:', error);
  } finally {
    process.exit(0);
  }
};

// Get tracking number from command line argument or use default
const trackingNumber = process.argv[2] || 'C-481237';
showSpecificParcel(trackingNumber); 