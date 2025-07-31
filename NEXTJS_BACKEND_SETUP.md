# Next.js Backend Setup for QuickZone

## 🚀 Quick Setup Guide

### 1. **Project Structure**
```
quickzone-backend/
├── pages/
│   └── api/
│       ├── auth/
│       │   ├── login.js
│       │   ├── logout.js
│       │   └── register.js
│       ├── users/
│       │   ├── index.js
│       │   └── [id].js
│       ├── clients/
│       │   ├── index.js
│       │   └── [id].js
│       ├── parcels/
│       │   ├── index.js
│       │   └── [id].js
│       ├── missions/
│       │   ├── pickup/
│       │   │   ├── index.js
│       │   │   └── [id].js
│       │   └── delivery/
│       │       ├── index.js
│       │       └── [id].js
│       ├── invoices/
│       │   ├── index.js
│       │   └── [id].js
│       ├── payments/
│       │   ├── index.js
│       │   └── [id].js
│       └── complaints/
│           ├── index.js
│           └── [id].js
├── lib/
│   ├── db.js
│   ├── auth.js
│   ├── middleware.js
│   └── utils.js
├── models/
│   ├── User.js
│   ├── Client.js
│   ├── Parcel.js
│   ├── Mission.js
│   ├── Invoice.js
│   └── Complaint.js
├── middleware/
│   └── auth.js
├── utils/
│   ├── validation.js
│   └── helpers.js
├── .env.local
├── package.json
└── next.config.js
```

### 2. **Installation & Dependencies**

```bash
# Create Next.js project
npx create-next-app@latest quickzone-backend --typescript --tailwind --eslint

# Install dependencies
npm install pg bcryptjs jsonwebtoken cors helmet express-rate-limit
npm install @types/pg @types/bcryptjs @types/jsonwebtoken @types/cors

# Development dependencies
npm install -D nodemon
```

### 3. **Environment Configuration (.env.local)**

```env
# Database Configuration
DB_USER=postgres
DB_HOST=localhost
DB_NAME=quickzone_db
DB_PASSWORD=your_secure_password
DB_PORT=5432

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000/api
API_URL=http://localhost:3000/api

# Security
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# Optional: Redis for session storage
REDIS_URL=redis://localhost:6379
```

### 4. **Database Connection (lib/db.js)**

```javascript
import { Pool } from 'pg';

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test the connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export default pool;
```

### 5. **Authentication Middleware (middleware/auth.js)**

```javascript
import { verify } from 'jsonwebtoken';
import { NextResponse } from 'next/server';

export function middleware(request) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return NextResponse.json({ error: 'Access token required' }, { status: 401 });
  }

  try {
    const decoded = verify(token, process.env.JWT_SECRET);
    request.user = decoded;
    return NextResponse.next();
  } catch (error) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}

export const config = {
  matcher: '/api/:path*',
};
```

### 6. **Authentication Utilities (lib/auth.js)**

```javascript
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from './db';

export const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

export const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role 
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
};
```

### 7. **API Route Examples**

#### Authentication Routes

**pages/api/auth/login.js**
```javascript
import pool from '../../../lib/db';
import { comparePassword, generateToken } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Get user from database
    const userResult = await pool.query(
      `SELECT u.*, r.name as role_name, r.permissions 
       FROM users u 
       LEFT JOIN user_roles ur ON u.id = ur.user_id 
       LEFT JOIN roles r ON ur.role_id = r.id 
       WHERE u.email = $1 AND u.is_active = true`,
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = userResult.rows[0];

    // Verify password
    const isValidPassword = await comparePassword(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user);

    // Update last login
    await pool.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Remove password from response
    delete user.password_hash;

    res.status(200).json({
      success: true,
      data: {
        user,
        accessToken: token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
```

#### Parcels API Routes

