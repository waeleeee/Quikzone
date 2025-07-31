const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all payments
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT p.*, s.name as shipper_name
      FROM payments p
      LEFT JOIN shippers s ON p.shipper_id = s.id
      ORDER BY p.created_at DESC
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payments'
    });
  }
});

// Test endpoint to check shippers
router.get('/test-shippers', async (req, res) => {
  try {
    const result = await db.query('SELECT id, name, email FROM shippers ORDER BY id');
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Test shippers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shippers'
    });
  }
});

// Get payments for a specific shipper (by ID)
router.get('/shipper/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(`
      SELECT p.*, s.name as shipper_name
      FROM payments p
      LEFT JOIN shippers s ON p.shipper_id = s.id
      WHERE p.shipper_id = $1
      ORDER BY p.created_at DESC
    `, [id]);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get shipper payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shipper payments'
    });
  }
});

// Get payments for a specific expéditeur (by email)
router.get('/expediteur/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const { page = 1, limit = 1000, search = '', status = '' } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT 
        p.*,
        s.name as shipper_name,
        s.email as shipper_email,
        s.phone as shipper_phone,
        s.company as shipper_company
      FROM payments p
      LEFT JOIN shippers s ON p.shipper_id = s.id
      WHERE s.email = $1
    `;
    const queryParams = [email];
    
    if (search) {
      query += ` AND (p.reference ILIKE $2 OR p.payment_method ILIKE $2 OR s.name ILIKE $2)`;
      queryParams.push(`%${search}%`);
    }
    
    if (status) {
      query += ` AND p.status = $${queryParams.length + 1}`;
      queryParams.push(status);
    }
    
    query += ` ORDER BY p.created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit, offset);
    
    const result = await db.query(query, queryParams);
    
    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) 
      FROM payments p
      LEFT JOIN shippers s ON p.shipper_id = s.id
      WHERE s.email = $1
    `;
    const countParams = [email];
    
    if (search) {
      countQuery += ` AND (p.reference ILIKE $2 OR p.payment_method ILIKE $2 OR s.name ILIKE $2)`;
      countParams.push(`%${search}%`);
    }
    
    if (status) {
      countQuery += ` AND p.status = $${countParams.length + 1}`;
      countParams.push(status);
    }
    
    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);
    
    res.json({
      success: true,
      data: {
        payments: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get expediteur payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expediteur payments'
    });
  }
});

