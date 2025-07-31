const express = require('express');
const router = express.Router();
const db = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/complaints');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'complaint-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image, PDF and document files are allowed!'));
    }
  }
});

// Get all complaints with pagination and filtering
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status = '', search = '', shipper_id = '' } = req.query;
    const offset = (page - 1) * limit;
    
    // Get user from request headers (assuming user info is passed in headers)
    const userEmail = req.headers['user-email'];
    const userRole = req.headers['user-role'];
    
    console.log('👤 User requesting complaints:', { email: userEmail, role: userRole });
    
    let query = `
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
    `;
    
    const queryParams = [];
    const conditions = [];
    
    // Role-based filtering
    if ((userRole === 'expediteur' || userRole === 'Expéditeur') && userEmail) {
      // Expéditeurs can only see their own complaints
      conditions.push(`s.email = $${queryParams.length + 1}`);
      queryParams.push(userEmail);
      console.log('🔒 Filtering complaints for expediteur:', userEmail);
    }
    // Admins, finance, commercial can see all complaints (no additional filter)
    
    if (status) {
      conditions.push(`c.status = $${queryParams.length + 1}`);
      queryParams.push(status);
    }
    
    if (search) {
      conditions.push(`(c.subject ILIKE $${queryParams.length + 1} OR c.description ILIKE $${queryParams.length + 1} OR s.name ILIKE $${queryParams.length + 1})`);
      queryParams.push(`%${search}%`);
    }
    
    if (shipper_id) {
      conditions.push(`c.client_id = $${queryParams.length + 1}`);
      queryParams.push(shipper_id);
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    query += ` ORDER BY c.created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit, offset);
    
    console.log('🔍 Final query:', query);
    console.log('🔍 Query params:', queryParams);
    
    const result = await db.query(query, queryParams);
    
    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) 
      FROM complaints c
      LEFT JOIN shippers s ON c.client_id = s.id
    `;
    const countParams = [];
    const countConditions = [];
    
    // Apply same role-based filtering to count query
    if ((userRole === 'expediteur' || userRole === 'Expéditeur') && userEmail) {
      countConditions.push(`s.email = $${countParams.length + 1}`);
      countParams.push(userEmail);
    }
    
    if (status) {
      countConditions.push(`c.status = $${countParams.length + 1}`);
      countParams.push(status);
    }
    
    if (search) {
      countConditions.push(`(c.subject ILIKE $${countParams.length + 1} OR c.description ILIKE $${countParams.length + 1} OR s.name ILIKE $${countParams.length + 1})`);
      countParams.push(`%${search}%`);
    }
    
    if (shipper_id) {
      countConditions.push(`c.client_id = $${countParams.length + 1}`);
      countParams.push(shipper_id);
    }
    
    if (countConditions.length > 0) {
      countQuery += ` WHERE ${countConditions.join(' AND ')}`;
    }
    
    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);
    
    console.log('📊 Total complaints found:', total);
    console.log('📊 Complaints returned:', result.rows.length);
    
    res.json({
      success: true,
      data: {
        complaints: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get complaints error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch complaints'
    });
  }
});

// Get complaints for a commercial's assigned shippers
router.get('/commercial/:commercialId', async (req, res) => {
  try {
    const { commercialId } = req.params;
    const { page = 1, limit = 10, status = '', search = '' } = req.query;
    const offset = (page - 1) * limit;
    
    console.log('🔍 Fetching complaints for commercial ID:', commercialId);
    
    // Get complaints for all shippers assigned to this commercial
    let query = `
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
      WHERE s.commercial_id = $1
    `;
    
    const queryParams = [commercialId];
    const conditions = [];
    
    if (status) {
      conditions.push(`c.status = $${queryParams.length + 1}`);
      queryParams.push(status);
    }
    
    if (search) {
      conditions.push(`(c.subject ILIKE $${queryParams.length + 1} OR c.description ILIKE $${queryParams.length + 1} OR s.name ILIKE $${queryParams.length + 1})`);
      queryParams.push(`%${search}%`);
    }
    
    if (conditions.length > 0) {
      query += ` AND ${conditions.join(' AND ')}`;
    }
    
    query += ` ORDER BY c.created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit, offset);
    
    console.log('🔍 Commercial complaints query:', query);
    console.log('🔍 Query params:', queryParams);
    
    const result = await db.query(query, queryParams);
    
    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) 
      FROM complaints c
      LEFT JOIN shippers s ON c.client_id = s.id
      WHERE s.commercial_id = $1
    `;
    const countParams = [commercialId];
    const countConditions = [];
    
    if (status) {
      countConditions.push(`c.status = $${countParams.length + 1}`);
      countParams.push(status);
    }
    
    if (search) {
      countConditions.push(`(c.subject ILIKE $${countParams.length + 1} OR c.description ILIKE $${countParams.length + 1} OR s.name ILIKE $${countParams.length + 1})`);
      countParams.push(`%${search}%`);
    }
    
    if (countConditions.length > 0) {
      countQuery += ` AND ${countConditions.join(' AND ')}`;
    }
    
    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);
    
    console.log('📊 Total commercial complaints found:', total);
    console.log('📊 Commercial complaints returned:', result.rows.length);
    
    res.json({
      success: true,
      data: {
        complaints: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get commercial complaints error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch commercial complaints'
    });
  }
});

