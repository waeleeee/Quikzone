const db = require('../config/database');

const showShippersDetails = async () => {
  try {
    console.log('📦 SHIPPERS DETAILED INFORMATION\n');
    console.log('✅ Connected to PostgreSQL database\n');

    // Get all shippers with complete information
    const shippers = await db.query(`
      SELECT 
        s.*,
        c.name as commercial_name,
        c.email as commercial_email,
        c.phone as commercial_phone,
        d.name as driver_name,
        d.phone as driver_phone
      FROM shippers s
      LEFT JOIN commercials c ON s.commercial_id = c.id
      LEFT JOIN drivers d ON s.default_driver_id = d.id
      ORDER BY s.id
    `);

    console.log(`Found ${shippers.rows.length} shippers:\n`);

    // Use for...of instead of forEach to handle async operations
    for (const shipper of shippers.rows) {
      console.log(`🔸 SHIPPER #${shipper.id}: ${shipper.name.toUpperCase()}`);
      console.log('═'.repeat(80));
      
      // Basic Information
      console.log('📋 BASIC INFORMATION:');
      console.log(`   ID: ${shipper.id}`);
      console.log(`   Code: ${shipper.code}`);
      console.log(`   Name: ${shipper.name}`);
      console.log(`   Email: ${shipper.email}`);
      console.log(`   Phone: ${shipper.phone || 'N/A'}`);
      console.log(`   Status: ${shipper.status}`);
      console.log(`   Created: ${shipper.created_at}`);
      console.log(`   Updated: ${shipper.updated_at}`);
      
      // Company Information
      console.log('\n🏢 COMPANY INFORMATION:');
      console.log(`   Company Name: ${shipper.company_name || shipper.company || 'N/A'}`);
      console.log(`   Company Address: ${shipper.company_address || 'N/A'}`);
      console.log(`   Company Governorate: ${shipper.company_governorate || 'N/A'}`);
      console.log(`   City: ${shipper.city || 'N/A'}`);
      console.log(`   Fiscal Number: ${shipper.fiscal_number || 'N/A'}`);
      console.log(`   Tax Number: ${shipper.tax_number || 'N/A'}`);
      console.log(`   Commercial Register: ${shipper.commercial_register || 'N/A'}`);
      console.log(`   SIRET: ${shipper.siret || 'N/A'}`);
      console.log(`   Passport Number: ${shipper.passport_number || 'N/A'}`);
      
      // Identity Information
      console.log('\n🆔 IDENTITY INFORMATION:');
      console.log(`   Identity Number: ${shipper.identity_number || 'N/A'}`);
      console.log(`   ID Document: ${shipper.id_document || 'N/A'}`);
      console.log(`   Company Documents: ${shipper.company_documents || 'N/A'}`);
      
      // Financial Information
      console.log('\n💰 FINANCIAL INFORMATION:');
      console.log(`   Delivery Fees: ${shipper.delivery_fees || 0}€`);
      console.log(`   Return Fees: ${shipper.return_fees || 0}€`);
      console.log(`   Total Revenue: ${shipper.total_revenue || 0}€`);
      console.log(`   Total Paid: ${shipper.total_paid || 0}€`);
      console.log(`   Bank Info: ${shipper.bank_info ? JSON.stringify(shipper.bank_info) : 'N/A'}`);
      
      // Operational Information
      console.log('\n📊 OPERATIONAL INFORMATION:');
      console.log(`   Total Parcels: ${shipper.total_parcels || 0}`);
      console.log(`   Delivered Parcels: ${shipper.delivered_parcels || 0}`);
      console.log(`   Returned Parcels: ${shipper.returned_parcels || 0}`);
      console.log(`   Pending Parcels: ${shipper.pending_parcels || 0}`);
      
      // Agency & Commercial Information
      console.log('\n🏢 AGENCY & COMMERCIAL:');
      console.log(`   Agency: ${shipper.agency || 'N/A'}`);
      console.log(`   Commercial ID: ${shipper.commercial_id || 'N/A'}`);
      console.log(`   Commercial Name: ${shipper.commercial_name || 'N/A'}`);
      console.log(`   Commercial Email: ${shipper.commercial_email || 'N/A'}`);
      console.log(`   Commercial Phone: ${shipper.commercial_phone || 'N/A'}`);
      
      // Driver Information
      console.log('\n🚚 DRIVER INFORMATION:');
      console.log(`   Default Driver ID: ${shipper.default_driver_id || 'N/A'}`);
      console.log(`   Driver Name: ${shipper.driver_name || 'N/A'}`);
      console.log(`   Driver Phone: ${shipper.driver_phone || 'N/A'}`);
      
      // Get related data
      const parcels = await db.query(`
        SELECT COUNT(*) as total,
               COUNT(CASE WHEN status = 'Livrés' THEN 1 END) as delivered,
               COUNT(CASE WHEN status = 'En cours' THEN 1 END) as in_transit,
               COUNT(CASE WHEN status = 'En attente' THEN 1 END) as pending
        FROM parcels WHERE shipper_id = $1
      `, [shipper.id]);
      
      const payments = await db.query(`
        SELECT COUNT(*) as total,
               COUNT(CASE WHEN status = 'Payé' THEN 1 END) as paid,
               COUNT(CASE WHEN status = 'En attente' THEN 1 END) as pending,
               COALESCE(SUM(amount), 0) as total_amount
        FROM payments WHERE shipper_id = $1
      `, [shipper.id]);
      
      const complaints = await db.query(`
        SELECT COUNT(*) as total,
               COUNT(CASE WHEN status = 'Traitée' THEN 1 END) as resolved,
               COUNT(CASE WHEN status = 'En attente' THEN 1 END) as pending
        FROM complaints WHERE client_id = $1
      `, [shipper.id]);
      
      console.log('\n📈 STATISTICS:');
      console.log(`   Parcels - Total: ${parcels.rows[0].total}, Delivered: ${parcels.rows[0].delivered}, In Transit: ${parcels.rows[0].in_transit}, Pending: ${parcels.rows[0].pending}`);
      console.log(`   Payments - Total: ${payments.rows[0].total}, Paid: ${payments.rows[0].paid}, Pending: ${payments.rows[0].pending}, Amount: ${payments.rows[0].total_amount}€`);
      console.log(`   Complaints - Total: ${complaints.rows[0].total}, Resolved: ${complaints.rows[0].resolved}, Pending: ${complaints.rows[0].pending}`);
      
      console.log('\n' + '═'.repeat(80) + '\n');
    }

    // Show summary table
    console.log('📊 SHIPPERS SUMMARY TABLE:');
    console.log('ID | Code    | Name                    | Email                    | Status | Parcels | Revenue | Commercial');
    console.log('---|---------|-------------------------|--------------------------|--------|---------|---------|-----------');
    
    for (const shipper of shippers.rows) {
      const parcels = shipper.total_parcels || 0;
      const revenue = shipper.total_revenue || 0;
      const commercial = shipper.commercial_name || 'N/A';
      
      console.log(`${shipper.id.toString().padStart(2)} | ${shipper.code.padEnd(7)} | ${shipper.name.padEnd(23)} | ${shipper.email.padEnd(24)} | ${shipper.status.padEnd(6)} | ${parcels.toString().padStart(7)} | ${revenue.toString().padStart(7)}€ | ${commercial}`);
    }

  } catch (error) {
    console.error('❌ Error showing shippers details:', error);
  } finally {
    process.exit(0);
  }
};

showShippersDetails(); 