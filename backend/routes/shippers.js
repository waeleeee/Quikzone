const express = require('express');
const router = express.Router();
const db = require('../config/database');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    cb(null, `${base}-${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

// Get all shippers
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;
    
    console.log('🔍 Shippers API - User role:', req.user?.role);
    console.log('🔍 Shippers API - User email:', req.user?.email);
    
    let query = `
      SELECT s.*,
             CASE WHEN s.password IS NOT NULL THEN true ELSE false END as has_password,
             COALESCE(total_parcels.count, 0) as total_parcels,
             COALESCE(delivered_parcels.count, 0) as delivered_parcels,
             COALESCE(returned_parcels.count, 0) as returned_parcels
      FROM shippers s
      LEFT JOIN (
        SELECT shipper_id, COUNT(*) as count 
        FROM parcels 
        GROUP BY shipper_id
      ) total_parcels ON s.id = total_parcels.shipper_id
      LEFT JOIN (
        SELECT shipper_id, COUNT(*) as count 
        FROM parcels 
        WHERE status = 'lives'
        GROUP BY shipper_id
      ) delivered_parcels ON s.id = delivered_parcels.shipper_id
      LEFT JOIN (
        SELECT shipper_id, COUNT(*) as count 
        FROM parcels 
        WHERE status IN ('retour_definitif', 'retour_expediteur', 'retour_en_cours_expedition', 'retour_recu')
        GROUP BY shipper_id
      ) returned_parcels ON s.id = returned_parcels.shipper_id
      WHERE 1=1
    `;
    const queryParams = [];
    
    // Filter by user role
    if (req.user?.role === 'Chef d\'agence' || req.user?.role === 'Membre d\'agence') {
      console.log('🔍 Filtering shippers for Chef d\'agence/Membre d\'agence');
      
      // Get user's agency from agency_managers table
      const agencySqlQuery = `
        SELECT agency FROM agency_managers 
        WHERE email = $${queryParams.length + 1}
      `;
      const agencyResult = await db.query(agencySqlQuery, [req.user.email]);
      
      if (agencyResult.rows.length > 0) {
        const userAgency = agencyResult.rows[0].agency;
        console.log('🔍 User agency:', userAgency);
        
        // Filter shippers by agency
        if (userAgency) {
          query += ` AND s.agency = $${queryParams.length + 1}`;
          queryParams.push(userAgency);
          console.log('🔍 Added agency filter:', userAgency);
        }
      } else {
        console.log('⚠️ No agency manager data found for user:', req.user.email);
        // If no agency data, show no shippers for security
        query += ` AND 1=0`;
      }
    } else if (req.user?.role === 'Commercial') {
      console.log('🔍 Filtering shippers for Commercial');
      
      // Get commercial's assigned shippers
      const commercialSqlQuery = `
        SELECT id FROM commercials 
        WHERE email = $${queryParams.length + 1}
      `;
      const commercialResult = await db.query(commercialSqlQuery, [req.user.email]);
      
      if (commercialResult.rows.length > 0) {
        const commercialId = commercialResult.rows[0].id;
        console.log('🔍 Commercial ID:', commercialId);
        
        // Filter shippers by commercial_id
        query += ` AND s.commercial_id = $${queryParams.length + 1}`;
        queryParams.push(commercialId);
        console.log('🔍 Added commercial filter:', commercialId);
      } else {
        console.log('⚠️ No commercial data found for user:', req.user.email);
        // If no commercial data, show no shippers for security
        query += ` AND 1=0`;
      }
    } else if (req.user?.role === 'Expéditeur') {
      console.log('🔍 Filtering shippers for Expéditeur - showing only their own data');
      
      // Expéditeur can only see their own data
      query += ` AND s.email = $${queryParams.length + 1}`;
      queryParams.push(req.user.email);
      console.log('🔍 Added email filter for expéditeur:', req.user.email);
    }
    // Admin users can see all shippers (no additional filter)
    
    if (search) {
      query += ` AND (s.name ILIKE $${queryParams.length + 1} OR s.email ILIKE $${queryParams.length + 1} OR s.code ILIKE $${queryParams.length + 1})`;
      queryParams.push(`%${search}%`);
    }
    query += ` ORDER BY s.created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit, offset);
    const result = await db.query(query, queryParams);
    
    // Debug: Log the results to see if parcel statistics are included
    console.log('=== SHIPPERS QUERY DEBUG ===');
    console.log('Query:', query);
    console.log('Query params:', queryParams);
    console.log('Result rows count:', result.rows.length);
    if (result.rows.length > 0) {
      console.log('First shipper sample:', {
        id: result.rows[0].id,
        name: result.rows[0].name,
        total_parcels: result.rows[0].total_parcels,
        delivered_parcels: result.rows[0].delivered_parcels,
        returned_parcels: result.rows[0].returned_parcels
      });
    }
    
    // Get total count
    let countQuery = `SELECT COUNT(*) FROM shippers WHERE 1=1`;
    const countParams = [];
    
    // Apply the same filtering logic to count query
    if (req.user?.role === 'Chef d\'agence' || req.user?.role === 'Membre d\'agence') {
      // Get user's agency from agency_managers table
      const agencyCountSqlQuery = `
        SELECT agency FROM agency_managers 
        WHERE email = $${countParams.length + 1}
      `;
      const agencyResult = await db.query(agencyCountSqlQuery, [req.user.email]);
      
      if (agencyResult.rows.length > 0) {
        const userAgency = agencyResult.rows[0].agency;
        
        // Filter shippers by agency
        if (userAgency) {
          countQuery += ` AND agency = $${countParams.length + 1}`;
          countParams.push(userAgency);
        }
      } else {
        // If no agency data, show no shippers for security
        countQuery += ` AND 1=0`;
      }
    } else if (req.user?.role === 'Commercial') {
      // Get commercial's assigned shippers
      const commercialCountSqlQuery = `
        SELECT id FROM commercials 
        WHERE email = $${countParams.length + 1}
      `;
      const commercialResult = await db.query(commercialCountSqlQuery, [req.user.email]);
      
      if (commercialResult.rows.length > 0) {
        const commercialId = commercialResult.rows[0].id;
        
        // Filter shippers by commercial_id
        countQuery += ` AND commercial_id = $${countParams.length + 1}`;
        countParams.push(commercialId);
      } else {
        // If no commercial data, show no shippers for security
        countQuery += ` AND 1=0`;
      }
    } else if (req.user?.role === 'Expéditeur') {
      // Expéditeur can only see their own data
      countQuery += ` AND email = $${countParams.length + 1}`;
      countParams.push(req.user.email);
    }
    // Admin users can see all shippers (no additional filter)
    
    if (search) {
      countQuery += ` AND (name ILIKE $${countParams.length + 1} OR email ILIKE $${countParams.length + 1} OR code ILIKE $${countParams.length + 1})`;
      countParams.push(`%${search}%`);
    }
    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);
    res.json({
      success: true,
      data: {
        shippers: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get shippers error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch shippers' });
  }
});

