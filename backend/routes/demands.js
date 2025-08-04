const express = require('express');
const router = express.Router();
const { query, pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Get all demands (with filtering for different user roles)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status = '', expediteur_email = '', exclude_in_missions = false } = req.query;
    const offset = (page - 1) * limit;
    
    let demandsSqlQuery = `
      SELECT 
        d.*,
        u.first_name as reviewer_first_name,
        u.last_name as reviewer_last_name,
        COALESCE(COUNT(dp.parcel_id), 0) as parcel_count
      FROM demands d
      LEFT JOIN users u ON d.reviewed_by = u.id
      LEFT JOIN demand_parcels dp ON d.id = dp.demand_id
      WHERE 1=1
    `;
    
    // Exclude demands that are already in missions if requested
    if (exclude_in_missions === 'true') {
      console.log('🔍 Filtering out demands that are already in missions...');
      demandsSqlQuery += ` AND d.id NOT IN (
        SELECT DISTINCT md.demand_id 
        FROM mission_demands md 
        INNER JOIN pickup_missions pm ON md.mission_id = pm.id 
        WHERE pm.status IN ('En attente', 'À enlever', 'Enlevé', 'Au dépôt')
      )`;
    }
    const queryParams = [];
    
    // Filter by status
    if (status) {
      demandsSqlQuery += ` AND d.status = $${queryParams.length + 1}`;
      queryParams.push(status);
    }
    
    // Filter by expediteur email (for expediteur users)
    if (expediteur_email) {
      demandsSqlQuery += ` AND d.expediteur_email = $${queryParams.length + 1}`;
      queryParams.push(expediteur_email);
    }
    
    // Filter by agency for Chef d'agence and Membre d'agence
    if (req.user.role === 'Chef d\'agence' || req.user.role === 'Membre d\'agence') {
      // Get user's agency from agency_managers table
      const agencySqlQuery = `
        SELECT agency FROM agency_managers 
        WHERE email = $${queryParams.length + 1}
      `;
      const agencyResult = await query(agencySqlQuery, [req.user.email]);
      
      if (agencyResult.rows.length > 0) {
        const userAgency = agencyResult.rows[0].agency;
        demandsSqlQuery += ` AND d.expediteur_agency = $${queryParams.length + 1}`;
        queryParams.push(userAgency);
      }
    }
    
    demandsSqlQuery += ` GROUP BY d.id, u.first_name, u.last_name
               ORDER BY d.created_at DESC 
               LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit, offset);
    
    console.log('🔍 DEBUG - Demands SQL Query:', demandsSqlQuery);
    console.log('🔍 DEBUG - Query Params:', queryParams);
    
    const result = await query(demandsSqlQuery, queryParams);
    console.log('🔍 DEBUG - Demands Query Result:', result);
    
    // Get total count for pagination
    let countSqlQuery = `
      SELECT COUNT(DISTINCT d.id) 
      FROM demands d
      WHERE 1=1
    `;
    
    // Exclude demands that are already in missions if requested
    if (exclude_in_missions === 'true') {
      console.log('🔍 Filtering out demands that are already in missions (count query)...');
      countSqlQuery += ` AND d.id NOT IN (
        SELECT DISTINCT md.demand_id 
        FROM mission_demands md 
        INNER JOIN pickup_missions pm ON md.mission_id = pm.id 
        WHERE pm.status IN ('En attente', 'À enlever', 'Enlevé', 'Au dépôt')
      )`;
    }
    const countParams = [];
    
    if (status) {
      countSqlQuery += ` AND d.status = $${countParams.length + 1}`;
      countParams.push(status);
    }
    
    if (expediteur_email) {
      countSqlQuery += ` AND d.expediteur_email = $${countParams.length + 1}`;
      countParams.push(expediteur_email);
    }
    
    if (req.user.role === 'Chef d\'agence' || req.user.role === 'Membre d\'agence') {
      const agencyCountSqlQuery = `
        SELECT agency FROM agency_managers 
        WHERE email = $${countParams.length + 1}
      `;
      const agencyResult = await query(agencyCountSqlQuery, [req.user.email]);
      
      if (agencyResult.rows.length > 0) {
        const userAgency = agencyResult.rows[0].agency;
        countSqlQuery += ` AND d.expediteur_agency = $${countParams.length + 1}`;
        countParams.push(userAgency);
      }
    }
    
    console.log('🔍 DEBUG - Count SQL Query:', countSqlQuery);
    console.log('🔍 DEBUG - Count Params:', countParams);
    
    const countResult = await query(countSqlQuery, countParams);
    console.log('🔍 DEBUG - Count Query Result:', countResult);
    
    const total = parseInt(countResult.rows[0].count);
    
    const response = {
      demands: result.rows,
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
    console.error('❌ Error fetching demands:', error);
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

// Get demand by ID with parcel details
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get demand details
    const demandDetailsSqlQuery = `
      SELECT 
        d.*,
        u.first_name as reviewer_first_name,
        u.last_name as reviewer_last_name
      FROM demands d
      LEFT JOIN users u ON d.reviewed_by = u.id
      WHERE d.id = $1
    `;
    
    const demandResult = await query(demandDetailsSqlQuery, [id]);
    
    if (demandResult.rows.length === 0) {
      return res.status(404).json({ error: 'Demand not found' });
    }
    
    const demand = demandResult.rows[0];
    
    // Get parcels in this demand
    const parcelsSqlQuery = `
      SELECT 
        p.*,
        s.name as shipper_name,
        s.email as shipper_email,
        s.phone as shipper_phone,
        s.agency as shipper_agency
      FROM parcels p
      LEFT JOIN shippers s ON p.shipper_id = s.id
      INNER JOIN demand_parcels dp ON p.id = dp.parcel_id
      WHERE dp.demand_id = $1
      ORDER BY dp.added_at ASC
    `;
    
    const parcelsResult = await query(parcelsSqlQuery, [id]);
    
    res.json({
      ...demand,
      parcels: parcelsResult.rows
    });
    
  } catch (error) {
    console.error('Error fetching demand:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new demand
router.post('/', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { expediteur_email, expediteur_name, parcel_ids, notes } = req.body;
    
    // Validate required fields
    if (!expediteur_email || !expediteur_name || !parcel_ids || parcel_ids.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Get shipper_id and agency from shippers table based on email
    const shipperSqlQuery = 'SELECT id, agency FROM shippers WHERE email = $1';
    const shipperResult = await client.query(shipperSqlQuery, [expediteur_email]);
    
    if (shipperResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Shipper not found with this email' });
    }
    
    const expediteur_id = shipperResult.rows[0].id;
    const expediteur_agency = shipperResult.rows[0].agency;
    
    await client.query('BEGIN');
    
    // Check if parcels are available (status "En attente" and not in another demand)
    const parcelCheckSqlQuery = `
      SELECT p.id, p.tracking_number, p.status, dp.demand_id
      FROM parcels p
      LEFT JOIN demand_parcels dp ON p.id = dp.parcel_id
      LEFT JOIN demands d ON dp.demand_id = d.id AND d.status IN ('Pending', 'Accepted', 'Completed')
      WHERE p.id = ANY($1)
    `;
    
    const parcelCheckResult = await client.query(parcelCheckSqlQuery, [parcel_ids]);
    
    const unavailableParcels = parcelCheckResult.rows.filter(p => 
      p.status !== 'En attente' || p.demand_id
    );
    
    if (unavailableParcels.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: 'Some parcels are not available',
        unavailableParcels: unavailableParcels.map(p => ({
          id: p.id,
          tracking_number: p.tracking_number,
          status: p.status
        }))
      });
    }
    
    // Create demand
    const createDemandSqlQuery = `
      INSERT INTO demands (expediteur_id, expediteur_email, expediteur_name, expediteur_agency, notes)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `;
    
    const demandResult = await client.query(createDemandSqlQuery, [
      expediteur_id, expediteur_email, expediteur_name, expediteur_agency, notes
    ]);
    
    const demandId = demandResult.rows[0].id;
    
    // Add parcels to demand
    for (const parcelId of parcel_ids) {
      await client.query(
        'INSERT INTO demand_parcels (demand_id, parcel_id) VALUES ($1, $2)',
        [demandId, parcelId]
      );
    }
    
    await client.query('COMMIT');
    
    res.status(201).json({ 
      message: 'Demand created successfully',
      demand_id: demandId
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating demand:', error);
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

// Update demand status (for admin/chef d'agence)
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, review_notes } = req.body;
    
    // Check if user has permission to review demands
    if (!['Admin', 'Administration', 'Chef d\'agence', 'Administrateur'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    // Validate status
    if (!['Accepted', 'Not Accepted', 'Completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const updateStatusSqlQuery = `
      UPDATE demands 
      SET status = $1, review_notes = $2, reviewed_by = $3, reviewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `;
    
    const result = await query(updateStatusSqlQuery, [status, review_notes, req.user.id, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Demand not found' });
    }
    
    res.json({ 
      message: 'Demand status updated successfully',
      demand: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error updating demand status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete demand (only if not accepted)
router.delete('/:id', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    
    await client.query('BEGIN');
    
    // Check if demand exists and can be deleted
    const checkDemandSqlQuery = 'SELECT * FROM demands WHERE id = $1';
    const demandResult = await client.query(checkDemandSqlQuery, [id]);
    
    if (demandResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Demand not found' });
    }
    
    const demand = demandResult.rows[0];
    
    // Only allow deletion if demand is not accepted
    if (demand.status === 'Accepted') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Cannot delete accepted demand' });
    }
    
    // Check if user has permission (expediteur can only delete their own demands)
    if (req.user.role === 'Expéditeur' && demand.expediteur_email !== req.user.email) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    // Delete demand_parcels first (due to foreign key constraint)
    await client.query('DELETE FROM demand_parcels WHERE demand_id = $1', [id]);
    
    // Delete demand
    await client.query('DELETE FROM demands WHERE id = $1', [id]);
    
    await client.query('COMMIT');
    
    res.json({ message: 'Demand deleted successfully' });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting demand:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Get available parcels for expediteur (status "En attente" and not in another demand)
router.get('/available-parcels/:expediteur_email', authenticateToken, async (req, res) => {
  try {
    const { expediteur_email } = req.params;
    
    const availableParcelsSqlQuery = `
      SELECT 
        p.*,
        s.name as shipper_name,
        s.email as shipper_email,
        s.phone as shipper_phone,
        s.agency as shipper_agency
      FROM parcels p
      LEFT JOIN shippers s ON p.shipper_id = s.id
      LEFT JOIN demand_parcels dp ON p.id = dp.parcel_id
      LEFT JOIN demands d ON dp.demand_id = d.id AND d.status IN ('Pending', 'Accepted')
      WHERE p.status = 'En attente' 
        AND s.email = $1
        AND dp.parcel_id IS NULL
      ORDER BY p.created_at DESC
    `;
    
    const result = await query(availableParcelsSqlQuery, [expediteur_email]);
    
    res.json(result.rows);
    
  } catch (error) {
    console.error('Error fetching available parcels:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update parcel status when scanned (for admin/chef d'agence/membre d'agence)
router.put('/:id/scan-parcel', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const { tracking_number } = req.body;
    
    // Check if user has permission to scan parcels
    if (!['Admin', 'Administration', 'Chef d\'agence', 'Membre de l\'agence'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    await client.query('BEGIN');
    
    // Find the parcel in the demand
    const parcelSqlQuery = `
      SELECT p.*, dp.demand_id
      FROM parcels p
      INNER JOIN demand_parcels dp ON p.id = dp.parcel_id
      INNER JOIN demands d ON dp.demand_id = d.id
      WHERE d.id = $1 AND p.tracking_number = $2
    `;
    
    const parcelResult = await client.query(parcelSqlQuery, [id, tracking_number]);
    
    if (parcelResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Parcel not found in this demand' });
    }
    
    const parcel = parcelResult.rows[0];
    
    // Update parcel status to "Au dépôt"
    await client.query(
      'UPDATE parcels SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['Au dépôt', parcel.id]
    );
    
    await client.query('COMMIT');
    
    res.json({ 
      message: 'Parcel scanned successfully',
      parcel: {
        id: parcel.id,
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

// Get parcels for a specific demand
router.get('/:id/parcels', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const parcelsSqlQuery = `
      SELECT 
        p.*,
        dp.added_at as added_to_demand_at,
        s.name as shipper_name,
        s.agency as shipper_agency
      FROM parcels p
      INNER JOIN demand_parcels dp ON p.id = dp.parcel_id
      LEFT JOIN shippers s ON p.shipper_id = s.id
      WHERE dp.demand_id = $1
      ORDER BY dp.added_at ASC
    `;
    
    const result = await query(parcelsSqlQuery, [id]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching demand parcels:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 