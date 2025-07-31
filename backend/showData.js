const db = require('./config/database');

const showData = async () => {
  try {
    console.log('🔍 QuickZone Database Data Overview\n');
    
    // Users
    console.log('👥 USERS:');
    const users = await db.query('SELECT id, username, email, first_name, last_name, is_active FROM users ORDER BY id');
    users.rows.forEach(user => {
      console.log(`  ${user.id}. ${user.first_name} ${user.last_name} (${user.email}) - ${user.is_active ? 'Active' : 'Inactive'}`);
    });
    console.log('');
    
    // Administrators
    console.log('👑 ADMINISTRATORS:');
    const admins = await db.query('SELECT id, name, email, phone, governorate, role FROM administrators ORDER BY id');
    admins.rows.forEach(admin => {
      console.log(`  ${admin.id}. ${admin.name} (${admin.email}) - ${admin.role} - ${admin.governorate}`);
    });
    console.log('');
    
    // Commercials
    console.log('💼 COMMERCIALS:');
    const commercials = await db.query('SELECT id, name, email, phone, governorate, title, clients_count FROM commercials ORDER BY id');
    commercials.rows.forEach(commercial => {
      console.log(`  ${commercial.id}. ${commercial.name} (${commercial.email}) - ${commercial.title} - ${commercial.clients_count} clients`);
    });
    console.log('');
    
    // Accountants
    console.log('💰 ACCOUNTANTS:');
    const accountants = await db.query('SELECT id, name, email, phone, governorate, title, agency FROM accountants ORDER BY id');
    accountants.rows.forEach(accountant => {
      console.log(`  ${accountant.id}. ${accountant.name} (${accountant.email}) - ${accountant.title} - ${accountant.agency}`);
    });
    console.log('');
    
    // Agency Managers
    console.log('🏢 AGENCY MANAGERS:');
    const managers = await db.query('SELECT id, name, email, phone, governorate, agency FROM agency_managers ORDER BY id');
    managers.rows.forEach(manager => {
      console.log(`  ${manager.id}. ${manager.name} (${manager.email}) - ${manager.agency} - ${manager.governorate}`);
    });
    console.log('');
    
    // Agency Members
    console.log('👥 AGENCY MEMBERS:');
    const members = await db.query('SELECT id, name, email, phone, governorate, agency, role, status FROM agency_members ORDER BY id');
    members.rows.forEach(member => {
      console.log(`  ${member.id}. ${member.name} (${member.email}) - ${member.role} - ${member.agency} - ${member.status}`);
    });
    console.log('');
    
    // Drivers
    console.log('🚚 DRIVERS:');
    const drivers = await db.query('SELECT id, name, email, phone, governorate, vehicle, status FROM drivers ORDER BY id');
    drivers.rows.forEach(driver => {
      console.log(`  ${driver.id}. ${driver.name} (${driver.email}) - ${driver.vehicle} - ${driver.status}`);
    });
    console.log('');
    
    // Shippers
    console.log('📦 SHIPPERS:');
    const shippers = await db.query('SELECT id, code, name, email, company, total_parcels, status FROM shippers ORDER BY id');
    shippers.rows.forEach(shipper => {
      console.log(`  ${shipper.id}. ${shipper.name} (${shipper.code}) - ${shipper.company} - ${shipper.total_parcels} parcels - ${shipper.status}`);
    });
    console.log('');
    
    // Parcels
    console.log('📦 PARCELS:');
    const parcels = await db.query(`
      SELECT p.id, p.tracking_number, p.destination, p.status, p.weight, p.price, s.name as shipper_name
      FROM parcels p
      LEFT JOIN shippers s ON p.shipper_id = s.id
      ORDER BY p.id
    `);
    parcels.rows.forEach(parcel => {
      console.log(`  ${parcel.id}. ${parcel.tracking_number} - ${parcel.destination} - ${parcel.status} - ${parcel.weight}kg - ${parcel.price}€ - ${parcel.shipper_name}`);
    });
    console.log('');
    
    // Pickup Missions
    console.log('🚚 PICKUP MISSIONS:');
    const missions = await db.query(`
      SELECT pm.id, pm.mission_number, pm.status, pm.scheduled_date, d.first_name as driver_name, s.name as shipper_name
      FROM pickup_missions pm
      LEFT JOIN users d ON pm.driver_id = d.id
      LEFT JOIN shippers s ON pm.shipper_id = s.id
      ORDER BY pm.id
    `);
    missions.rows.forEach(mission => {
      console.log(`  ${mission.id}. ${mission.mission_number} - ${mission.status} - ${mission.scheduled_date} - Driver: ${mission.driver_name} - Shipper: ${mission.shipper_name}`);
    });
    console.log('');
    
    // Sectors
    console.log('🗺️ SECTORS:');
    const sectors = await db.query('SELECT id, name, city, status FROM sectors ORDER BY id');
    sectors.rows.forEach(sector => {
      console.log(`  ${sector.id}. ${sector.name} - ${sector.city} - ${sector.status}`);
    });
    console.log('');
    
    // Warehouses
    console.log('🏢 WAREHOUSES:');
    const warehouses = await db.query('SELECT id, name, governorate, current_stock, capacity, status FROM warehouses ORDER BY id');
    warehouses.rows.forEach(warehouse => {
      console.log(`  ${warehouse.id}. ${warehouse.name} - ${warehouse.governorate} - Stock: ${warehouse.current_stock}/${warehouse.capacity} - ${warehouse.status}`);
    });
    console.log('');
    
    // Payments
    console.log('💰 PAYMENTS:');
    const payments = await db.query(`
      SELECT p.id, p.amount, p.date, p.payment_method, p.status, s.name as shipper_name
      FROM payments p
      LEFT JOIN shippers s ON p.shipper_id = s.id
      ORDER BY p.id
    `);
    payments.rows.forEach(payment => {
      console.log(`  ${payment.id}. ${payment.amount}€ - ${payment.date} - ${payment.payment_method} - ${payment.status} - ${payment.shipper_name}`);
    });
    console.log('');
    
    // Complaints
    console.log('📝 COMPLAINTS:');
    const complaints = await db.query(`
      SELECT c.id, c.subject, c.date, c.status, s.name as client_name
      FROM complaints c
      LEFT JOIN shippers s ON c.client_id = s.id
      ORDER BY c.id
    `);
    complaints.rows.forEach(complaint => {
      console.log(`  ${complaint.id}. ${complaint.subject} - ${complaint.date} - ${complaint.status} - ${complaint.client_name}`);
    });
    console.log('');
    
    console.log('✅ Database data overview completed!');
    
  } catch (error) {
    console.error('❌ Error showing data:', error);
  } finally {
    process.exit(0);
  }
};

showData(); 