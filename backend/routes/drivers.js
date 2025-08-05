const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Helper function to get driver ID from user email
const getDriverId = async (userEmail) => {
  console.log('🔍 getDriverId called with email:', userEmail);
  
  // First try to find the driver by email
  let driverResult = await db.query(`
    SELECT id FROM drivers WHERE email = $1
  `, [userEmail]);
  
  console.log('📋 Driver search result:', driverResult.rows.length, 'drivers found');
  
  if (driverResult.rows.length === 0) {
    console.log('⚠️ Driver not found, looking for user...');
    
    // If not found in drivers table, try to find the user and create a driver record
    const userResult = await db.query(`
      SELECT id, email, first_name, last_name FROM users WHERE email = $1
    `, [userEmail]);
    
    console.log('👤 User search result:', userResult.rows.length, 'users found');
    
    if (userResult.rows.length === 0) {
      console.log('❌ User not found in users table');
      throw new Error('User not found');
    }
    
    const user = userResult.rows[0];
    console.log('✅ User found:', user);
    
    // Create a driver record for this user
    console.log('🚀 Creating new driver record...');
    const createDriverResult = await db.query(`
      INSERT INTO drivers (email, name, phone, created_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      RETURNING id
    `, [user.email, `${user.first_name} ${user.last_name}`, null]);
    
    console.log('✅ Driver record created:', createDriverResult.rows[0]);
    driverResult = createDriverResult;
  } else {
    console.log('✅ Existing driver found:', driverResult.rows[0]);
  }
  
  const driverId = driverResult.rows[0].id;
  console.log('🎯 Returning driver ID:', driverId);
  return driverId;
};

// Get driver pickup missions
router.get('/pickup-missions', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Driver pickup missions request from:', req.user.email);
    console.log('👤 User object:', req.user);
    
    const driverId = await getDriverId(req.user.email);
    console.log('✅ Driver ID found:', driverId);
    
    // Get pickup missions assigned to this driver
    console.log('🔍 Querying pickup missions for driver ID:', driverId);
    const result = await db.query(`
      SELECT 
        pm.id,
        pm.mission_number,
        pm.status,
        pm.created_at,
        pm.updated_at,
        pm.completion_code as security_code,
        s.name as shipper_name,
        s.address as shipper_address,
        s.phone as shipper_phone,
        COUNT(mp.parcel_id) as parcels_count
      FROM pickup_missions pm
      LEFT JOIN shippers s ON pm.shipper_id = s.id
      LEFT JOIN mission_parcels mp ON pm.id = mp.mission_id
      WHERE pm.driver_id = $1
      GROUP BY pm.id, pm.mission_number, pm.status, pm.created_at, pm.updated_at, pm.completion_code, s.name, s.address, s.phone
      ORDER BY pm.created_at DESC
    `, [driverId]);
    
    console.log('📦 Pickup missions query result:', result.rows.length, 'missions found');

    // Get parcels for each mission with shipper information
    const missionsWithParcels = await Promise.all(
      result.rows.map(async (mission) => {
        const parcelsResult = await db.query(`
          SELECT 
            p.id,
            p.tracking_number,
            p.recipient_name,
            p.destination,
            p.status,
            p.client_code,
            s.name as shipper_name,
            s.address as shipper_address,
            s.phone as shipper_phone
          FROM parcels p
          INNER JOIN mission_parcels mp ON p.id = mp.parcel_id
          LEFT JOIN shippers s ON p.shipper_id = s.id
          WHERE mp.mission_id = $1
        `, [mission.id]);

        // Get unique shippers for this mission
        const uniqueShippers = parcelsResult.rows.reduce((shippers, parcel) => {
          const shipperKey = `${parcel.shipper_name}-${parcel.shipper_address}`;
          if (!shippers.find(s => `${s.name}-${s.address}` === shipperKey)) {
            shippers.push({
              name: parcel.shipper_name,
              address: parcel.shipper_address,
              phone: parcel.shipper_phone
            });
          }
          return shippers;
        }, []);

        return {
          ...mission,
          parcels: parcelsResult.rows,
          shippers: uniqueShippers // Add all shippers for this mission
        };
      })
    );

    console.log('📦 Returning missions:', missionsWithParcels.length);
    res.json({
      success: true,
      missions: missionsWithParcels
    });
  } catch (error) {
    console.error('❌ Get driver pickup missions error:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error message:', error.message);
    
    if (error.message === 'Driver not found') {
      console.log('🚫 Returning 404 - Driver not found');
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }
    
    if (error.message === 'User not found') {
      console.log('🚫 Returning 404 - User not found');
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    console.log('🚫 Returning 500 - Internal server error');
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pickup missions'
    });
  }
});