// Get complaints for a specific expéditeur
router.get('/expediteur/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    const query = `
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
      WHERE s.email = $1
      ORDER BY c.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const result = await db.query(query, [email, limit, offset]);
    
    // Get total count
    const countQuery = `
      SELECT COUNT(*) 
      FROM complaints c
      LEFT JOIN shippers s ON c.client_id = s.id
      WHERE s.email = $1
    `;
    const countResult = await db.query(countQuery, [email]);
    const total = parseInt(countResult.rows[0].count);
    
    res.json({
      success: true,
      data: {
        complaints: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get expediteur complaints error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expediteur complaints'
    });
  }
});

// Get single complaint by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
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
      WHERE c.id = $1
    `;
    
    const result = await db.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Get complaint error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch complaint'
    });
  }
});

// Create new complaint (from home page form)
router.post('/', upload.array('attachments', 5), async (req, res) => {
  try {
    const { 
      order_number, 
      email, 
      full_name, 
      subject, 
      description, 
      parcel_id = null 
    } = req.body;
    
    // Validate required fields
    if (!email || !full_name || !subject || !description) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Find or create shipper based on email
    let shipperResult = await db.query('SELECT id FROM shippers WHERE email = $1', [email]);
    let client_id;
    
    if (shipperResult.rows.length === 0) {
      // Generate unique code for new shipper
      const codeResult = await db.query('SELECT COUNT(*) FROM shippers');
      const shipperCount = parseInt(codeResult.rows[0].count) + 1;
      const code = `EXP${shipperCount.toString().padStart(3, '0')}`;
      
      // Create new shipper if doesn't exist
      const newShipperResult = await db.query(
        'INSERT INTO shippers (code, name, email, phone) VALUES ($1, $2, $3, $4) RETURNING id',
        [code, full_name, email, req.body.phone || null]
      );
      client_id = newShipperResult.rows[0].id;
    } else {
      client_id = shipperResult.rows[0].id;
    }
    
    // Find parcel by tracking number if provided
    let parcel_id_final = parcel_id;
    if (order_number && !parcel_id) {
      const parcelResult = await db.query(
        'SELECT id FROM parcels WHERE tracking_number = $1',
        [order_number]
      );
      if (parcelResult.rows.length > 0) {
        parcel_id_final = parcelResult.rows[0].id;
      }
    }
    
    // Handle file uploads
    const attachments = req.files ? req.files.map(file => file.filename) : [];
    const attachmentNames = req.files ? req.files.map(file => file.originalname) : [];
    
    // Create complaint
    const complaintResult = await db.query(
      `INSERT INTO complaints (
        client_id, 
        subject, 
        description, 
        status, 
        attachments,
        attachment_names
      ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [
        client_id,
        subject,
        description,
        'En attente',
        attachments,
        attachmentNames
      ]
    );
    
    res.json({
      success: true,
      message: 'Complaint submitted successfully',
      data: {
        id: complaintResult.rows[0].id
      }
    });
  } catch (error) {
    console.error('Create complaint error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create complaint'
    });
  }
});

// Update complaint status (admin/management)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, assigned_to, resolution_notes } = req.body;
    
    const updateFields = [];
    const queryParams = [];
    
    if (status) {
      updateFields.push(`status = $${queryParams.length + 1}`);
      queryParams.push(status);
    }
    
    if (assigned_to) {
      updateFields.push(`assigned_to = $${queryParams.length + 1}`);
      queryParams.push(assigned_to);
    }
    
    if (resolution_notes) {
      updateFields.push(`resolution_notes = $${queryParams.length + 1}`);
      queryParams.push(resolution_notes);
    }
    
    if (status === 'Traitée') {
      updateFields.push(`resolution_date = CURRENT_TIMESTAMP`);
    }
    
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    
    queryParams.push(id);
    
    const query = `
      UPDATE complaints 
      SET ${updateFields.join(', ')}
      WHERE id = $${queryParams.length}
      RETURNING *
    `;
    
    const result = await db.query(query, queryParams);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Complaint updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Update complaint error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update complaint'
    });
  }
});

// Delete complaint
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get complaint to find attachments
    const complaintResult = await db.query('SELECT attachments FROM complaints WHERE id = $1', [id]);
    
    if (complaintResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }
    
    // Delete attachment files
    const attachments = complaintResult.rows[0].attachments || [];
    for (const filename of attachments) {
      const filePath = path.join(__dirname, '../uploads/complaints', filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    // Delete complaint
    await db.query('DELETE FROM complaints WHERE id = $1', [id]);
    
    res.json({
      success: true,
      message: 'Complaint deleted successfully'
    });
  } catch (error) {
    console.error('Delete complaint error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete complaint'
    });
  }
});

module.exports = router; 