**pages/api/parcels/index.js**
```javascript
import pool from '../../../lib/db';
import { verifyToken } from '../../../lib/auth';

export default async function handler(req, res) {
  try {
    // Verify authentication
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = verifyToken(token);
    
    switch (req.method) {
      case 'GET':
        // Get parcels based on user role
        let query = `
          SELECT p.*, c.company_name as client_name, 
                 u.first_name || ' ' || u.last_name as driver_name,
                 w.name as warehouse_name
          FROM parcels p
          LEFT JOIN clients c ON p.client_id = c.id
          LEFT JOIN users u ON p.assigned_driver_id = u.id
          LEFT JOIN warehouses w ON p.assigned_warehouse_id = w.id
        `;

        const params = [];
        
        // Role-based filtering
        if (decoded.role === 'Expéditeur') {
          query += ' WHERE p.client_id = (SELECT client_id FROM client_users WHERE user_id = $1)';
          params.push(decoded.id);
        } else if (decoded.role === 'Livreurs') {
          query += ' WHERE p.assigned_driver_id = $1';
          params.push(decoded.id);
        }

        query += ' ORDER BY p.created_at DESC';

        const result = await pool.query(query, params);
        
        res.status(200).json({
          success: true,
          data: {
            parcels: result.rows,
            total: result.rows.length
          }
        });
        break;

      case 'POST':
        // Create new parcel
        const {
          client_id, sender_name, sender_phone, sender_address, sender_city,
          recipient_name, recipient_phone, recipient_address, recipient_city,
          weight, package_type, service_type, price, special_instructions
        } = req.body;

        // Generate tracking number
        const trackingNumber = `QZ${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

        const insertResult = await pool.query(
          `INSERT INTO parcels (
            tracking_number, client_id, sender_name, sender_phone, sender_address, sender_city,
            recipient_name, recipient_phone, recipient_address, recipient_city,
            weight, package_type, service_type, price, total_amount, special_instructions, created_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $14, $15, $16)
          RETURNING *`,
          [
            trackingNumber, client_id, sender_name, sender_phone, sender_address, sender_city,
            recipient_name, recipient_phone, recipient_address, recipient_city,
            weight, package_type, service_type, price, special_instructions, decoded.id
          ]
        );

        // Create initial tracking entry
        await pool.query(
          `INSERT INTO parcel_tracking (parcel_id, status, updated_by)
           VALUES ($1, 'en_attente', $2)`,
          [insertResult.rows[0].id, decoded.id]
        );

        res.status(201).json({
          success: true,
          data: insertResult.rows[0]
        });
        break;

      default:
        res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Parcels API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
```

### 8. **Database Models (models/)**

**models/User.js**
```javascript
import pool from '../lib/db';

export class User {
  static async findById(id) {
    const result = await pool.query(
      `SELECT u.*, r.name as role_name, r.permissions 
       FROM users u 
       LEFT JOIN user_roles ur ON u.id = ur.user_id 
       LEFT JOIN roles r ON ur.role_id = r.id 
       WHERE u.id = $1`,
      [id]
    );
    return result.rows[0];
  }

  static async findByEmail(email) {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0];
  }

  static async create(userData) {
    const { username, email, password_hash, first_name, last_name, phone } = userData;
    
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, first_name, last_name, phone)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [username, email, password_hash, first_name, last_name, phone]
    );
    
    return result.rows[0];
  }

  static async update(id, updates) {
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    const query = `UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`;
    
    const result = await pool.query(query, [id, ...values]);
    return result.rows[0];
  }
}
```

### 9. **Utility Functions (utils/)**

**utils/validation.js**
```javascript
export const validateParcel = (data) => {
  const errors = [];

  if (!data.sender_name) errors.push('Sender name is required');
  if (!data.sender_phone) errors.push('Sender phone is required');
  if (!data.sender_address) errors.push('Sender address is required');
  if (!data.recipient_name) errors.push('Recipient name is required');
  if (!data.recipient_phone) errors.push('Recipient phone is required');
  if (!data.recipient_address) errors.push('Recipient address is required');
  if (!data.weight || data.weight <= 0) errors.push('Valid weight is required');
  if (!data.price || data.price <= 0) errors.push('Valid price is required');

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateClient = (data) => {
  const errors = [];

  if (!data.company_name) errors.push('Company name is required');
  if (!data.contact_person) errors.push('Contact person is required');
  if (!data.email) errors.push('Email is required');
  if (!data.phone) errors.push('Phone is required');
  if (!data.address) errors.push('Address is required');
  if (!data.city) errors.push('City is required');

  return {
    isValid: errors.length === 0,
    errors
  };
};
```

### 10. **Error Handling Middleware**

**lib/errorHandler.js**
```javascript
export const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: err.message
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Unauthorized',
      details: 'Invalid or missing authentication token'
    });
  }

  if (err.code === '23505') { // PostgreSQL unique violation
    return res.status(409).json({
      error: 'Conflict',
      details: 'Resource already exists'
    });
  }

  res.status(500).json({
    error: 'Internal Server Error',
    details: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
};
```

### 11. **Rate Limiting**

**lib/rateLimit.js**
```javascript
import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
```

### 12. **CORS Configuration**

**next.config.js**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

## 🚀 Deployment Checklist

### Development
- [ ] Set up PostgreSQL database
- [ ] Run database migration scripts
- [ ] Configure environment variables
- [ ] Test all API endpoints
- [ ] Implement error handling
- [ ] Add input validation
- [ ] Set up logging

### Production
- [ ] Use environment-specific configurations
- [ ] Set up SSL certificates
- [ ] Configure database connection pooling
- [ ] Implement proper logging
- [ ] Set up monitoring and alerts
- [ ] Configure backup strategies
- [ ] Set up CI/CD pipeline

This setup provides a solid foundation for your QuickZone backend with PostgreSQL and Next.js, ready to handle real data and production workloads. 