// Accept pickup mission
router.post('/pickup-missions/:id/accept', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const driverId = await getDriverId(req.user.email);

    // Check if mission exists and is assigned to this driver
    const missionCheck = await db.query(`
      SELECT id, status FROM pickup_missions 
      WHERE id = $1 AND driver_id = $2
    `, [id, driverId]);

    if (missionCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Mission not found or not assigned to you'
      });
    }

    if (missionCheck.rows[0].status !== 'En attente') {
      return res.status(400).json({
        success: false,
        message: 'Mission cannot be accepted in current status'
      });
    }

    // Update mission status to "À enlever"
    await db.query(`
      UPDATE pickup_missions 
      SET status = 'À enlever', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [id]);

    // Update all parcels in this mission to "À enlever"
    await db.query(`
      UPDATE parcels 
      SET status = 'À enlever'
      WHERE id IN (
        SELECT parcel_id FROM mission_parcels WHERE mission_id = $1
      )
    `, [id]);

    res.json({
      success: true,
      message: 'Mission acceptée avec succès'
    });
  } catch (error) {
    console.error('Accept pickup mission error:', error);
    if (error.message === 'Driver not found') {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to accept mission'
    });
  }
});

// Refuse pickup mission
router.post('/pickup-missions/:id/refuse', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const driverId = await getDriverId(req.user.email);

    // Check if mission exists and is assigned to this driver
    const missionCheck = await db.query(`
      SELECT id, status FROM pickup_missions 
      WHERE id = $1 AND driver_id = $2
    `, [id, driverId]);

    if (missionCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Mission not found or not assigned to you'
      });
    }

    if (missionCheck.rows[0].status !== 'En attente') {
      return res.status(400).json({
        success: false,
        message: 'Mission cannot be refused in current status'
      });
    }

    // Update mission status to "Refusé par livreur"
    await db.query(`
      UPDATE pickup_missions 
      SET status = 'Refusé par livreur', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [id]);

    res.json({
      success: true,
      message: 'Mission refusée'
    });
  } catch (error) {
    console.error('Refuse pickup mission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to refuse mission'
    });
  }
});

// Complete pickup scan
router.post('/pickup-missions/:id/scan-complete', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { scannedParcels } = req.body;
    const driverId = await getDriverId(req.user.email);

    // Check if mission exists and is assigned to this driver
    const missionCheck = await db.query(`
      SELECT id, status FROM pickup_missions 
      WHERE id = $1 AND driver_id = $2
    `, [id, driverId]);

    if (missionCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Mission not found or not assigned to you'
      });
    }

    if (missionCheck.rows[0].status !== 'À enlever') {
      return res.status(400).json({
        success: false,
        message: 'Mission cannot be scanned in current status'
      });
    }

    // Update scanned parcels to "Enlevé"
    if (scannedParcels && scannedParcels.length > 0) {
      await db.query(`
        UPDATE parcels 
        SET status = 'Enlevé'
        WHERE id = ANY($1)
      `, [scannedParcels]);
    }

    // Update mission status to "Enlevé"
    await db.query(`
      UPDATE pickup_missions 
      SET status = 'Enlevé', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [id]);

    res.json({
      success: true,
      message: 'Scan terminé avec succès'
    });
  } catch (error) {
    console.error('Complete pickup scan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete scan'
    });
  }
});

// Complete pickup mission
router.post('/pickup-missions/:id/complete', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { missionCode } = req.body;
    const driverId = await getDriverId(req.user.email);

    console.log('🔍 Complete mission request:', {
      missionId: id,
      missionCode: missionCode,
      driverId: driverId,
      userEmail: req.user.email
    });

    // Check if mission exists and is assigned to this driver
    const missionCheck = await db.query(`
      SELECT id, status, completion_code FROM pickup_missions 
      WHERE id = $1 AND driver_id = $2
    `, [id, driverId]);

    if (missionCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Mission not found or not assigned to you'
      });
    }

    console.log('🔍 Mission check result:', missionCheck.rows[0]);

    if (missionCheck.rows[0].status !== 'Enlevé' && missionCheck.rows[0].status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        message: `Mission cannot be completed in current status: ${missionCheck.rows[0].status}`
      });
    }

    // Verify completion code
    if (!missionCheck.rows[0].completion_code) {
      return res.status(400).json({
        success: false,
        message: 'Aucun code de finalisation généré pour cette mission'
      });
    }

    if (missionCheck.rows[0].completion_code !== missionCode) {
      return res.status(400).json({
        success: false,
        message: 'Code de finalisation incorrect'
      });
    }

    console.log('✅ Updating mission status to "Terminé"');
    
    // Update mission status to "Terminé"
    await db.query(`
      UPDATE pickup_missions 
      SET status = 'Terminé', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [id]);

    // Update all parcels in this mission to "Au dépôt"
    await db.query(`
      UPDATE parcels 
      SET status = 'Au dépôt'
      WHERE id IN (
        SELECT parcel_id FROM mission_parcels WHERE mission_id = $1
      )
    `, [id]);

    // Update all demands in this mission to "Completed" status
    await db.query(`
      UPDATE demands 
      SET status = 'Completed', updated_at = CURRENT_TIMESTAMP
      WHERE id IN (
        SELECT demand_id 
        FROM mission_demands 
        WHERE mission_id = $1
      )
    `, [id]);

    console.log('✅ Mission completed successfully');

    res.json({
      success: true,
      message: 'Mission terminée avec succès'
    });
  } catch (error) {
    console.error('Complete pickup mission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete mission'
    });
  }
});

