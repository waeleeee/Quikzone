const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all delivery missions
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT dm.*, 
             d.name as driver_name,
             w.name as warehouse_name,
             COUNT(dmp.parcel_id) as assigned_parcels
      FROM delivery_missions dm
      LEFT JOIN drivers d ON dm.driver_id = d.id
      LEFT JOIN warehouses w ON dm.warehouse_id = w.id
      LEFT JOIN delivery_mission_parcels dmp ON dm.id = dmp.mission_id
      GROUP BY dm.id, d.name, w.name
      ORDER BY dm.created_at DESC
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get delivery missions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch delivery missions'
    });
  }
});

// Get available parcels for delivery mission
router.get('/available-parcels', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT p.*, s.name as client_name
      FROM parcels p
      JOIN shippers s ON p.shipper_id = s.id
      WHERE p.status = 'Au dépôt'
      ORDER BY p.created_at DESC
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get available parcels error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available parcels'
    });
  }
});

// Process delivery with security code
router.post('/:id/deliver', async (req, res) => {
  const client = await db.pool.connect();
  try {
    const { id } = req.params;
    const { parcel_id, security_code } = req.body;
    
    await client.query('BEGIN');
    
    // Get parcel details
    const parcelResult = await client.query(`
      SELECT p.*, dmp.mission_id
      FROM parcels p
      JOIN delivery_mission_parcels dmp ON p.id = dmp.parcel_id
      WHERE p.id = $1 AND dmp.mission_id = $2
    `, [parcel_id, id]);
    
    if (parcelResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Parcel not found in this mission'
      });
    }
    
    const parcel = parcelResult.rows[0];
    
    // Check security code
    if (security_code === parcel.client_code) {
      // Successful delivery
      await client.query(`
        UPDATE parcels 
        SET status = 'Livrés', 
            actual_delivery_date = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [parcel_id]);
      
      await client.query(`
        UPDATE delivery_mission_parcels 
        SET status = 'completed', 
            completed_at = CURRENT_TIMESTAMP
        WHERE mission_id = $1 AND parcel_id = $2
      `, [id, parcel_id]);
      
      await client.query('COMMIT');
      
      res.json({
        success: true,
        message: 'Parcel delivered successfully',
        status: 'Livrés'
      });
    } else if (security_code === parcel.failed_code) {
      // Failed delivery - return to depot
      await client.query(`
        UPDATE parcels 
        SET status = 'RTN dépot', 
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [parcel_id]);
      
      await client.query(`
        UPDATE delivery_mission_parcels 
        SET status = 'failed', 
            completed_at = CURRENT_TIMESTAMP
        WHERE mission_id = $1 AND parcel_id = $2
      `, [id, parcel_id]);
      
      await client.query('COMMIT');
      
      res.json({
        success: true,
        message: 'Parcel returned to depot',
        status: 'RTN dépot'
      });
    } else {
      await client.query('ROLLBACK');
      res.status(400).json({
        success: false,
        message: 'Invalid security code'
      });
    }
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Process delivery error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process delivery'
    });
  } finally {
    client.release();
  }
});

// Get delivery mission by ID with parcels
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get mission details
    const missionResult = await db.query(`
      SELECT dm.*, 
             d.name as driver_name,
             w.name as warehouse_name
      FROM delivery_missions dm
      LEFT JOIN drivers d ON dm.driver_id = d.id
      LEFT JOIN warehouses w ON dm.warehouse_id = w.id
      WHERE dm.id = $1
    `, [id]);
    
    if (missionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Delivery mission not found'
      });
    }
    
    // Get assigned parcels with shipper information
    const parcelsResult = await db.query(`
      SELECT p.*, 
             dmp.sequence_order, 
             dmp.status as mission_status,
             s.name as shipper_name,
             s.phone as shipper_phone,
             s.email as shipper_email,
             CASE 
               WHEN s.address IS NOT NULL AND s.address != '' THEN s.address
               WHEN s.company_address IS NOT NULL AND s.company_address != '' THEN s.company_address
               ELSE 'Adresse non spécifiée'
             END as shipper_address
      FROM delivery_mission_parcels dmp
      JOIN parcels p ON dmp.parcel_id = p.id
      JOIN shippers s ON p.shipper_id = s.id
      WHERE dmp.mission_id = $1
      ORDER BY dmp.sequence_order
    `, [id]);
    
    const mission = missionResult.rows[0];
    mission.parcels = parcelsResult.rows;
    
    res.json({
      success: true,
      data: mission
    });
  } catch (error) {
    console.error('Get delivery mission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch delivery mission'
    });
  }
});

