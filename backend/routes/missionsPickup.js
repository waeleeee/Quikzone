const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// Helper: get full mission info with joins
async function getFullMission(row) {
  try {
    console.log('🔍 getFullMission called with row:', row);
    
    // Get driver info from drivers table
    const driverRes = await pool.query('SELECT id, name, email FROM drivers WHERE id = $1', [row.driver_id]);
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
      updated_at: row.updated_at
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
router.get('/', async (req, res) => {
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
router.post('/', async (req, res) => {
  try {
    const { driver_id, shipper_id, colis_ids, scheduled_time, status } = req.body;
    
    // Generate mission number
    const missionNumber = `PIK${Date.now()}`;
    
    // Insert mission
    const insertQ = `INSERT INTO pickup_missions (mission_number, driver_id, shipper_id, scheduled_date, status, created_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;
    const values = [missionNumber, driver_id, shipper_id, scheduled_time, status || 'En attente', 1];
    const result = await pool.query(insertQ, values);
    
    // Insert parcel assignments if colis_ids provided
    if (colis_ids && colis_ids.length > 0) {
      for (const parcelId of colis_ids) {
        await pool.query('INSERT INTO mission_parcels (mission_id, parcel_id, status) VALUES ($1, $2, $3)', [result.rows[0].id, parcelId, 'pending']);
      }
    }
    
    const mission = await getFullMission(result.rows[0]);
    res.json({ success: true, data: mission });
  } catch (err) {
    console.error('POST pickup_missions error:', err);
    res.status(500).json({ success: false, message: 'Erreur lors de la création de la mission' });
  }
});

// Generate security code for mission completion
function generateMissionCode(missionNumber, driverId, date) {
  // Create a code based on mission number, driver ID, and date
  const dateStr = new Date(date).toISOString().slice(0, 10).replace(/-/g, '');
  const code = `${missionNumber.slice(-4)}${driverId}${dateStr.slice(-4)}`;
  return code.toUpperCase();
}

// GET mission security code
router.get('/:id/security-code', async (req, res) => {
  try {
    console.log('🔐 GET /missions-pickup/:id/security-code called');
    
    const result = await pool.query('SELECT mission_number, driver_id, scheduled_date FROM pickup_missions WHERE id = $1', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Mission non trouvée' });
    }
    
    const mission = result.rows[0];
    const securityCode = generateMissionCode(mission.mission_number, mission.driver_id, mission.scheduled_date);
    
    console.log('🔐 Generated security code:', securityCode);
    res.json({ success: true, data: { securityCode } });
  } catch (err) {
    console.error('GET security code error:', err);
    res.status(500).json({ success: false, message: 'Erreur lors de la génération du code de sécurité' });
  }
});

// PUT update mission
router.put('/:id', async (req, res) => {
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

module.exports = router;