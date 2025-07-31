const db = require('../config/database');

async function debugCommercialShippers() {
  try {
    console.log('🔍 Debugging commercial-shipper relationships...');
    
    // Check commercial with ID 47
    const commercial = await db.query('SELECT * FROM commercials WHERE id = 47');
    console.log('📋 Commercial 47:', commercial.rows[0]);
    
    // Check shippers assigned to commercial 47
    const shippers = await db.query('SELECT * FROM shippers WHERE commercial_id = 47');
    console.log('📦 Shippers for commercial 47:', shippers.rows);
    
    // Check all complaints
    const allComplaints = await db.query('SELECT * FROM complaints LIMIT 10');
    console.log('📝 All complaints (first 10):', allComplaints.rows);
    
    // Check complaints for shippers of commercial 47
    const commercialComplaints = await db.query(`
      SELECT 
        c.*,
        s.name as shipper_name,
        s.commercial_id
      FROM complaints c
      JOIN shippers s ON c.client_id = s.id
      WHERE s.commercial_id = 47
    `);
    console.log('📋 Complaints for commercial 47 shippers:', commercialComplaints.rows);
    
    // Check the exact query that the API uses
    const apiQuery = `
      SELECT 
        c.*,
        s.name as client_name,
        s.email as client_email,
        s.phone as client_phone,
        u.first_name as assigned_to_name,
        u.last_name as assigned_to_last_name
      FROM complaints c
      LEFT JOIN shippers s ON c.client_id = s.id
      LEFT JOIN users u ON c.assigned_to = u.id
      WHERE s.commercial_id = 47
      ORDER BY c.created_at DESC
    `;
    
    const apiResult = await db.query(apiQuery);
    console.log('🔍 API query result for commercial 47:', apiResult.rows);
    
    // Check if there are any complaints at all
    const totalComplaints = await db.query('SELECT COUNT(*) as total FROM complaints');
    console.log('📊 Total complaints in database:', totalComplaints.rows[0].total);
    
    // Check shipper-commercial relationships
    const shipperCommercials = await db.query(`
      SELECT 
        s.id as shipper_id,
        s.name as shipper_name,
        s.commercial_id,
        c.name as commercial_name
      FROM shippers s
      LEFT JOIN commercials c ON s.commercial_id = c.id
      WHERE s.commercial_id IS NOT NULL
    `);
    console.log('🔗 Shipper-Commercial relationships:', shipperCommercials.rows);
    
  } catch (error) {
    console.error('❌ Error debugging:', error);
  } finally {
    process.exit(0);
  }
}

debugCommercialShippers(); 