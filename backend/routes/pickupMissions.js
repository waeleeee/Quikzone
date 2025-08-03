const express = require('express');
const router = express.Router();
const { query, pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Generate unique mission code - Updated for users table
function generateMissionCode() {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `M-${timestamp}-${random}`;
}

// Generate unique security code for missions - Updated for security code generation
function generateSecurityCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Get all pickup missions (with filtering for different user roles)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status = '', agency = '' } = req.query;
    const offset = (page - 1) * limit;
    
                   let missionsSqlQuery = `
        SELECT 
          pm.*,
          COALESCE(COUNT(DISTINCT md.demand_id), 0) as demand_count,
          COALESCE(COUNT(DISTINCT mp.parcel_id), 0) as parcel_count,
          u.firstName || ' ' || u.lastName as driver_name,
          s.name as shipper_name
                FROM pickup_missions pm
         LEFT JOIN mission_demands md ON pm.id = md.mission_id
         LEFT JOIN mission_parcels mp ON pm.id = mp.mission_id
         LEFT JOIN users u ON pm.driver_id = u.id
         LEFT JOIN shippers s ON pm.shipper_id = s.id
         WHERE 1=1
      `;
    const queryParams = [];
    
    // Filter by status
    if (status) {
      missionsSqlQuery += ` AND pm.status = $${queryParams.length + 1}`;
      queryParams.push(status);
    }
    
         // Note: Agency filtering removed as current table doesn't have livreur_agency column
     // TODO: Add agency filtering when table structure is updated
    
         missionsSqlQuery += ` GROUP BY pm.id, u.firstName, u.lastName, s.name
                          ORDER BY pm.created_at DESC 
                          LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit, offset);
    
    console.log('🔍 DEBUG - Missions SQL Query:', missionsSqlQuery);
    console.log('🔍 DEBUG - Query Params:', queryParams);
    
    const result = await query(missionsSqlQuery, queryParams);
    console.log('🔍 DEBUG - Missions Query Result:', result);
    
         // Get total count for pagination
           let countSqlQuery = `
        SELECT COUNT(DISTINCT pm.id) 
        FROM pickup_missions pm
        WHERE 1=1
      `;
    const countParams = [];
    
    if (status) {
      countSqlQuery += ` AND pm.status = $${countParams.length + 1}`;
      countParams.push(status);
    }
    
         // Note: Agency filtering removed for count query as well
    
    console.log('🔍 DEBUG - Count SQL Query:', countSqlQuery);
    console.log('🔍 DEBUG - Count Params:', countParams);
    
    const countResult = await query(countSqlQuery, countParams);
    console.log('🔍 DEBUG - Count Query Result:', countResult);
    
    const total = parseInt(countResult.rows[0].count);
    
    const response = {
      missions: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
    
    console.log('🔍 DEBUG - Final Response:', response);
    res.json(response);
    
  } catch (error) {
    console.error('❌ Error fetching pickup missions:', error);
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint
    });
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Get mission by ID with details
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
             // Get mission details
    const missionDetailsSqlQuery = `
      SELECT pm.*, u.phone as livreur_phone, u.email as livreur_email
      FROM pickup_missions pm
      LEFT JOIN users u ON pm.driver_id = u.id AND u.role = 'Livreurs'
      WHERE pm.id = $1
    `;
    
    const missionResult = await query(missionDetailsSqlQuery, [id]);
    
    if (missionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Mission not found' });
    }
    
    const mission = missionResult.rows[0];
    
    // Get demands in this mission
    const demandsSqlQuery = `
      SELECT 
        d.*,
        md.added_at as added_to_mission_at,
        COALESCE(COUNT(dp.parcel_id), 0) as parcel_count
      FROM demands d
      INNER JOIN mission_demands md ON d.id = md.demand_id
      LEFT JOIN demand_parcels dp ON d.id = dp.demand_id
      WHERE md.mission_id = $1
      GROUP BY d.id, md.added_at
      ORDER BY md.added_at ASC
    `;
    
    const demandsResult = await query(demandsSqlQuery, [id]);
    
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
      ORDER BY mp.added_at ASC
    `;
    
    const parcelsResult = await query(parcelsSqlQuery, [id]);
    
    res.json({
      ...mission,
      demands: demandsResult.rows,
      parcels: parcelsResult.rows
    });
    
  } catch (error) {
    console.error('Error fetching mission:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new pickup mission
router.post('/', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { livreur_id, demand_ids, notes } = req.body;
    
    // Validate required fields
    if (!livreur_id || !demand_ids || demand_ids.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Check if user has permission to create missions
    if (!['Admin', 'Administration', 'Chef d\'agence', 'Membre d\'agence'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    await client.query('BEGIN');
    
         // Get livreur details from users table
     const livreurSqlQuery = 'SELECT id, CONCAT(firstName, \' \', lastName) as name, governorate as agency FROM users WHERE id = $1 AND role = \'Livreurs\'';
    const livreurResult = await client.query(livreurSqlQuery, [livreur_id]);
    
    console.log('🔍 Livreur query result:', livreurResult.rows);
    
    if (livreurResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Livreur not found' });
    }
    
    const livreur = livreurResult.rows[0];
    
         // Note: Agency permission check removed as current table doesn't have agency columns
     // TODO: Add agency permission check when table structure is updated
    
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
      let missionCode;
      let isUnique = false;
      while (!isUnique) {
        missionCode = generateMissionCode();
                const codeCheckResult = await client.query(
           'SELECT id FROM pickup_missions WHERE mission_number = $1',
           [missionCode]
         );
        isUnique = codeCheckResult.rows.length === 0;
      }
      
      // Generate unique security code
      let securityCode;
      let isSecurityCodeUnique = false;
      while (!isSecurityCodeUnique) {
        securityCode = generateSecurityCode();
        const securityCodeCheckResult = await client.query(
          'SELECT id FROM pickup_missions WHERE security_code = $1',
          [securityCode]
        );
        isSecurityCodeUnique = securityCodeCheckResult.rows.length === 0;
      }
    
               // Create mission
      const createMissionSqlQuery = `
        INSERT INTO pickup_missions (
          mission_number, driver_id, shipper_id, scheduled_date, 
          created_by, status, security_code
        )
        VALUES ($1, $2, $3, $4, $5, 'En attente', $6)
        RETURNING id
      `;
    
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
        missionCode,
        securityCode,
        livreur_id,
        shipperId,
        scheduled_date: new Date(),
        created_by: req.user.id
      });
      
      const missionResult = await client.query(createMissionSqlQuery, [
        missionCode,
        livreur_id,
        shipperId,
        new Date(), // scheduled_date
        req.user.id,
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
    
    for (const parcel of parcelsResult.rows) {
      await client.query(
        'INSERT INTO mission_parcels (mission_id, parcel_id, demand_id) VALUES ($1, $2, $3)',
        [missionId, parcel.parcel_id, parcel.demand_id]
      );
    }
    
               // Note: total_parcels column doesn't exist in current table structure
      // We'll calculate it in the query instead
    
    await client.query('COMMIT');
    
    // Get the created mission with full details
    const createdMissionSqlQuery = `
      SELECT 
        pm.*,
        COALESCE(COUNT(DISTINCT md.demand_id), 0) as demand_count,
        COALESCE(COUNT(DISTINCT mp.parcel_id), 0) as parcel_count,
        u.firstName || ' ' || u.lastName as driver_name,
        s.name as shipper_name
      FROM pickup_missions pm
      LEFT JOIN mission_demands md ON pm.id = md.mission_id
      LEFT JOIN mission_parcels mp ON pm.id = mp.mission_id
      LEFT JOIN users u ON pm.driver_id = u.id
      LEFT JOIN shippers s ON pm.shipper_id = s.id
      WHERE pm.id = $1
      GROUP BY pm.id, u.firstName, u.lastName, s.name
    `;
    
    const createdMissionResult = await client.query(createdMissionSqlQuery, [missionId]);
    const createdMission = createdMissionResult.rows[0];
    
    res.status(201).json({ 
      message: 'Pickup mission created successfully',
      data: createdMission
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating pickup mission:', error);
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint
    });
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  } finally {
    client.release();
  }
});

// Update mission status
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
         // Validate status
     const validStatuses = ['En attente', 'Acceptée', 'Refusée', 'En cours', 'Terminée', 'Annulée'];
     if (!validStatuses.includes(status)) {
       return res.status(400).json({ error: 'Invalid status' });
     }
    
               const updateStatusSqlQuery = `
        UPDATE pickup_missions 
        SET status = $1, notes = $2, updated_at = CURRENT_TIMESTAMP
        ${status === 'Acceptée' ? ', accepted_at = CURRENT_TIMESTAMP' : ''}
        ${status === 'Terminée' ? ', completed_at = CURRENT_TIMESTAMP' : ''}
        WHERE id = $3
        RETURNING *
      `;
    
    const result = await query(updateStatusSqlQuery, [status, notes, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Mission not found' });
    }
    
    res.json({ 
      message: 'Mission status updated successfully',
      mission: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error updating mission status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get available livreurs (filtered by user role and agency)
router.get('/available-livreurs', authenticateToken, async (req, res) => {
  try {
    let livreursSqlQuery = `
      SELECT id, CONCAT(firstName, ' ', lastName) as name, phone, email, governorate as agency
      FROM users 
      WHERE role = 'Livreurs' AND status = 'Active'
    `;
    const queryParams = [];
    
         // Note: Agency filtering removed as current table doesn't have agency column
     // TODO: Add agency filtering when table structure is updated
    
    livreursSqlQuery += ` ORDER BY name ASC`;
    
    const result = await query(livreursSqlQuery, queryParams);
    
    res.json(result.rows);
    
  } catch (error) {
    console.error('Error fetching available livreurs:', error);
    res.status(500).json({ error: 'Internal server error' });
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
    
         // Note: Agency filtering removed as current table doesn't have expediteur_agency column
     // TODO: Add agency filtering when table structure is updated
    
    demandsSqlQuery += ` GROUP BY d.id, md.mission_id
                        HAVING md.mission_id IS NULL
                        ORDER BY d.created_at DESC`;
    
    const result = await query(demandsSqlQuery, queryParams);
    
    res.json(result.rows);
    
  } catch (error) {
    console.error('Error fetching accepted demands:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get mission security code (only for admin, chef d'agence, membre d'agence)
router.get('/:id/security-code', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user has permission to view security code
    const allowedRoles = ['admin', 'chefdagace', 'membre dagence'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Only admin, chef d\'agence, and membre d\'agence can view security codes.' });
    }
    
    const securityCodeSqlQuery = `
      SELECT security_code, mission_number, status
      FROM pickup_missions 
      WHERE id = $1
    `;
    
    const result = await query(securityCodeSqlQuery, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Mission not found' });
    }
    
    const mission = result.rows[0];
    
    res.json({ 
      mission_number: mission.mission_number,
      security_code: mission.security_code,
      status: mission.status
    });
    
  } catch (error) {
    console.error('Error fetching mission security code:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 