// Get shipper by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query('SELECT * FROM shippers WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Shipper not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Get shipper error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shipper'
    });
  }
});

// Create new shipper (with file upload)
router.post('/', upload.fields([
  { name: 'id_document', maxCount: 1 },
  { name: 'company_documents', maxCount: 1 }
]), async (req, res) => {
  try {
    // Log the incoming data for debugging
    console.log('Create shipper request:', {
      body: req.body,
      bodyKeys: Object.keys(req.body),
      files: req.files,
      headers: req.headers['content-type']
    });

    // Debug: Log all body fields individually
    console.log('=== BODY FIELDS DEBUG ===');
    Object.keys(req.body).forEach(key => {
      console.log(`${key}:`, req.body[key], `(type: ${typeof req.body[key]})`);
    });

    // Extract values from req.body, handling both single values and arrays
    const extractValue = (value) => {
      if (Array.isArray(value)) {
        return value[0]; // Take the first value if it's an array
      }
      return value;
    };

    const password = extractValue(req.body.password);
    const name = extractValue(req.body.name);
    const email = extractValue(req.body.email);
    const phone = extractValue(req.body.phone);
    const agency = extractValue(req.body.agency);
    const commercial_id = extractValue(req.body.commercial_id);
    const delivery_fees = extractValue(req.body.delivery_fees);
    const return_fees = extractValue(req.body.return_fees);
    const status = extractValue(req.body.status);
    const identity_number = extractValue(req.body.identity_number);
    const company_name = extractValue(req.body.company_name);
    const fiscal_number = extractValue(req.body.fiscal_number);
    const company_address = extractValue(req.body.company_address);
    const company_governorate = extractValue(req.body.company_governorate);
    const address = extractValue(req.body.address);
    const governorate = extractValue(req.body.governorate);
    const page_name = extractValue(req.body.page_name);
    const formType = extractValue(req.body.formType);
    
    // Debug: Log specific required fields
    console.log('Required fields check:');
    console.log('name:', name, 'type:', typeof name);
    console.log('email:', email, 'type:', typeof email);
    console.log('password:', password, 'type:', typeof password);
    console.log('formType:', formType, 'type:', typeof formType);
    
    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, email, and password are required' 
      });
    }

    // Validate form type specific fields
    if (formType === 'individual') {
      if (!identity_number) {
        return res.status(400).json({
          success: false,
          message: 'Numéro d\'identité is required for individual shippers'
        });
      }
      if (!address) {
        return res.status(400).json({
          success: false,
          message: 'Adresse is required for individual shippers'
        });
      }
      if (!governorate) {
        return res.status(400).json({
          success: false,
          message: 'Gouvernorat is required for individual shippers'
        });
      }
      if (!page_name) {
        return res.status(400).json({
          success: false,
          message: 'Nom de page is required for individual shippers'
        });
      }
    } else if (formType === 'company') {
      if (!company_name || !fiscal_number || !company_address || !company_governorate) {
        return res.status(400).json({
          success: false,
          message: 'Company name, fiscal number, address, and governorate are required for company shippers'
        });
      }
    }

    // Check if email already exists
    const existingEmail = await db.query('SELECT id FROM shippers WHERE email = $1', [email]);
    if (existingEmail.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'A shipper with this email already exists' 
      });
    }
    
    // Check if user already exists
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    console.log('🔐 Hashing password...');
    console.log('Password value:', password, 'Type:', typeof password);
    
    // Ensure password is a string
    if (typeof password !== 'string') {
      console.error('Password is not a string:', password);
      return res.status(400).json({
        success: false,
        message: 'Password must be a string'
      });
    }
    
    if (!password.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Password cannot be empty'
      });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('✅ Password hashed successfully');

    // Auto-generate code: EXP001, EXP002, etc.
    const codeResult = await db.query('SELECT MAX(CAST(SUBSTRING(code FROM 4) AS INTEGER)) as max_num FROM shippers WHERE code LIKE \'EXP%\'');
    const maxNum = codeResult.rows[0].max_num || 0;
    const nextNum = maxNum + 1;
    const code = `EXP${nextNum.toString().padStart(3, '0')}`;
    
    // Handle file uploads
    const id_document = req.files && req.files['id_document'] ? req.files['id_document'][0].filename : null;
    const company_documents = req.files && req.files['company_documents'] ? req.files['company_documents'][0].filename : null;
    
    // Start transaction
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      
      // Generate unique username
      let username = email.split('@')[0];
      let counter = 1;
      let uniqueUsername = username;
      while (true) {
        const existing = await client.query('SELECT id FROM users WHERE username = $1', [uniqueUsername]);
        if (existing.rows.length === 0) break;
        uniqueUsername = username + counter;
        counter++;
      }
      
      const firstName = name.split(' ')[0] || name;
      const lastName = name.split(' ').slice(1).join(' ') || firstName;
      
      // Create user account
      const userResult = await client.query(`
        INSERT INTO users (username, email, password_hash, first_name, last_name, is_active, role)
        VALUES ($1, $2, $3, $4, $5, true, $6)
        RETURNING id
      `, [uniqueUsername, email, hashedPassword, firstName, lastName, 'Expéditeur']);
      
      // Assign "Expéditeur" role
      const roleResult = await client.query('SELECT id FROM roles WHERE name = $1', ['Expéditeur']);
      if (roleResult.rows.length > 0) {
        await client.query(`
          INSERT INTO user_roles (user_id, role_id)
          VALUES ($1, $2)
        `, [userResult.rows[0].id, roleResult.rows[0].id]);
      }
      
      // Prepare values with proper type conversion
      const values = [
        code,
        hashedPassword,
        name,
        email,
        phone || null,
        agency || null,
        commercial_id ? parseInt(commercial_id) : null,
        delivery_fees ? parseFloat(delivery_fees) : 8,
        return_fees ? parseFloat(return_fees) : 0,
        status || 'Actif',
        identity_number || null,
        id_document,
        company_name || null,
        fiscal_number || null,
        company_address || null,
        company_governorate || null,
        company_documents,
        company_name || null, // Also set the old company field for backward compatibility
        address || null,
        governorate || null,
        page_name || null
      ];

      console.log('Insert values:', values);
      
      const result = await client.query(`
        INSERT INTO shippers (
          code, password, name, email, phone, agency, commercial_id,
          delivery_fees, return_fees, status, identity_number, id_document, company_name, fiscal_number,
          company_address, company_governorate, company_documents, company, address, governorate, page_name, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, NOW(), NOW()
        ) RETURNING *
      `, values);

      await client.query('COMMIT');
      
      console.log('✅ Shipper created successfully');
      
      res.status(201).json({ 
        success: true, 
        data: result.rows[0], 
        message: 'Shipper created successfully' 
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Create shipper error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint
    });
    
    // Send more specific error messages
    let errorMessage = 'Failed to create shipper';
    if (error.code === '23505') { // Unique violation
      errorMessage = 'A shipper with this email or code already exists';
    } else if (error.code === '23503') { // Foreign key violation
      errorMessage = 'Invalid commercial or agency reference';
    } else if (error.message) {
      errorMessage = error.message;
    }

    res.status(500).json({ 
      success: false, 
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update shipper
router.put('/:id', upload.fields([
  { name: 'id_document', maxCount: 1 },
  { name: 'company_documents', maxCount: 1 }
]), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Extract values from req.body, handling both single values and arrays
    const extractValue = (value) => {
      if (Array.isArray(value)) {
        return value[0]; // Take the first value if it's an array
      }
      return value;
    };

    const code = extractValue(req.body.code);
    const password = extractValue(req.body.password);
    const name = extractValue(req.body.name);
    const email = extractValue(req.body.email);
    const phone = extractValue(req.body.phone);
    const agency = extractValue(req.body.agency);
    const commercial_id = extractValue(req.body.commercial_id);
    const delivery_fees = extractValue(req.body.delivery_fees);
    const return_fees = extractValue(req.body.return_fees);
    const status = extractValue(req.body.status);
    const identity_number = extractValue(req.body.identity_number);
    const company_name = extractValue(req.body.company_name);
    const fiscal_number = extractValue(req.body.fiscal_number);
    const company_address = extractValue(req.body.company_address);
    const company_governorate = extractValue(req.body.company_governorate);
    const address = extractValue(req.body.address);
    const governorate = extractValue(req.body.governorate);
    const page_name = extractValue(req.body.page_name);
    const formType = extractValue(req.body.formType);
    
    console.log('=== EXTRACTED COMPANY FIELDS DEBUG ===');
    console.log('company_name:', company_name, 'type:', typeof company_name);
    console.log('fiscal_number:', fiscal_number, 'type:', typeof fiscal_number);
    console.log('company_address:', company_address, 'type:', typeof company_address);
    console.log('company_governorate:', company_governorate, 'type:', typeof company_governorate);
    console.log('formType:', formType, 'type:', typeof formType);

    console.log('Update shipper request:', { 
      id, 
      body: req.body, 
      bodyKeys: Object.keys(req.body),
      files: req.files 
    });
    
    // Debug: Log extracted values
    console.log('=== EXTRACTED VALUES DEBUG ===');
    console.log('name:', name, 'type:', typeof name);
    console.log('email:', email, 'type:', typeof email);
    console.log('password:', password, 'type:', typeof password);
    console.log('formType:', formType, 'type:', typeof formType);

    // Validate required fields based on form type
    if (formType === 'individual') {
      if (!identity_number) {
        return res.status(400).json({
          success: false,
          message: 'Numéro d\'identité is required for individual shippers'
        });
      }
      if (!address) {
        return res.status(400).json({
          success: false,
          message: 'Adresse is required for individual shippers'
        });
      }
      if (!governorate) {
        return res.status(400).json({
          success: false,
          message: 'Gouvernorat is required for individual shippers'
        });
      }
      if (!page_name) {
        return res.status(400).json({
          success: false,
          message: 'Nom de page is required for individual shippers'
        });
      }
    } else if (formType === 'company') {
      if (!company_name || !fiscal_number || !company_address || !company_governorate) {
        return res.status(400).json({
          success: false,
          message: 'Company name, fiscal number, address, and governorate are required for company shippers'
        });
      }
    }

    // First check if the shipper exists
    const checkResult = await db.query('SELECT id, email FROM shippers WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Shipper not found'
      });
    }

    const currentShipper = checkResult.rows[0];
    let hashedPassword = null;

    // Hash password if provided
    if (password && password.trim()) {
      console.log('🔐 Hashing password...');
      hashedPassword = await bcrypt.hash(password, 10);
      console.log('✅ Password hashed successfully');
    }

    // Build dynamic update query - only update fields that are provided
    let updateFields = [];
    let updateValues = [];
    let paramIndex = 1;

    // Helper function to add field if value is provided
    const addField = (fieldName, value) => {
      console.log(`addField called: ${fieldName} = ${value} (type: ${typeof value})`);
      if (value !== undefined && value !== null && value !== '') {
        updateFields.push(`${fieldName} = $${paramIndex}`);
        updateValues.push(value);
        paramIndex++;
        console.log(`✅ Added field: ${fieldName} = $${paramIndex-1}`);
      } else {
        console.log(`❌ Skipped field: ${fieldName} (value: ${value})`);
      }
    };

    // Add fields that should be updated
    addField('code', code);
    if (hashedPassword) {
      addField('password', hashedPassword);
    }
    addField('name', name);
    addField('email', email);
    addField('phone', phone);
    addField('agency', agency);
    addField('commercial_id', commercial_id ? parseInt(commercial_id) : null);
    addField('delivery_fees', delivery_fees ? parseFloat(delivery_fees) : null);
    addField('return_fees', return_fees ? parseFloat(return_fees) : null);
    addField('status', status);
    
    // Add form type specific fields
    if (formType === 'individual') {
      console.log('=== INDIVIDUAL FORM TYPE DEBUG ===');
      console.log('identity_number:', identity_number, 'type:', typeof identity_number);
      console.log('company_name:', company_name, 'type:', typeof company_name);
      console.log('address:', address, 'type:', typeof address);
      
      addField('identity_number', identity_number);
      addField('address', address);
      addField('governorate', governorate);
      addField('page_name', page_name);
      // Clear company fields for individual
      updateFields.push(`company_name = NULL, fiscal_number = NULL, company_address = NULL, company_governorate = NULL, company = NULL`);
    } else if (formType === 'company') {
      addField('company_name', company_name);
      addField('fiscal_number', fiscal_number);
      addField('company_address', company_address);
      addField('company_governorate', company_governorate);
      // Also update the old company field for backward compatibility
      addField('company', company_name);
      // Clear individual fields for company
      updateFields.push(`identity_number = NULL`);
    }

    // Add file fields if files were uploaded
    if (req.files && req.files.id_document) {
      updateFields.push(`id_document = $${paramIndex}`);
      updateValues.push(req.files.id_document[0].filename);
      paramIndex++;
    }
    if (req.files && req.files.company_documents) {
      updateFields.push(`company_documents = $${paramIndex}`);
      updateValues.push(req.files.company_documents[0].filename);
      paramIndex++;
    }

    // Always update the updated_at timestamp
    updateFields.push(`updated_at = $${paramIndex}`);
    updateValues.push(new Date());
    paramIndex++;

    // Add the ID parameter
    updateValues.push(id);

    if (updateFields.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No fields to update. Please provide at least one field to modify.' 
      });
    }

    const setClause = updateFields.join(', ');
    const query = `UPDATE shippers SET ${setClause} WHERE id = $${paramIndex} RETURNING *`;

    console.log('Update query:', query);
    console.log('Update values:', updateValues);

    // Start transaction
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      const result = await client.query(query, updateValues);

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Shipper not found' });
      }

      // Update user account if password is provided
      if (hashedPassword) {
        const firstName = name.split(' ')[0] || name;
        const lastName = name.split(' ').slice(1).join(' ') || firstName;

        // Check if user exists
        const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [email]);
        
        if (existingUser.rows.length > 0) {
          // Update existing user
          await client.query(`
            UPDATE users 
            SET password_hash = $1, first_name = $2, last_name = $3, is_active = true
            WHERE email = $4
          `, [hashedPassword, firstName, lastName, email]);
        } else {
          // Create new user
          let username = email.split('@')[0];
          let counter = 1;
          let uniqueUsername = username;
          while (true) {
            const existing = await client.query('SELECT id FROM users WHERE username = $1', [uniqueUsername]);
            if (existing.rows.length === 0) break;
            uniqueUsername = username + counter;
            counter++;
          }

          const userResult = await client.query(`
            INSERT INTO users (username, email, password_hash, first_name, last_name, is_active, role)
            VALUES ($1, $2, $3, $4, $5, true, $6)
            RETURNING id
          `, [uniqueUsername, email, hashedPassword, firstName, lastName, 'Expéditeur']);

          // Assign "Expéditeur" role
          const roleResult = await client.query('SELECT id FROM roles WHERE name = $1', ['Expéditeur']);
          if (roleResult.rows.length > 0) {
            await client.query(`
              INSERT INTO user_roles (user_id, role_id)
              VALUES ($1, $2)
            `, [userResult.rows[0].id, roleResult.rows[0].id]);
          }
        }
      }

      await client.query('COMMIT');
      
      console.log('✅ Shipper updated successfully');
      
      res.json({ 
        success: true, 
        data: result.rows[0], 
        message: 'Shipper updated successfully' 
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Update shipper error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint
    });
    
    // Send more specific error messages
    let errorMessage = 'Failed to update shipper';
    if (error.code === '23505') { // Unique violation
      errorMessage = 'A shipper with this email or code already exists';
    } else if (error.code === '23503') { // Foreign key violation
      errorMessage = 'Invalid commercial or agency reference';
    } else if (error.message) {
      errorMessage = error.message;
    }

    res.status(500).json({ 
      success: false, 
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Delete shipper with automatic dependency cleanup
router.delete('/:id/with-dependencies', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get shipper info before deletion
    const shipperResult = await db.query('SELECT id, name, email FROM shippers WHERE id = $1', [id]);
    if (shipperResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Shipper not found'
      });
    }
    
    const shipper = shipperResult.rows[0];
    const shipperEmail = shipper.email;
    
    // Start transaction for complete deletion
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      
      let deletedPayments = 0;
      let deletedParcels = 0;
      let deletedInvoices = 0;
      let deletedMissionParcels = 0;
      let deletedComplaints = 0;
      let deletedParcelTimeline = 0;
      
      // 1. Delete complaints first (referenced by client_id)
      const complaintsResult = await client.query('DELETE FROM complaints WHERE client_id = $1 RETURNING id', [id]);
      deletedComplaints = complaintsResult.rows.length;
      
      // 2. Delete parcel_timeline (referenced by parcel_id)
      const parcelTimelineResult = await client.query(`
        DELETE FROM parcel_timeline 
        WHERE parcel_id IN (SELECT id FROM parcels WHERE shipper_id = $1)
        RETURNING id
      `, [id]);
      deletedParcelTimeline = parcelTimelineResult.rows.length;
      
      // 3. Delete mission_parcels (referenced by parcels)
      const missionParcelsResult = await client.query(`
        DELETE FROM mission_parcels 
        WHERE parcel_id IN (SELECT id FROM parcels WHERE shipper_id = $1)
        RETURNING id
      `, [id]);
      deletedMissionParcels = missionParcelsResult.rows.length;
      
      // 4. Delete invoices that reference payments
      const invoicesResult = await client.query(`
        DELETE FROM invoices 
        WHERE payment_id IN (SELECT id FROM payments WHERE shipper_id = $1)
        RETURNING id
      `, [id]);
      deletedInvoices = invoicesResult.rows.length;
      
      // 5. Delete payments
      const paymentsResult = await client.query('DELETE FROM payments WHERE shipper_id = $1 RETURNING id', [id]);
      deletedPayments = paymentsResult.rows.length;
      
      // 6. Delete parcels
      const parcelsResult = await client.query('DELETE FROM parcels WHERE shipper_id = $1 RETURNING id', [id]);
      deletedParcels = parcelsResult.rows.length;
      
      // 5. Delete the shipper
      const deleteResult = await client.query('DELETE FROM shippers WHERE id = $1 RETURNING id', [id]);
      
      if (deleteResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'Shipper not found'
        });
      }
      
      // 6. Clean up associated user account
      const userResult = await client.query('SELECT id FROM users WHERE email = $1', [shipperEmail]);
      if (userResult.rows.length > 0) {
        const userId = userResult.rows[0].id;
        
        // Remove user roles first
        await client.query('DELETE FROM user_roles WHERE user_id = $1', [userId]);
        
        // Then delete the user
        await client.query('DELETE FROM users WHERE id = $1', [userId]);
      }
      
      await client.query('COMMIT');
      
      console.log(`✅ Shipper deleted with dependencies: ${shipper.name}`);
      
      res.json({
        success: true,
        message: 'Shipper deleted successfully with all dependencies',
        deletedPayments,
        deletedParcels,
        deletedInvoices,
        deletedMissionParcels,
        deletedComplaints,
        deletedParcelTimeline
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Delete shipper with dependencies error:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to delete shipper with dependencies';
    if (error.code === '23503') { // Foreign key violation
      errorMessage = 'Cannot delete shipper because there are related records that could not be removed.';
    }
    
    res.status(500).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Delete shipper (original route - kept for backward compatibility)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // First, check if there are any payments associated with this shipper
    const paymentsCheck = await db.query('SELECT COUNT(*) as count FROM payments WHERE shipper_id = $1', [id]);
    const hasPayments = parseInt(paymentsCheck.rows[0].count) > 0;
    
    if (hasPayments) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete shipper because there are payments associated with them. Please delete the payments first or contact support.'
      });
    }
    
    // Check if there are any parcels associated with this shipper
    const parcelsCheck = await db.query('SELECT COUNT(*) as count FROM parcels WHERE shipper_id = $1', [id]);
    const hasParcels = parseInt(parcelsCheck.rows[0].count) > 0;
    
    if (hasParcels) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete shipper because there are parcels associated with them. Please delete the parcels first or contact support.'
      });
    }
    
    // Get shipper email before deletion for user account cleanup
    const shipperResult = await db.query('SELECT email FROM shippers WHERE id = $1', [id]);
    if (shipperResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Shipper not found'
      });
    }
    
    const shipperEmail = shipperResult.rows[0].email;
    
    // Start transaction for deletion
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      
      // Delete the shipper
      const result = await client.query('DELETE FROM shippers WHERE id = $1 RETURNING id', [id]);
      
      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'Shipper not found'
        });
      }
      
      // Clean up associated user account
      const userResult = await client.query('SELECT id FROM users WHERE email = $1', [shipperEmail]);
      if (userResult.rows.length > 0) {
        const userId = userResult.rows[0].id;
        
        // Remove user roles first
        await client.query('DELETE FROM user_roles WHERE user_id = $1', [userId]);
        
        // Then delete the user
        await client.query('DELETE FROM users WHERE id = $1', [userId]);
        
        console.log(`✅ Deleted user account for shipper: ${shipperEmail}`);
      }
      
      await client.query('COMMIT');
      
      res.json({
        success: true,
        message: 'Shipper deleted successfully'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Delete shipper error:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to delete shipper';
    if (error.code === '23503') { // Foreign key violation
      errorMessage = 'Cannot delete shipper because there are related records (payments, parcels, etc.). Please delete related records first.';
    }
    
    res.status(500).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get shipper details with payments and parcels
router.get('/:id/details', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get shipper info
    const shipperResult = await db.query('SELECT * FROM shippers WHERE id = $1', [id]);
    
    if (shipperResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Shipper not found'
      });
    }
    
    const shipper = shipperResult.rows[0];
    
    // Get payments for this shipper
    const paymentsResult = await db.query(`
      SELECT * FROM payments 
      WHERE shipper_id = $1 
      ORDER BY date DESC 
      LIMIT 10
    `, [id]);
    
    // Get parcels for this shipper
    const parcelsResult = await db.query(`
      SELECT 
        id,
        tracking_number,
        destination,
        status,
        weight,
        created_date,
        shipper_id
      FROM parcels 
      WHERE shipper_id = $1 
      ORDER BY created_date DESC 
      LIMIT 10
    `, [id]);
    
    // Calculate statistics
    const totalParcels = shipper.total_parcels || 0;
    const deliveredParcels = shipper.delivered_parcels || 0;
    const successRate = totalParcels > 0 ? (deliveredParcels / totalParcels) * 100 : 0;
    const totalRevenue = shipper.total_revenue || 0;
    
    res.json({
      success: true,
      data: {
        shipper,
        payments: paymentsResult.rows,
        parcels: parcelsResult.rows,
        statistics: {
          totalParcels,
          deliveredParcels,
          successRate: successRate.toFixed(1),
          totalRevenue: parseFloat(totalRevenue).toFixed(2)
        }
      }
    });
  } catch (error) {
    console.error('Get shipper details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shipper details'
    });
  }
});

module.exports = router; 