// Create new delivery mission
router.post('/', async (req, res) => {
  const client = await db.pool.connect();
  try {
    const { 
      driverId, 
      warehouseId, 
      deliveryDate, 
      parcelIds,
      notes 
    } = req.body;
    
    // Generate mission number
    const mission_number = 'DEL' + Date.now();
    
    // Validate required fields
    if (!driverId || !warehouseId || !deliveryDate || !parcelIds || parcelIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: driverId, warehouseId, deliveryDate, and parcelIds are required'
      });
    }
    
    await client.query('BEGIN');
    
    // Create delivery mission
    const missionResult = await client.query(`
      INSERT INTO delivery_missions (mission_number, driver_id, warehouse_id, delivery_date, estimated_parcels, notes, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [mission_number, driverId, warehouseId, deliveryDate, parcelIds.length, notes, req.user?.id || 1]);
    
    const mission = missionResult.rows[0];
    
    // Assign parcels to mission
    for (let i = 0; i < parcelIds.length; i++) {
      const parcel_id = parcelIds[i];
      
      // Generate security codes for the parcel
      const client_code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const failed_code = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      // Update parcel with security codes and status
      console.log(`🔄 Updating parcel ${parcel_id} with status 'En cours'`);
      await client.query(`
        UPDATE parcels 
        SET status = 'En cours',
            client_code = $1,
            failed_code = $2
        WHERE id = $3
      `, [client_code, failed_code, parcel_id]);
      
      // Add to delivery_mission_parcels
      await client.query(`
        INSERT INTO delivery_mission_parcels (mission_id, parcel_id, sequence_order)
        VALUES ($1, $2, $3)
      `, [mission.id, parcel_id, i + 1]);
    }
    
    await client.query('COMMIT');
    
    res.status(201).json({
      success: true,
      data: mission,
      message: 'Delivery mission created successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create delivery mission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create delivery mission'
    });
  } finally {
    client.release();
  }
});

// Update delivery mission
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, failed_code, ...otherFields } = req.body;
    
    let updateFields = [];
    let values = [];
    let paramCount = 1;
    
    if (status !== undefined) {
      updateFields.push(`status = $${paramCount++}`);
      values.push(status);
    }
    
    if (failed_code !== undefined) {
      updateFields.push(`failed_code = $${paramCount++}`);
      values.push(failed_code);
    }
    
    // Add other fields if needed
    Object.keys(otherFields).forEach(key => {
      updateFields.push(`${key} = $${paramCount++}`);
      values.push(otherFields[key]);
    });
    
    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }
    
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);
    
    const result = await db.query(`
      UPDATE delivery_missions 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Delivery mission not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Delivery mission updated successfully'
    });
  } catch (error) {
    console.error('Update delivery mission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update delivery mission'
    });
  }
});

// Update delivery mission status (legacy endpoint)
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const result = await db.query(`
      UPDATE delivery_missions 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `, [status, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Delivery mission not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Delivery mission status updated successfully'
    });
  } catch (error) {
    console.error('Update delivery mission status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update delivery mission status'
    });
  }
});

// Process delivery with security code
router.post('/:id/deliver', async (req, res) => {
  const client = await db.pool.connect();
  try {
    const { id } = req.params;
    const { parcel_id, security_code } = req.body;
    
    await client.query('BEGIN');
    
    // Get parcel details
    const parcelResult = await client.query(`
      SELECT p.*, dmp.mission_id
      FROM parcels p
      JOIN delivery_mission_parcels dmp ON p.id = dmp.parcel_id
      WHERE p.id = $1 AND dmp.mission_id = $2
    `, [parcel_id, id]);
    
    if (parcelResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Parcel not found in this mission'
      });
    }
    
    const parcel = parcelResult.rows[0];
    
    // Check security code
    if (security_code === parcel.client_code) {
      // Successful delivery
      await client.query(`
        UPDATE parcels 
        SET status = 'Livrés', 
            actual_delivery_date = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [parcel_id]);
      
      await client.query(`
        UPDATE delivery_mission_parcels 
        SET status = 'completed', 
            completed_at = CURRENT_TIMESTAMP
        WHERE mission_id = $1 AND parcel_id = $2
      `, [id, parcel_id]);
      
      await client.query('COMMIT');
      
      res.json({
        success: true,
        message: 'Parcel delivered successfully',
        status: 'Livrés'
      });
    } else if (security_code === parcel.failed_code) {
      // Failed delivery - return to depot
      await client.query(`
        UPDATE parcels 
        SET status = 'RTN dépot', 
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [parcel_id]);
      
      await client.query(`
        UPDATE delivery_mission_parcels 
        SET status = 'failed', 
            completed_at = CURRENT_TIMESTAMP
        WHERE mission_id = $1 AND parcel_id = $2
      `, [id, parcel_id]);
      
      await client.query('COMMIT');
      
      res.json({
        success: true,
        message: 'Parcel returned to depot',
        status: 'RTN dépot'
      });
    } else {
      await client.query('ROLLBACK');
      res.status(400).json({
        success: false,
        message: 'Invalid security code'
      });
    }
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Process delivery error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process delivery'
    });
  } finally {
    client.release();
  }
});

module.exports = router; 