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

// Get all pickup missions (with role-based visibility rules)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status = '' } = req.query;
    const offset = (page - 1) * limit;
    
    console.log('🔍 PICKUP MISSIONS - Role-based filtering:');
    console.log('🔍 User Role:', req.user.role);
    console.log('🔍 User Email:', req.user.email);
    
    // Get user's agency if they are Chef d'agence
    let userAgency = null;
    if (req.user.role === 'Chef d\'agence') {
      try {
        const agencyResult = await query(`
          SELECT agency, governorate 
          FROM agency_managers 
          WHERE email = $1
        `, [req.user.email]);
        
        if (agencyResult.rows.length > 0) {
          userAgency = agencyResult.rows[0].agency;
          console.log('🔍 Chef d\'agence agency:', userAgency);
        } else {
          console.log('⚠️ No agency found for Chef d\'agence:', req.user.email);
          return res.status(403).json({ 
            error: 'Agency not found for Chef d\'agence user',
            details: 'Please contact administrator to assign agency'
          });
        }
      } catch (error) {
        console.error('❌ Error fetching user agency:', error);
        return res.status(500).json({ 
          error: 'Error fetching user agency',
          details: error.message 
        });
      }
    }
    
    // Build the main query with role-based filtering
    let missionsSqlQuery = `
      SELECT 
        pm.*,
        COALESCE(COUNT(DISTINCT md.demand_id), 0) as demand_count,
        COALESCE(COUNT(DISTINCT mp.parcel_id), 0) as parcel_count,
        d.name as driver_name,
        d.agency as driver_agency,
        d.governorate as driver_governorate,
        s.name as shipper_name,
        s.agency as shipper_agency
      FROM pickup_missions pm
      LEFT JOIN drivers d ON pm.driver_id = d.id
      LEFT JOIN shippers s ON pm.shipper_id = s.id
      LEFT JOIN mission_demands md ON pm.id = md.mission_id
      LEFT JOIN mission_parcels mp ON pm.id = mp.mission_id
      WHERE 1=1
    `;
    const queryParams = [];
    
    // Apply role-based filtering
    if (req.user.role === 'Chef d\'agence' && userAgency) {
      // Chef d'agence: Only see missions from their agency
      missionsSqlQuery += ` AND pm.agency = $${queryParams.length + 1}`;
      queryParams.push(userAgency);
      console.log('🔍 Chef d\'agence filtering: Only missions from agency:', userAgency);
    }
    // Admin role: No filtering - sees all missions
    else if (req.user.role === 'Admin' || req.user.role === 'Administration') {
      console.log('🔍 Admin role: No filtering - seeing all missions');
    }
    // Other roles: No filtering by default
    else {
      console.log('🔍 Other role:', req.user.role, '- No agency filtering applied');
    }
    
    // Apply status filter if provided
    if (status) {
      missionsSqlQuery += ` AND pm.status = $${queryParams.length + 1}`;
      queryParams.push(status);
    }
    
    // Complete the query with grouping, ordering, and pagination
    missionsSqlQuery += ` 
      GROUP BY pm.id, pm.mission_number, pm.driver_id, pm.shipper_id, 
               pm.scheduled_date, pm.status, pm.created_by, pm.created_at, 
               pm.updated_at, pm.completion_code, pm.agency, d.name, d.agency, 
               d.governorate, s.name, s.agency
      ORDER BY pm.created_at DESC 
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;
    queryParams.push(limit, offset);
    
    console.log('🔍 Final query params:', queryParams);
    
    // Execute the main query
    const result = await query(missionsSqlQuery, queryParams);
    console.log(`🔍 Query result: ${result.rows.length} missions found`);
    
    // Build count query for pagination (with same role-based filtering)
    let countSqlQuery = `
      SELECT COUNT(DISTINCT pm.id) 
      FROM pickup_missions pm
      WHERE 1=1
    `;
    const countParams = [];
    
    // Apply same role-based filtering to count query
    if (req.user.role === 'Chef d\'agence' && userAgency) {
      countSqlQuery += ` AND pm.agency = $${countParams.length + 1}`;
      countParams.push(userAgency);
    }
    
    // Apply status filter to count query if provided
    if (status) {
      countSqlQuery += ` AND pm.status = $${countParams.length + 1}`;
      countParams.push(status);
    }
    
    // Execute count query
    const countResult = await query(countSqlQuery, countParams);
    const total = parseInt(countResult.rows[0].count);
    
    // Build response
    const response = {
      missions: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      userRole: req.user.role,
      agencyFilter: req.user.role === 'Chef d\'agence' ? userAgency : null
    };
    
    console.log(`🔍 Response: ${result.rows.length} missions, total: ${total}, pages: ${Math.ceil(total / limit)}`);
    res.json(response);
    
  } catch (error) {
    console.error('❌ Error fetching pickup missions:', error);
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
      SELECT pm.*, d.name as driver_name, d.phone as livreur_phone, d.email as livreur_email, d.agency as driver_agency
      FROM pickup_missions pm
      LEFT JOIN drivers d ON pm.driver_id = d.id
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
      ORDER BY mp.id ASC
    `;
    
    const parcelsResult = await query(parcelsSqlQuery, [id]);
    
    // Get parcels for each demand
    const demandsWithParcels = [];
    for (const demand of demandsResult.rows) {
      const demandParcelsQuery = `
        SELECT 
          dp.*,
          p.tracking_number,
          p.destination,
          p.status as parcel_status,
          s.name as shipper_name,
          s.phone as shipper_phone,
          s.agency as shipper_agency
        FROM demand_parcels dp
        LEFT JOIN parcels p ON dp.parcel_id = p.id
        LEFT JOIN shippers s ON p.shipper_id = s.id
        WHERE dp.demand_id = $1
        ORDER BY dp.id ASC
      `;
      
      const demandParcelsResult = await query(demandParcelsQuery, [demand.id]);
      demandsWithParcels.push({
        ...demand,
        parcels: demandParcelsResult.rows
      });
    }
    
    res.json({
      ...mission,
      demands: demandsWithParcels,
      parcels: parcelsResult.rows,
      driver: {
        id: mission.driver_id,
        name: mission.driver_name || 'N/A',
        phone: mission.livreur_phone,
        email: mission.livreur_email,
        agency: mission.driver_agency
      }
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
    
    console.log('🔍 MISSION CREATION DEBUG:');
    console.log('🔍 User creating mission:', req.user);
    console.log('🔍 Request body:', req.body);
    console.log('🔍 Livreur ID being sent:', livreur_id);
    console.log('🔍 Livreur ID type:', typeof livreur_id);
    
    // Validate required fields
    if (!livreur_id || !demand_ids || demand_ids.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Check if user has permission to create missions
    if (!['Admin', 'Administration', 'Chef d\'agence', 'Membre d\'agence'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    await client.query('BEGIN');
    
    // Get livreur details from drivers table (including agency)
    const livreurSqlQuery = 'SELECT id, name, agency FROM drivers WHERE id = $1';
    console.log('🔍 Executing livreur query with ID:', livreur_id);
    console.log('🔍 Livreur SQL query:', livreurSqlQuery);
    const livreurResult = await client.query(livreurSqlQuery, [livreur_id]);
    
    console.log('🔍 Livreur query result:', livreurResult.rows);
    console.log('🔍 Livreur query row count:', livreurResult.rows.length);
    
    if (livreurResult.rows.length === 0) {
      // Debug: Check if the driver exists at all
      const driverExistsQuery = 'SELECT id, name, status FROM drivers WHERE id = $1';
      const driverExistsResult = await client.query(driverExistsQuery, [livreur_id]);
      
      console.log('🔍 Driver exists check result:', driverExistsResult.rows);
      
      if (driverExistsResult.rows.length === 0) {
        console.log('❌ Driver with ID', livreur_id, 'does not exist at all');
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Livreur not found - Driver does not exist' });
      } else {
        const driver = driverExistsResult.rows[0];
        console.log('❌ Driver exists but has wrong status:', driver.status, 'instead of Actif');
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          error: 'Livreur not found - Driver exists but is not active',
          driverStatus: driver.status,
          expectedStatus: 'Actif'
        });
      }
    }
    
    const livreur = livreurResult.rows[0];
    
    // NEW: Check if Chef d'agence user can assign missions to this driver's agency
    if (req.user.role === 'Chef d\'agence') {
      try {
        const userAgencyResult = await client.query(`
          SELECT agency FROM agency_managers WHERE email = $1
        `, [req.user.email]);
        
        if (userAgencyResult.rows.length > 0) {
          const userAgency = userAgencyResult.rows[0].agency;
          if (userAgency !== livreur.agency) {
            await client.query('ROLLBACK');
            return res.status(403).json({ 
              error: 'You can only assign missions to drivers in your agency',
              userAgency,
              driverAgency: livreur.agency
            });
          }
        }
      } catch (error) {
        console.error('❌ Error checking user agency:', error);
        await client.query('ROLLBACK');
        return res.status(500).json({ error: 'Error checking agency permissions' });
      }
    }
    
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
    
    // Note: completion_code will be generated when mission is completed
    
    // Create mission - NOW INCLUDING AGENCY FIELD
    const createMissionSqlQuery = `
      INSERT INTO pickup_missions (
        mission_number, driver_id, shipper_id, scheduled_date, 
        created_by, status, agency
      )
      VALUES ($1, $2, $3, $4, $5, 'En attente', $6)
      RETURNING id
    `;
    
    // Get the first shipper from the selected demands for shipper_id
    const firstDemand = demandCheckResult.rows[0];
    console.log('🔍 First demand:', firstDemand);
    
    const shipperSqlQuery = `
      SELECT s.id as shipper_id, s.agency as shipper_agency, s.name as shipper_name
      FROM shippers s
      INNER JOIN parcels p ON s.id = p.shipper_id
      INNER JOIN demand_parcels dp ON p.id = dp.parcel_id
      WHERE dp.demand_id = $1
      LIMIT 1
    `;
    const shipperResult = await client.query(shipperSqlQuery, [firstDemand.id]);
    console.log('🔍 Shipper query result:', shipperResult.rows);
    
    const shipperId = shipperResult.rows[0]?.shipper_id || 1; // Default to 1 if not found
    const shipperAgency = shipperResult.rows[0]?.shipper_agency || firstDemand.expediteur_agency;
    const shipperName = shipperResult.rows[0]?.shipper_name;
    
    console.log('🔍 Extracted shipper info:');
    console.log('🔍 Shipper ID:', shipperId);
    console.log('🔍 Shipper Agency:', shipperAgency);
    console.log('🔍 Shipper Name:', shipperName);
    
    console.log('🔍 Creating mission with data:', {
      missionCode,
      livreur_id,
      shipperId,
      shipperAgency,
      shipperName,
      scheduled_date: new Date(),
      created_by: req.user.id,
      agency: livreur.agency // NEW: Include driver's agency
    });
    
    const missionResult = await client.query(createMissionSqlQuery, [
      missionCode,
      livreur_id,
      shipperId,
      new Date(), // scheduled_date
      req.user.id,
      livreur.agency // NEW: Driver's agency
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
        'INSERT INTO mission_parcels (mission_id, parcel_id, status) VALUES ($1, $2, $3)',
        [missionId, parcel.parcel_id, 'En attente']
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
      hint: error.hint,
      stack: error.stack
    });
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message,
      code: error.code
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
    
               // Generate completion code if mission is being completed
               let completionCode = null;
               if (status === 'Terminée') {
                 let isUnique = false;
                 while (!isUnique) {
                   completionCode = generateSecurityCode(); // Reuse the function for completion code
                   const codeCheckResult = await query(
                     'SELECT id FROM pickup_missions WHERE completion_code = $1',
                     [completionCode]
                   );
                   isUnique = codeCheckResult.rows.length === 0;
                 }
               }
               
               const updateStatusSqlQuery = `
        UPDATE pickup_missions 
        SET status = $1, notes = $2, updated_at = CURRENT_TIMESTAMP
        ${status === 'Acceptée' ? ', accepted_at = CURRENT_TIMESTAMP' : ''}
        ${status === 'Terminée' ? ', completed_at = CURRENT_TIMESTAMP, completion_code = $4' : ''}
        WHERE id = $3
        RETURNING *
      `;
    
    const queryParams = status === 'Terminée' ? [status, notes, id, completionCode] : [status, notes, id];
    const result = await query(updateStatusSqlQuery, queryParams);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Mission not found' });
    }
    
    const response = { 
      message: 'Mission status updated successfully',
      mission: result.rows[0]
    };
    
    // Add completion code to response if mission was completed
    if (status === 'Terminée' && completionCode) {
      response.message += ` - Code de completion: ${completionCode}`;
      response.completionCode = completionCode;
    }
    
    res.json(response);
    
  } catch (error) {
    console.error('Error updating mission status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get available livreurs (with role-based filtering)
router.get('/available-livreurs', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 AVAILABLE LIVREURS - Role-based filtering:');
    console.log('🔍 User Role:', req.user.role);
    console.log('🔍 User Email:', req.user.email);
    
    // Get user's agency if they are Chef d'agence
    let userAgency = null;
    if (req.user.role === 'Chef d\'agence') {
      try {
        const agencyResult = await query(`
          SELECT agency, governorate 
          FROM agency_managers 
          WHERE email = $1
        `, [req.user.email]);
        
        if (agencyResult.rows.length > 0) {
          userAgency = agencyResult.rows[0].agency;
          console.log('🔍 Chef d\'agence agency:', userAgency);
        } else {
          console.log('⚠️ No agency found for Chef d\'agence:', req.user.email);
          return res.status(403).json({ 
            error: 'Agency not found for Chef d\'agence user',
            details: 'Please contact administrator to assign agency'
          });
        }
      } catch (error) {
        console.error('❌ Error fetching user agency:', error);
        return res.status(500).json({ 
          error: 'Error fetching user agency',
          details: error.message 
        });
      }
    }

    // Build the query with role-based filtering
    let livreursSqlQuery = `
      SELECT id, name, phone, email, agency, governorate
      FROM drivers 
      WHERE (status = 'Disponible' OR status IS NULL)
    `;
    const queryParams = [];
    
    // Apply role-based filtering
    if (req.user.role === 'Chef d\'agence' && userAgency) {
      // Chef d'agence: Only see drivers from their agency
      livreursSqlQuery += ` AND agency = $${queryParams.length + 1}`;
      queryParams.push(userAgency);
      console.log('🔍 Chef d\'agence filtering: Only drivers from agency:', userAgency);
    }
    // Admin role: No filtering - sees all drivers
    else if (req.user.role === 'Admin' || req.user.role === 'Administration') {
      console.log('🔍 Admin role: No filtering - seeing all drivers');
    }
    // Other roles: No filtering by default
    else {
      console.log('🔍 Other role:', req.user.role, '- No agency filtering applied');
    }
    
    livreursSqlQuery += ` ORDER BY name ASC`;
    
    console.log('🔍 Final query params:', queryParams);
    
    const result = await query(livreursSqlQuery, queryParams);
    console.log(`🔍 Query result: ${result.rows.length} drivers found`);
    
    // Build response with role information
    const response = {
      drivers: result.rows,
      userRole: req.user.role,
      agencyFilter: req.user.role === 'Chef d\'agence' ? userAgency : null,
      total: result.rows.length
    };
    
    res.json(response);
    
  } catch (error) {
    console.error('Error fetching available livreurs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get accepted demands (with role-based filtering)
router.get('/accepted-demands', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 ACCEPTED DEMANDS - Role-based filtering:');
    console.log('🔍 User Role:', req.user.role);
    console.log('🔍 User Email:', req.user.email);
    
    // Get user's agency if they are Chef d'agence
    let userAgency = null;
    if (req.user.role === 'Chef d\'agence') {
      try {
        const agencyResult = await query(`
          SELECT agency, governorate 
          FROM agency_managers 
          WHERE email = $1
        `, [req.user.email]);
        
        if (agencyResult.rows.length > 0) {
          userAgency = agencyResult.rows[0].agency;
          console.log('🔍 Chef d\'agence agency:', userAgency);
        } else {
          console.log('⚠️ No agency found for Chef d\'agence:', req.user.email);
          return res.status(403).json({ 
            error: 'Agency not found for Chef d\'agence user',
            details: 'Please contact administrator to assign agency'
          });
        }
      } catch (error) {
        console.error('❌ Error fetching user agency:', error);
        return res.status(500).json({ 
          error: 'Error fetching user agency',
          details: error.message 
        });
      }
    }

    // Build the query with role-based filtering
    let demandsSqlQuery = `
      SELECT 
        d.*,
        COALESCE(COUNT(dp.parcel_id), 0) as parcel_count,
        CASE WHEN md.mission_id IS NOT NULL THEN true ELSE false END as in_mission,
        d.expediteur_name,
        d.expediteur_agency
      FROM demands d
      LEFT JOIN demand_parcels dp ON d.id = dp.demand_id
      LEFT JOIN mission_demands md ON d.id = md.demand_id
      LEFT JOIN pickup_missions pm ON md.mission_id = pm.id AND pm.status IN ('En attente', 'Acceptée', 'En cours')
      WHERE d.status = 'Accepted'
    `;
    const queryParams = [];
    
    // Apply role-based filtering
    if (req.user.role === 'Chef d\'agence' && userAgency) {
      // Chef d'agence: Only see demands from their agency
      demandsSqlQuery += ` AND d.expediteur_agency = $${queryParams.length + 1}`;
      queryParams.push(userAgency);
      console.log('🔍 Chef d\'agence filtering: Only demands from agency:', userAgency);
    }
    // Admin role: No filtering - sees all demands
    else if (req.user.role === 'Admin' || req.user.role === 'Administration') {
      console.log('🔍 Admin role: No filtering - seeing all demands');
    }
    // Other roles: No filtering by default
    else {
      console.log('🔍 Other role:', req.user.role, '- No agency filtering applied');
    }
    
    demandsSqlQuery += ` 
      GROUP BY d.id, md.mission_id, d.expediteur_name, d.expediteur_agency
      HAVING md.mission_id IS NULL
      ORDER BY d.created_at DESC
    `;
    
    console.log('🔍 Final query params:', queryParams);
    
    const result = await query(demandsSqlQuery, queryParams);
    console.log(`🔍 Query result: ${result.rows.length} demands found`);
    
    // Build response with role information
    const response = {
      demands: result.rows,
      userRole: req.user.role,
      agencyFilter: req.user.role === 'Chef d\'agence' ? userAgency : null,
      total: result.rows.length
    };
    
    res.json(response);
    
  } catch (error) {
    console.error('Error fetching accepted demands:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete pickup mission
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user has permission to delete missions
    if (!['Admin', 'Administration', 'Chef d\'agence', 'Membre d\'agence'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    // Check if mission exists
    const missionCheck = await query('SELECT id, status FROM pickup_missions WHERE id = $1', [id]);
    
    if (missionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Mission not found' });
    }
    
    const mission = missionCheck.rows[0];
    
    // Only allow deletion of missions in certain statuses
    if (!['En attente', 'Refusée'].includes(mission.status)) {
      return res.status(400).json({ error: 'Cannot delete mission in current status' });
    }
    
    // Delete mission (cascade will handle related records)
    await query('DELETE FROM pickup_missions WHERE id = $1', [id]);
    
    res.json({ message: 'Mission deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting mission:', error);
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

// Scan parcel for pickup mission
router.post('/:id/scan-parcel', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { trackingNumber } = req.body;
    
    console.log('📦 Scan parcel request:', { missionId: id, trackingNumber });
    
    // Check if mission exists
    const missionCheck = await query('SELECT id, status FROM pickup_missions WHERE id = $1', [id]);
    
    if (missionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Mission not found' });
    }
    
    const mission = missionCheck.rows[0];
    
    // Check if mission is in correct status for scanning
    if (!['En attente', 'À enlever', 'Enlevé'].includes(mission.status)) {
      return res.status(400).json({ error: 'Cannot scan parcels in current mission status' });
    }
    
    // Check if parcel exists and is assigned to this mission
    const parcelCheck = await query(`
      SELECT p.id, p.tracking_number, p.status, mp.status as mission_parcel_status
      FROM parcels p
      INNER JOIN mission_parcels mp ON p.id = mp.parcel_id
      WHERE mp.mission_id = $1 AND p.tracking_number = $2
    `, [id, trackingNumber]);
    
    if (parcelCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Parcel not found in this mission' });
    }
    
    const parcel = parcelCheck.rows[0];
    
    // Update parcel status to "Picked Up"
    await query(`
      UPDATE parcels 
      SET status = 'Picked Up', updated_at = NOW() 
      WHERE id = $1
    `, [parcel.id]);
    
    // Update mission_parcels status
    await query(`
      UPDATE mission_parcels 
      SET status = 'Picked Up' 
      WHERE mission_id = $1 AND parcel_id = $2
    `, [id, parcel.id]);
    
    res.json({ 
      message: 'Parcel scanned successfully',
      parcel: {
        id: parcel.id,
        tracking_number: parcel.tracking_number,
        status: 'Picked Up'
      }
    });
    
  } catch (error) {
    console.error('Error scanning parcel:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 