// Get driver statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const driverId = await getDriverId(req.user.email);

    // Get delivery mission stats
    const deliveryStats = await db.query(`
      SELECT 
        COUNT(*) as total_missions,
        COUNT(CASE WHEN status = 'Terminée' THEN 1 END) as completed_missions,
        COUNT(CASE WHEN status = 'En cours' THEN 1 END) as active_missions
      FROM delivery_missions 
      WHERE driver_id = $1
    `, [driverId]);

    // Get pickup mission stats
    const pickupStats = await db.query(`
      SELECT 
        COUNT(*) as total_pickup_missions,
        COUNT(CASE WHEN status = 'Mission terminée' THEN 1 END) as completed_pickup_missions
      FROM pickup_missions 
      WHERE driver_id = $1
    `, [driverId]);

    // Get parcel stats
    const parcelStats = await db.query(`
      SELECT 
        COUNT(*) as total_colis,
        COUNT(CASE WHEN status = 'Livré' THEN 1 END) as delivered_colis
      FROM parcels p
      INNER JOIN delivery_missions dm ON p.mission_id = dm.id
      WHERE dm.driver_id = $1
    `, [driverId]);

    const stats = {
      totalMissions: (deliveryStats.rows[0]?.total_missions || 0) + (pickupStats.rows[0]?.total_pickup_missions || 0),
      completedMissions: (deliveryStats.rows[0]?.completed_missions || 0) + (pickupStats.rows[0]?.completed_pickup_missions || 0),
      activeMissions: deliveryStats.rows[0]?.active_missions || 0,
      totalColis: parcelStats.rows[0]?.total_colis || 0,
      deliveredColis: parcelStats.rows[0]?.delivered_colis || 0,
      totalEarnings: 0 // TODO: Calculate earnings based on your business logic
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get driver stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch driver statistics'
    });
  }
});

// Get driver delivery missions
router.get('/missions', authenticateToken, async (req, res) => {
  try {
    const driverId = await getDriverId(req.user.email);

    const result = await db.query(`
      SELECT 
        dm.id,
        dm.status,
        dm.created_at,
        dm.updated_at,
        COUNT(p.id) as colis_count,
        dm.total_distance
      FROM delivery_missions dm
      LEFT JOIN parcels p ON dm.id = p.mission_id
      WHERE dm.driver_id = $1
      GROUP BY dm.id, dm.status, dm.created_at, dm.updated_at, dm.total_distance
      ORDER BY dm.created_at DESC
    `, [driverId]);

    res.json({
      success: true,
      missions: result.rows
    });
  } catch (error) {
    console.error('Get driver missions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch driver missions'
    });
  }
});

module.exports = router; 