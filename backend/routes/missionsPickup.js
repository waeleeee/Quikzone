const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Helper: get full mission info with joins
async function getFullMission(row) {
  try {
    console.log('🔍 getFullMission called with row:', row);
    
    // Get driver info from drivers table
    const driverRes = await pool.query('SELECT id, name, email, agency FROM drivers WHERE id = $1', [row.driver_id]);
    console.log('🚚 Driver query result:', driverRes.rows[0]);
    
    const driver = driverRes.rows[0] ? { 
      id: driverRes.rows[0].id, 
      name: driverRes.rows[0].name,
      email: driverRes.rows[0].email
    } : null;
    
    console.log('🚚 Final driver object:', driver);
    
    // Get shipper info
    const shipperRes = await pool.query('SELECT id, name, email, phone, company_address FROM shippers WHERE id = $1', [row.shipper_id]);
    console.log('📦 Shipper query result:', shipperRes.rows[0]);
    
    const shipper = shipperRes.rows[0] ? { 
      id: shipperRes.rows[0].id, 
      name: shipperRes.rows[0].name,
      email: shipperRes.rows[0].email,
      phone: shipperRes.rows[0].phone,
      address: shipperRes.rows[0].company_address
    } : null;
    
    console.log('📦 Final shipper object:', shipper);
    
    // Get parcels for this mission
    const parcelsRes = await pool.query(`
      SELECT p.id, p.tracking_number, p.destination, p.status
      FROM parcels p 
      INNER JOIN mission_parcels mp ON p.id = mp.parcel_id 
      WHERE mp.mission_id = $1
    `, [row.id]);
    
    console.log('📦 Parcels query result:', parcelsRes.rows);
    
    // Map database status codes to French display names
    const parcelStatusMapping = {
      'en_attente': 'En attente',
      'au_depot': 'Au dépôt',      // Default mapping
      'en_cours': 'En cours',      // Default mapping
      'rtn_depot': 'RTN dépot',
      'lives': 'Livrés',
      'lives_payes': 'Livrés payés',
      'retour_definitif': 'Retour définitif',
      'rtn_client_agence': 'RTN client agence',
      'retour_expediteur': 'Retour Expéditeur',
      'retour_en_cours_expedition': 'Retour En Cours d\'expédition',
      'retour_recu': 'Retour reçu'
    };
    
    // No special mapping needed since we're using French statuses directly
    const getParcelStatusDisplay = (dbStatus, missionStatus) => {
      // Use the status directly since we're now using French statuses
      return dbStatus || 'En attente';
    };

    const parcels = parcelsRes.rows.map(p => ({
      id: p.id,
      tracking_number: p.tracking_number,
      destination: p.destination,
      status: getParcelStatusDisplay(p.status, row.status)
    }));
    
    console.log('📦 Final parcels array:', parcels);
    
    // No mapping needed since we're using French statuses directly
    const displayStatus = row.status || 'En attente';
    console.log(`📋 Mission status mapping: ${row.status} -> ${displayStatus}`);
    
    // Get creator info (using a default for now since we don't have role-based users)
    const createdBy = {
      id: row.created_by || 1,
      name: 'Admin QuickZone',
      email: 'admin@quickzone.tn',
      role: 'Administration'
    };
    
    return {
      id: row.id,
      mission_number: row.mission_number,
      driver,
      shipper,
      parcels,
      scheduled_time: row.scheduled_date,
      status: displayStatus,
      created_by: createdBy,
      created_at: row.created_at,
      updated_at: row.updated_at,
      security_code: row.security_code
    };
  } catch (error) {
    console.error('Error in getFullMission:', error);
    // No mapping needed since we're using French statuses directly
    const displayStatus = row.status || 'En attente';
    
    return {
      id: row.id,
      mission_number: row.mission_number,
      driver: null,
      shipper: null,
      parcels: [],
      scheduled_time: row.scheduled_date,
      status: displayStatus,
      created_by: {
        id: 1,
        name: 'Admin QuickZone',
        email: 'admin@quickzone.tn',
        role: 'Administration'
      },
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }
}

// GET all missions
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('GET /missions-pickup called');
    const { driver_email } = req.query;
    
    let query = 'SELECT pm.* FROM pickup_missions pm';
    const queryParams = [];
    
    // If driver_email is provided, filter by driver
    if (driver_email) {
      query += `
        JOIN drivers d ON pm.driver_id = d.id
        WHERE d.email = $1
      `;
      queryParams.push(driver_email);
    }
    
    query += ' ORDER BY pm.scheduled_date DESC';
    
    console.log('🔍 Final query:', query);
    console.log('🔍 Query params:', queryParams);
    
    const result = await pool.query(query, queryParams);
    console.log('Query result:', result.rows.length, 'missions');
    console.log('🔍 First row from query:', result.rows[0]);
    
    const missions = await Promise.all(result.rows.map(row => {
      console.log('🔍 Processing row in map:', row);
      return getFullMission(row);
    }));
    res.json({ success: true, data: missions });
  } catch (err) {
    console.error('GET pickup_missions error:', err);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des missions' });
  }
});