// Create new payment
router.post('/', async (req, res) => {
  try {
    const { 
      shipper_id, 
      amount, 
      payment_method, 
      reference, 
      status, 
      payment_date,
      // New payment type specific fields
      card_date,
      card_number,
      check_date,
      check_number,
      transfer_date,
      transfer_reference,
      cash_date,
      // Parcel IDs to update status
      parcel_ids
    } = req.body;
    
    console.log('Creating payment with data:', req.body);
    console.log('shipper_id type:', typeof shipper_id, 'value:', shipper_id);
    
    // Validate required fields
    if (!shipper_id || !amount || !payment_method) {
      console.log('Missing required fields:', { shipper_id, amount, payment_method });
      return res.status(400).json({
        success: false,
        message: 'shipper_id, amount, and payment_method are required'
      });
    }
    
    // Validate payment type specific fields
    if (payment_method === 'credit_card' && (!card_date || !card_number)) {
      return res.status(400).json({
        success: false,
        message: 'card_date and card_number are required for credit card payments'
      });
    }
    
    if (payment_method === 'check' && (!check_date || !check_number)) {
      return res.status(400).json({
        success: false,
        message: 'check_date and check_number are required for check payments'
      });
    }
    
    if (payment_method === 'bank_transfer' && (!transfer_date || !transfer_reference)) {
      return res.status(400).json({
        success: false,
        message: 'transfer_date and transfer_reference are required for bank transfer payments'
      });
    }
    
    if (payment_method === 'cash' && !cash_date) {
      return res.status(400).json({
        success: false,
        message: 'cash_date is required for cash payments'
      });
    }
    
    // Check if shipper exists
    console.log('Checking if shipper exists with ID:', shipper_id);
    console.log('Shipper ID type:', typeof shipper_id);
    
    // Try to find the shipper with different approaches
    let shipperCheck;
    if (typeof shipper_id === 'string') {
      // If it's a string, try both string and integer comparison
      shipperCheck = await db.query('SELECT id, name FROM shippers WHERE id = $1 OR id = $2', [shipper_id, parseInt(shipper_id)]);
    } else {
      // If it's already a number, use it directly
      shipperCheck = await db.query('SELECT id, name FROM shippers WHERE id = $1', [shipper_id]);
    }
    
    console.log('Shipper check result:', shipperCheck.rows);
    console.log('All shippers in database:');
    const allShippers = await db.query('SELECT id, name FROM shippers ORDER BY id');
    console.log(allShippers.rows);
    
    if (shipperCheck.rows.length === 0) {
      console.log('Shipper not found with ID:', shipper_id);
      return res.status(404).json({
        success: false,
        message: 'Shipper not found'
      });
    }
    
    // Insert the payment with new fields
    console.log('Inserting payment with values:', {
      shipper_id,
      amount,
      date: payment_date || new Date().toISOString().split('T')[0],
      payment_method,
      reference: reference || null,
      status: status || 'En attente',
      card_date,
      card_number,
      check_date,
      check_number,
      transfer_date,
      transfer_reference,
      cash_date
    });
    
    const result = await db.query(`
      INSERT INTO payments (
        shipper_id, 
        amount, 
        date,
        payment_method, 
        reference, 
        status,
        card_date,
        card_number,
        check_date,
        check_number,
        transfer_date,
        transfer_reference,
        cash_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, [
      shipper_id,
      amount,
      payment_date || new Date().toISOString().split('T')[0],
      payment_method,
      reference || null,
      status || 'En attente',
      card_date || null,
      card_number || null,
      check_date || null,
      check_number || null,
      transfer_date || null,
      transfer_reference || null,
      cash_date || null
    ]);
    
    console.log('Payment inserted successfully:', result.rows[0]);
    
    // Update parcel statuses if parcel_ids are provided
    if (parcel_ids && Array.isArray(parcel_ids) && parcel_ids.length > 0) {
      try {
        console.log('📦 Updating parcel statuses for payment:', parcel_ids);
        
        // First, check what statuses the parcels currently have
        const parcelStatusCheck = await db.query(`
          SELECT id, status FROM parcels WHERE id = ANY($1)
        `, [parcel_ids]);
        
        console.log('📦 Current parcel statuses:', parcelStatusCheck.rows);
        
        // Update parcels from "Livré" or "Retour" to "Livré payé"
        const parcelUpdateResult = await db.query(`
          UPDATE parcels 
          SET status = 'Livré payé', updated_at = CURRENT_TIMESTAMP
          WHERE id = ANY($1) AND status IN ('Livré', 'Retour', 'delivered', 'returned', 'livré', 'retour')
          RETURNING id, status
        `, [parcel_ids]);
        
        console.log(`✅ Updated ${parcelUpdateResult.rows.length} parcels to 'Livré payé'`);
        console.log('Updated parcels:', parcelUpdateResult.rows);
        
        if (parcelUpdateResult.rows.length === 0) {
          console.log('⚠️ No parcels were updated. This might be because:');
          console.log('   - Parcels don\'t have the expected status');
          console.log('   - Parcel IDs don\'t exist');
          console.log('   - Status values are different than expected');
        }
      } catch (parcelError) {
        console.error('⚠️ Error updating parcel statuses:', parcelError);
        console.error('⚠️ Parcel error details:', parcelError.message);
        // Don't fail the payment creation if parcel update fails
      }
    }
    
    // Get the created payment with shipper name
    const paymentWithShipper = await db.query(`
      SELECT p.*, s.name as shipper_name
      FROM payments p
      LEFT JOIN shippers s ON p.shipper_id = s.id
      WHERE p.id = $1
    `, [result.rows[0].id]);
    
    const responseData = {
      success: true,
      message: 'Payment created successfully',
      data: paymentWithShipper.rows[0]
    };
    
    console.log('📤 Sending response to frontend:', responseData);
    
    res.status(201).json(responseData);
  } catch (error) {
    console.error('Create payment error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Failed to create payment',
      error: error.message
    });
  }
});

// Delete payment
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if payment exists
    const paymentCheck = await db.query('SELECT * FROM payments WHERE id = $1', [id]);
    if (paymentCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }
    
    // Delete the payment
    const result = await db.query('DELETE FROM payments WHERE id = $1 RETURNING *', [id]);
    
    res.json({
      success: true,
      message: 'Payment deleted successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Delete payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete payment'
    });
  }
});

module.exports = router; 