// POST create mission
router.post('/', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    console.log('🔍 POST /missions-pickup called');
    console.log('🔍 Request body:', req.body);
    console.log('🔍 Request headers:', req.headers);
    console.log('🔍 User:', req.user);
    
    const { livreur_id, demand_ids, notes } = req.body;
    
    console.log('🔍 Extracted data:', { livreur_id, demand_ids, notes });
    console.log('🔍 livreur_id type:', typeof livreur_id, 'value:', livreur_id);
    console.log('🔍 demand_ids type:', typeof demand_ids, 'value:', demand_ids);
    console.log('🔍 notes type:', typeof notes, 'value:', notes);
    
    // Validate required fields
    if (!livreur_id || !demand_ids || demand_ids.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    await client.query('BEGIN');
    
    // Get livreur details from drivers table
    const livreurSqlQuery = 'SELECT id, name, email, agency FROM drivers WHERE id = $1';
    const livreurResult = await client.query(livreurSqlQuery, [livreur_id]);
    
    console.log('🔍 Livreur query result:', livreurResult.rows);
    
    if (livreurResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Livreur not found' });
    }
    
    const livreur = livreurResult.rows[0];
    
    // Check if demands are available (status "Accepted")
    const demandCheckSqlQuery = `
      SELECT id, status, expediteur_agency
      FROM demands 
      WHERE id = ANY($1)
    `;
    
    const demandCheckResult = await client.query(demandCheckSqlQuery, [demand_ids]);
    
    const unavailableDemands = demandCheckResult.rows.filter(d => d.status !== 'Accepted');
    
    if (unavailableDemands.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: 'Some demands are not available',
        unavailableDemands: unavailableDemands.map(d => ({
          id: d.id,
          status: d.status
        }))
      });
    }
    
    // Check if demands are already in another mission
    const missionCheckSqlQuery = `
      SELECT md.demand_id, pm.mission_number
      FROM mission_demands md
      INNER JOIN pickup_missions pm ON md.mission_id = pm.id
      WHERE md.demand_id = ANY($1) AND pm.status IN ('En attente', 'Acceptée', 'En cours')
    `;
    
    const missionCheckResult = await client.query(missionCheckSqlQuery, [demand_ids]);
    
    if (missionCheckResult.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: 'Some demands are already assigned to another mission',
        assignedDemands: missionCheckResult.rows.map(d => ({
          demand_id: d.demand_id,
          mission_number: d.mission_number
        }))
      });
    }
    
    // Generate unique mission code
    const missionNumber = `PIK${Date.now()}`;
    
    // Generate unique security code - Updated for new mission creation - Fixed column names - Fixed governorate - Added debugging - Fixed users table queries
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
let securityCode = '';
for (let i = 0; i < 6; i++) {
  securityCode += chars.charAt(Math.floor(Math.random() * chars.length));
}
    
    // Get the first shipper from the selected demands for shipper_id
    const firstDemand = demandCheckResult.rows[0];
    const shipperSqlQuery = `
      SELECT s.id as shipper_id
      FROM shippers s
      INNER JOIN parcels p ON s.id = p.shipper_id
      INNER JOIN demand_parcels dp ON p.id = dp.parcel_id
      WHERE dp.demand_id = $1
      LIMIT 1
    `;
    const shipperResult = await client.query(shipperSqlQuery, [firstDemand.id]);
    const shipperId = shipperResult.rows[0]?.shipper_id || 1; // Default to 1 if not found
    
    console.log('🔍 Creating mission with data:', {
      missionNumber,
      securityCode,
      livreur_id,
      shipperId,
      scheduled_date: new Date(),
      created_by: req.user.id
    });
    
    // Create mission
    const createMissionSqlQuery = `
      INSERT INTO pickup_missions (
        mission_number, driver_id, shipper_id, scheduled_date, 
        created_by, status, security_code
      )
      VALUES ($1, $2, $3, $4, $5, 'En attente', $6)
      RETURNING id
    `;
    
    console.log('🔍 SQL Query:', createMissionSqlQuery);
    console.log('🔍 SQL Parameters:', [missionNumber, livreur_id, shipperId, new Date(), req.user.id, securityCode]);
    
    const missionResult = await client.query(createMissionSqlQuery, [
      missionNumber,
      livreur_id,
      shipperId,
      new Date(), // scheduled_date
      req.user.id, // created_by - use actual user ID
      securityCode
    ]);
    
    const missionId = missionResult.rows[0].id;
    
    // Add demands to mission
    for (const demandId of demand_ids) {
      await client.query(
        'INSERT INTO mission_demands (mission_id, demand_id) VALUES ($1, $2)',
        [missionId, demandId]
      );
    }
    
    // Add parcels to mission
    const parcelsSqlQuery = `
      SELECT dp.parcel_id, dp.demand_id
      FROM demand_parcels dp
      WHERE dp.demand_id = ANY($1)
    `;
    
    const parcelsResult = await client.query(parcelsSqlQuery, [demand_ids]);
    console.log('🔍 Parcels found for demands:', parcelsResult.rows);
    
    for (const parcel of parcelsResult.rows) {
      console.log('🔍 Inserting parcel:', { missionId, parcel_id: parcel.parcel_id });
      await client.query(
        'INSERT INTO mission_parcels (mission_id, parcel_id) VALUES ($1, $2)',
        [missionId, parcel.parcel_id]
      );
    }
    console.log('🔍 Inserted', parcelsResult.rows.length, 'parcels into mission');
    
    await client.query('COMMIT');
    
    // Get the created mission with full details
    const createdMissionSqlQuery = `
      SELECT 
        pm.*,
        COALESCE(COUNT(DISTINCT md.demand_id), 0) as demand_count,
        COALESCE(COUNT(DISTINCT mp.parcel_id), 0) as parcel_count,
        d.name as driver_name,
        s.name as shipper_name
      FROM pickup_missions pm
      LEFT JOIN mission_demands md ON pm.id = md.mission_id
      LEFT JOIN mission_parcels mp ON pm.id = mp.mission_id
      LEFT JOIN drivers d ON pm.driver_id = d.id
      LEFT JOIN shippers s ON pm.shipper_id = s.id
      WHERE pm.id = $1
      GROUP BY pm.id, d.name, s.name
    `;
    
    const createdMissionResult = await client.query(createdMissionSqlQuery, [missionId]);
    const createdMission = createdMissionResult.rows[0];
    
    console.log('🔍 Final created mission:', createdMission);
    console.log('🔍 Mission has security_code:', createdMission.security_code);
    console.log('🔍 Mission has parcel_count:', createdMission.parcel_count);
    
    res.status(201).json({ 
      message: 'Pickup mission created successfully',
      data: createdMission
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating pickup mission:', error);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint,
      constraint: error.constraint,
      table: error.table,
      column: error.column
    });
    
    // Send more detailed error response
    let errorResponse = {
      error: 'Internal server error',
      details: error.message
    };
    
    if (error.code === '23502') {
      errorResponse.error = 'Database constraint violation';
      errorResponse.details = `Missing required field: ${error.column}`;
    } else if (error.code === '23503') {
      errorResponse.error = 'Foreign key violation';
      errorResponse.details = `Referenced record not found: ${error.detail}`;
    } else if (error.code === '23505') {
      errorResponse.error = 'Unique constraint violation';
      errorResponse.details = `Duplicate value: ${error.detail}`;
    }
    
    res.status(500).json(errorResponse);
  } finally {
    client.release();
  }
});

// Generate security code for mission completion
function generateMissionCode(missionNumber, driverId, date) {
  // Create a code based on mission number, driver ID, and date
  const dateStr = new Date(date).toISOString().slice(0, 10).replace(/-/g, '');
  const code = `${missionNumber.slice(-4)}${driverId}${dateStr.slice(-4)}`;
  return code.toUpperCase();
}

// GET mission by ID with details
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get mission details
    const missionDetailsSqlQuery = `
      SELECT pm.*, d.phone as livreur_phone, d.email as livreur_email, d.name as driver_name
      FROM pickup_missions pm
      LEFT JOIN drivers d ON pm.driver_id = d.id
      WHERE pm.id = $1
    `;
    
    const missionResult = await pool.query(missionDetailsSqlQuery, [id]);
    
    if (missionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Mission not found' });
    }
    
    const mission = missionResult.rows[0];
    
    // Get demands in this mission
    const demandsSqlQuery = `
      SELECT 
        d.*,
        COALESCE(COUNT(dp.parcel_id), 0) as parcel_count
      FROM demands d
      INNER JOIN mission_demands md ON d.id = md.demand_id
      LEFT JOIN demand_parcels dp ON d.id = dp.demand_id
      WHERE md.mission_id = $1
      GROUP BY d.id
      ORDER BY d.id ASC
    `;
    
    const demandsResult = await pool.query(demandsSqlQuery, [id]);
    
    // Get parcels in this mission
    const parcelsSqlQuery = `
      SELECT 
        mp.*,
        p.tracking_number,
        p.destination,
        p.status as parcel_status,
        s.name as shipper_name,
        s.phone as shipper_phone,
        s.agency as shipper_agency
      FROM mission_parcels mp
      LEFT JOIN parcels p ON mp.parcel_id = p.id
      LEFT JOIN shippers s ON p.shipper_id = s.id
      WHERE mp.mission_id = $1
      ORDER BY mp.mission_id ASC
    `;
    
    const parcelsResult = await pool.query(parcelsSqlQuery, [id]);
    
    const fullMission = await getFullMission(mission);
    res.json({
      ...fullMission,
      demands: demandsResult.rows,
      parcels: parcelsResult.rows
    });
    
  } catch (error) {
    console.error('Error fetching mission:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT scan parcel in pickup mission
router.put('/:id/scan-parcel', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const { tracking_number } = req.body;
    
    console.log('📱 scanParcel called with missionId:', id, 'trackingNumber:', tracking_number);
    
    // Check if user has permission to scan parcels
    if (!['Admin', 'Administration', 'Chef d\'agence', 'Membre de l\'agence'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    await client.query('BEGIN');
    
    // Find the parcel in the mission
    const parcelSqlQuery = `
      SELECT mp.parcel_id, p.tracking_number, p.status
      FROM mission_parcels mp
      INNER JOIN parcels p ON mp.parcel_id = p.id
      WHERE mp.mission_id = $1 AND (p.tracking_number = $2 OR p.id::text = $2)
    `;
    
    const parcelResult = await client.query(parcelSqlQuery, [id, tracking_number]);
    
    if (parcelResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Parcel not found in this mission' });
    }
    
    const parcel = parcelResult.rows[0];
    
    // Update parcel status to "Au dépôt"
    await client.query(
      'UPDATE parcels SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['Au dépôt', parcel.parcel_id]
    );
    
    // Update mission_parcels status
    await client.query(
      'UPDATE mission_parcels SET status = $1 WHERE mission_id = $2 AND parcel_id = $3',
      ['Au dépôt', id, parcel.parcel_id]
    );
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      message: 'Parcel scanned successfully',
      parcel: {
        id: parcel.parcel_id,
        tracking_number: parcel.tracking_number,
        status: 'Au dépôt'
      }
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error scanning parcel:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// GET mission security code
router.get('/:id/security-code', authenticateToken, async (req, res) => {
  try {
    console.log('🔐 GET /missions-pickup/:id/security-code called');
    
    const result = await pool.query('SELECT security_code, mission_number, status FROM pickup_missions WHERE id = $1', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Mission non trouvée' });
    }
    
    const mission = result.rows[0];
    
    console.log('🔐 Retrieved security code:', mission.security_code);
    res.json({ 
      success: true, 
      data: { 
        security_code: mission.security_code,
        mission_number: mission.mission_number,
        status: mission.status
      } 
    });
  } catch (err) {
    console.error('GET security code error:', err);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération du code de sécurité' });
  }
});

// PUT update mission
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    console.log('🔄 PUT /missions-pickup/:id called with body:', req.body);
    const { driver_id, shipper_id, colis_ids, scheduled_time, parcels, securityCode } = req.body;
    let { status } = req.body; // Use let instead of const to allow reassignment
    
    // If trying to complete mission, verify security code
    if (status === 'Au dépôt') {
      console.log('🔐 Mission completion requested, verifying security code...');
      
      if (!securityCode) {
        return res.status(400).json({ success: false, message: 'Code de sécurité requis pour terminer la mission' });
      }
      
      // Get mission data to generate expected code
      const missionResult = await pool.query('SELECT mission_number, driver_id, scheduled_date FROM pickup_missions WHERE id = $1', [req.params.id]);
      
      if (missionResult.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Mission non trouvée' });
      }
      
      const mission = missionResult.rows[0];
      const expectedCode = generateMissionCode(mission.mission_number, mission.driver_id, mission.scheduled_date);
      
      console.log('🔐 Expected code:', expectedCode, 'Provided code:', securityCode);
      
      if (securityCode.toUpperCase() !== expectedCode) {
        return res.status(403).json({ success: false, message: 'Code de sécurité incorrect' });
      }
      
      console.log('✅ Security code verified successfully');
      
      // Change status to "Au dépôt" after successful security code verification
      status = 'Au dépôt';
      console.log('🔄 Status changed to "Au dépôt" after security code verification');
    }
    
    // If only status is being updated (simple case for livreur accept/refuse/start/complete)
    if (req.body.status) {
      console.log('📋 Simple status update:', req.body.status);
      console.log('📋 Request body:', req.body);
      console.log('📋 Status type:', typeof req.body.status);
      console.log('📋 Mission ID:', req.params.id);
      
      // Start transaction to update both mission and parcels
      const client = await pool.connect();
      console.log('🔗 Database client connected successfully');
      try {
        await client.query('BEGIN');
        console.log('🔄 Transaction started');
        
        // Update mission status - use the updated status if security code was verified
        const finalStatus = status || req.body.status;
        const updateQ = `UPDATE pickup_missions SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`;
        console.log('🔍 Update query:', updateQ);
        console.log('🔍 Update values:', [finalStatus, req.params.id]);
        
        const result = await client.query(updateQ, [finalStatus, req.params.id]);
        console.log('🔍 Update result:', result.rows[0]);
        
        if (result.rows.length === 0) {
          console.log('❌ Mission not found in database');
          await client.query('ROLLBACK');
          return res.status(404).json({ success: false, message: 'Mission non trouvée' });
        }
        
        // Map mission status to parcel status using French status names directly
        let parcelStatus;
        switch (finalStatus) {
          case 'En attente': // Initial status when pickup is created
            parcelStatus = 'En attente';
            break;
          case 'À enlever': // When driver accepts the mission
            parcelStatus = 'À enlever';
            break;
          case 'Enlevé': // When driver scans parcel codes
            parcelStatus = 'Enlevé';
            break;
          case 'Au dépôt': // When driver completes with security code
            parcelStatus = 'Au dépôt';
            break;
          case 'Mission terminée': // Final status
            parcelStatus = 'Au dépôt'; // Same as "Au dépôt"
            break;
          default:
            parcelStatus = null;
        }
        
        // Update parcels status if we have a mapping
        if (parcelStatus) {
          console.log(`📦 Updating parcels status to: ${parcelStatus}`);
          console.log(`📦 Mission status: ${finalStatus} -> Parcel status: ${parcelStatus}`);
          
          // Get all parcels for this mission
          const parcelsResult = await client.query(`
            SELECT parcel_id FROM mission_parcels WHERE mission_id = $1
          `, [req.params.id]);
          
          console.log(`📦 Found ${parcelsResult.rows.length} parcels to update`);
          console.log(`📦 Parcel IDs:`, parcelsResult.rows.map(row => row.parcel_id));
          
                      // Update each parcel's status
            for (const row of parcelsResult.rows) {
              console.log(`📦 Updating parcel ${row.parcel_id} to status: ${parcelStatus}`);
              
              // Get current parcel status before updating
              const currentParcelResult = await client.query(
                'SELECT status FROM parcels WHERE id = $1',
                [row.parcel_id]
              );
              const previousStatus = currentParcelResult.rows[0]?.status;
              
              // Update parcels table
              const parcelUpdateResult = await client.query(
                'UPDATE parcels SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id, status',
                [parcelStatus, row.parcel_id]
              );
              
              console.log(`📦 Parcel update result:`, parcelUpdateResult.rows[0]);
              
              // Log status change in tracking history
              await client.query(
                `INSERT INTO parcel_tracking_history 
                (parcel_id, status, previous_status, mission_id, updated_by, notes, created_at) 
                VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
                [
                  row.parcel_id,
                  parcelStatus,
                  previousStatus,
                  req.params.id,
                  1, // Default user ID for now
                  `Status updated via mission ${req.params.id}`
                ]
              );
              
              console.log(`📦 Status change logged in tracking history: ${previousStatus} → ${parcelStatus}`);
              
              // Also update mission_parcels status
              const missionParcelUpdateResult = await client.query(
                'UPDATE mission_parcels SET status = $1 WHERE mission_id = $2 AND parcel_id = $3 RETURNING parcel_id, status',
                [parcelStatus, req.params.id, row.parcel_id]
              );
              
              console.log(`📦 Mission parcel update result:`, missionParcelUpdateResult.rows[0]);
            }
          
          console.log(`✅ Updated ${parcelsResult.rows.length} parcels to status: ${parcelStatus}`);
        } else {
          console.log(`⚠️ No parcel status mapping for mission status: ${finalStatus}`);
          console.log(`⚠️ Available mappings: Accepté par livreur -> au_depot, En cours de ramassage -> en_cours, Au dépôt -> au_depot`);
        }
        
        await client.query('COMMIT');
        
        const mission = await getFullMission(result.rows[0]);
        console.log('✅ Mission and parcels status updated successfully:', mission);
        return res.json({ success: true, data: mission });
        
      } catch (error) {
        console.error('❌ Transaction error:', error);
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    }
    
    // Build dynamic update query based on what's provided
    let updateFields = [];
    let values = [];
    let paramIndex = 1;
    
    if (driver_id !== undefined) {
      updateFields.push(`driver_id = $${paramIndex++}`);
      values.push(driver_id);
    }
    
    if (shipper_id !== undefined) {
      updateFields.push(`shipper_id = $${paramIndex++}`);
      values.push(shipper_id);
    }
    
    if (scheduled_time !== undefined) {
      updateFields.push(`scheduled_date = $${paramIndex++}`);
      values.push(scheduled_time);
    }
    
    if (status !== undefined) {
      updateFields.push(`status = $${paramIndex++}`);
      values.push(status);
    }
    
    // Always update the updated_at timestamp
    updateFields.push(`updated_at = NOW()`);
    
    // Add the mission ID as the last parameter
    values.push(req.params.id);
    
    const updateQ = `UPDATE pickup_missions SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    console.log('🔍 Update query:', updateQ);
    console.log('🔍 Update values:', values);
    
    const result = await pool.query(updateQ, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Mission non trouvée' });
    }
    
    // Handle parcel updates if provided
    if (parcels && Array.isArray(parcels)) {
      console.log('📦 Updating parcels:', parcels);
      
      // Update each parcel's status in the mission_parcels table
      for (const parcel of parcels) {
        await pool.query(
          'UPDATE mission_parcels SET status = $1 WHERE mission_id = $2 AND parcel_id = $3',
          [parcel.status, req.params.id, parcel.id]
        );
        
        // Also update the parcel's status in the parcels table
        await pool.query(
          'UPDATE parcels SET status = $1 WHERE id = $2',
          [parcel.status, parcel.id]
        );
      }
    } else if (colis_ids) {
      // Handle colis_ids if parcels array is not provided (backward compatibility)
      console.log('📦 Updating colis_ids:', colis_ids);
      
      // Remove existing assignments
      await pool.query('DELETE FROM mission_parcels WHERE mission_id = $1', [req.params.id]);
      
      // Add new assignments
      if (colis_ids.length > 0) {
        for (const parcelId of colis_ids) {
          await pool.query('INSERT INTO mission_parcels (mission_id, parcel_id, status) VALUES ($1, $2, $3)', [req.params.id, parcelId, 'pending']);
        }
      }
    }
    
    const mission = await getFullMission(result.rows[0]);
    console.log('✅ Mission updated successfully:', mission);
    res.json({ success: true, data: mission });
  } catch (err) {
    console.error('❌ PUT pickup_missions error:', err);
    res.status(500).json({ success: false, message: 'Erreur lors de la modification de la mission' });
  }
});

// DELETE mission
router.delete('/:id', async (req, res) => {
  try {
    // First delete related mission_parcels
    await pool.query('DELETE FROM mission_parcels WHERE mission_id = $1', [req.params.id]);
    
    // Then delete the mission
    const delQ = `DELETE FROM pickup_missions WHERE id=$1 RETURNING *`;
    const result = await pool.query(delQ, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Mission non trouvée' });
    }
    
    res.json({ success: true, message: 'Mission supprimée' });
  } catch (err) {
    console.error('DELETE pickup_missions error:', err);
    res.status(500).json({ success: false, message: 'Erreur lors de la suppression de la mission' });
  }
});

// Get accepted demands (available for mission assignment)
router.get('/accepted-demands', authenticateToken, async (req, res) => {
  try {
    let demandsSqlQuery = `
      SELECT 
        d.*,
        COALESCE(COUNT(dp.parcel_id), 0) as parcel_count,
        CASE WHEN md.mission_id IS NOT NULL THEN true ELSE false END as in_mission
      FROM demands d
      LEFT JOIN demand_parcels dp ON d.id = dp.demand_id
      LEFT JOIN mission_demands md ON d.id = md.demand_id
                           LEFT JOIN pickup_missions pm ON md.mission_id = pm.id AND pm.status IN ('En attente', 'Acceptée', 'En cours')
      WHERE d.status = 'Accepted'
    `;
    const queryParams = [];
    
    demandsSqlQuery += ` GROUP BY d.id, md.mission_id
                        HAVING md.mission_id IS NULL
                        ORDER BY d.created_at DESC`;
    
    const result = await pool.query(demandsSqlQuery, queryParams);
    
    res.json(result.rows);
    
  } catch (error) {
    console.error('Error fetching accepted demands:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get available livreurs (filtered by user role and agency)
router.get('/available-livreurs', authenticateToken, async (req, res) => {
  try {
    let livreursSqlQuery = `
      SELECT id, CONCAT(first_name, ' ', last_name) as name, phone, email
      FROM users 
      WHERE is_active = true
    `;
    const queryParams = [];
    
    livreursSqlQuery += ` ORDER BY name ASC`;
    
    const result = await pool.query(livreursSqlQuery, queryParams);
    
    res.json(result.rows);
    
  } catch (error) {
    console.error('Error fetching available livreurs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;