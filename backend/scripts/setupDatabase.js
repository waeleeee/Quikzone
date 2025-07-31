const db = require('../config/database');
const bcrypt = require('bcryptjs');

const setupDatabase = async () => {
  try {
    console.log('🚀 Setting up QuickZone database...');

    // Create tables
    await createTables();
    
    // Create indexes
    await createIndexes();
    
    // Insert default roles
    await insertDefaultRoles();
    
    // Insert default admin user
    await insertDefaultAdmin();
    
    console.log('✅ Database setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
};

const createTables = async () => {
  console.log('📋 Creating tables...');

  // Users table
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      first_name VARCHAR(50) NOT NULL,
      last_name VARCHAR(50) NOT NULL,
      phone VARCHAR(20),
      is_active BOOLEAN DEFAULT TRUE,
      email_verified BOOLEAN DEFAULT FALSE,
      last_login TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Roles table
  await db.query(`
    CREATE TABLE IF NOT EXISTS roles (
      id SERIAL PRIMARY KEY,
      name VARCHAR(50) UNIQUE NOT NULL,
      description TEXT,
      permissions JSONB,
      is_system_role BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // User roles table
  await db.query(`
    CREATE TABLE IF NOT EXISTS user_roles (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      role_id INTEGER NOT NULL,
      assigned_by INTEGER,
      assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMP NULL,
      is_active BOOLEAN DEFAULT TRUE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
      FOREIGN KEY (assigned_by) REFERENCES users(id),
      UNIQUE(user_id, role_id)
    )
  `);

  // Administrators table
  await db.query(`
    CREATE TABLE IF NOT EXISTS administrators (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255),
      phone VARCHAR(20),
      governorate VARCHAR(50),
      address TEXT,
      role VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Commercials table
  await db.query(`
    CREATE TABLE IF NOT EXISTS commercials (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      phone VARCHAR(20),
      governorate VARCHAR(50),
      address TEXT,
      title VARCHAR(50),
      clients_count INTEGER DEFAULT 0,
      shipments_received INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Accountants table
  await db.query(`
    CREATE TABLE IF NOT EXISTS accountants (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      phone VARCHAR(20),
      governorate VARCHAR(50),
      address TEXT,
      title VARCHAR(50),
      agency VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Agency managers table
  await db.query(`
    CREATE TABLE IF NOT EXISTS agency_managers (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      phone VARCHAR(20),
      governorate VARCHAR(50),
      address TEXT,
      agency VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Agency members table
  await db.query(`
    CREATE TABLE IF NOT EXISTS agency_members (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      phone VARCHAR(20),
      governorate VARCHAR(50),
      agency VARCHAR(50),
      role VARCHAR(50),
      status VARCHAR(20) DEFAULT 'Actif',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Drivers table
  await db.query(`
    CREATE TABLE IF NOT EXISTS drivers (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      phone VARCHAR(20),
      governorate VARCHAR(50),
      address TEXT,
      vehicle VARCHAR(100),
      status VARCHAR(20) DEFAULT 'Disponible',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Shippers table
  await db.query(`
    CREATE TABLE IF NOT EXISTS shippers (
      id SERIAL PRIMARY KEY,
      code VARCHAR(20) UNIQUE NOT NULL,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      phone VARCHAR(20),
      company VARCHAR(100),
      total_parcels INTEGER DEFAULT 0,
      delivered_parcels INTEGER DEFAULT 0,
      returned_parcels INTEGER DEFAULT 0,
      delivery_fees DECIMAL(10,2) DEFAULT 0,
      return_fees DECIMAL(10,2) DEFAULT 0,
      status VARCHAR(20) DEFAULT 'Actif',
      siret VARCHAR(20),
      passport_number VARCHAR(20),
      fiscal_number VARCHAR(20),
      agency VARCHAR(50),
      commercial_id INTEGER,
      default_driver_id INTEGER,
      bank_info JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (commercial_id) REFERENCES commercials(id),
      FOREIGN KEY (default_driver_id) REFERENCES drivers(id)
    )
  `);

  // Parcels table
  await db.query(`
    CREATE TABLE IF NOT EXISTS parcels (
      id SERIAL PRIMARY KEY,
      tracking_number VARCHAR(20) UNIQUE NOT NULL,
      shipper_id INTEGER NOT NULL,
      destination VARCHAR(100) NOT NULL,
      status VARCHAR(50) DEFAULT 'En attente',
      weight DECIMAL(8,2),
      created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      estimated_delivery_date DATE,
      actual_delivery_date TIMESTAMP NULL,
      price DECIMAL(10,2),
      delivery_fees DECIMAL(10,2) DEFAULT 0,
      return_fees DECIMAL(10,2) DEFAULT 0,
      type VARCHAR(20) DEFAULT 'Standard',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (shipper_id) REFERENCES shippers(id)
    )
  `);

  // Parcel timeline table
  await db.query(`
    CREATE TABLE IF NOT EXISTS parcel_timeline (
      id SERIAL PRIMARY KEY,
      parcel_id INTEGER NOT NULL,
      status VARCHAR(50) NOT NULL,
      location VARCHAR(100),
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      description TEXT,
      user_id INTEGER,
      FOREIGN KEY (parcel_id) REFERENCES parcels(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Pickup missions table
  await db.query(`
    CREATE TABLE IF NOT EXISTS pickup_missions (
      id SERIAL PRIMARY KEY,
      mission_number VARCHAR(20) UNIQUE NOT NULL,
      driver_id INTEGER NOT NULL,
      shipper_id INTEGER NOT NULL,
      scheduled_date TIMESTAMP NOT NULL,
      status VARCHAR(20) DEFAULT 'En attente',
      created_by INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (driver_id) REFERENCES drivers(id),
      FOREIGN KEY (shipper_id) REFERENCES shippers(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  // Mission parcels table
  await db.query(`
    CREATE TABLE IF NOT EXISTS mission_parcels (
      id SERIAL PRIMARY KEY,
      mission_id INTEGER NOT NULL,
      parcel_id INTEGER NOT NULL,
      status VARCHAR(20) DEFAULT 'En attente',
      FOREIGN KEY (mission_id) REFERENCES pickup_missions(id),
      FOREIGN KEY (parcel_id) REFERENCES parcels(id)
    )
  `);

  // Sectors table
  await db.query(`
    CREATE TABLE IF NOT EXISTS sectors (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      city VARCHAR(100),
      manager_id INTEGER,
      status VARCHAR(20) DEFAULT 'Actif',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (manager_id) REFERENCES users(id)
    )
  `);

  // Warehouses table
  await db.query(`
    CREATE TABLE IF NOT EXISTS warehouses (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      governorate VARCHAR(50),
      address TEXT,
      manager_id INTEGER,
      current_stock INTEGER DEFAULT 0,
      capacity INTEGER DEFAULT 100,
      status VARCHAR(20) DEFAULT 'Actif',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (manager_id) REFERENCES users(id)
    )
  `);

  // Warehouse users table
  await db.query(`
    CREATE TABLE IF NOT EXISTS warehouse_users (
      id SERIAL PRIMARY KEY,
      warehouse_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      role VARCHAR(50),
      email VARCHAR(100),
      phone VARCHAR(20),
      status VARCHAR(20) DEFAULT 'Actif',
      entry_date DATE DEFAULT CURRENT_DATE,
      parcels_processed INTEGER DEFAULT 0,
      performance DECIMAL(5,2) DEFAULT 0,
      FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Payments table
  await db.query(`
    CREATE TABLE IF NOT EXISTS payments (
      id SERIAL PRIMARY KEY,
      shipper_id INTEGER NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      date DATE NOT NULL,
      payment_method VARCHAR(50),
      reference VARCHAR(50),
      status VARCHAR(20) DEFAULT 'En attente',
      invoice_number VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (shipper_id) REFERENCES shippers(id)
    )
  `);

  // Invoices table
  await db.query(`
    CREATE TABLE IF NOT EXISTS invoices (
      id SERIAL PRIMARY KEY,
      payment_id INTEGER NOT NULL,
      invoice_number VARCHAR(50) UNIQUE NOT NULL,
      client_name VARCHAR(100),
      client_phone VARCHAR(20),
      delivery_address TEXT,
      weight DECIMAL(8,2),
      notes TEXT,
      base_delivery_cost DECIMAL(10,2),
      additional_costs DECIMAL(10,2) DEFAULT 0,
      total_ht DECIMAL(10,2),
      tva DECIMAL(10,2),
      total_ttc DECIMAL(10,2),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (payment_id) REFERENCES payments(id)
    )
  `);

  // Complaints table
  await db.query(`
    CREATE TABLE IF NOT EXISTS complaints (
      id SERIAL PRIMARY KEY,
      client_id INTEGER NOT NULL,
      subject VARCHAR(200) NOT NULL,
      description TEXT,
      date DATE DEFAULT CURRENT_DATE,
      status VARCHAR(20) DEFAULT 'En attente',
      assigned_to INTEGER,
      resolution_date TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES shippers(id),
      FOREIGN KEY (assigned_to) REFERENCES users(id)
    )
  `);

  console.log('✅ Tables created successfully');
};

const createIndexes = async () => {
  console.log('📊 Creating indexes...');

  // Users indexes
  await db.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
  await db.query('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)');
  await db.query('CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active)');

  // Parcels indexes
  await db.query('CREATE INDEX IF NOT EXISTS idx_parcels_tracking ON parcels(tracking_number)');
  await db.query('CREATE INDEX IF NOT EXISTS idx_parcels_status ON parcels(status)');
  await db.query('CREATE INDEX IF NOT EXISTS idx_parcels_shipper ON parcels(shipper_id)');

  // Shippers indexes
  await db.query('CREATE INDEX IF NOT EXISTS idx_shippers_code ON shippers(code)');
  await db.query('CREATE INDEX IF NOT EXISTS idx_shippers_email ON shippers(email)');

  // Payments indexes
  await db.query('CREATE INDEX IF NOT EXISTS idx_payments_shipper ON payments(shipper_id)');
  await db.query('CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(date)');

  console.log('✅ Indexes created successfully');
};

const insertDefaultRoles = async () => {
  console.log('👥 Inserting default roles...');

  const roles = [
    {
      name: 'Administration',
      description: 'Full system access',
      permissions: {
        dashboard: true,
        personnel: {
          administration: true,
          commercial: true,
          finance: true,
          chef_agence: true,
          membre_agence: true,
          livreurs: true
        },
        expediteur: true,
        colis: true,
        pickup: true,
        secteurs: true,
        entrepots: true,
        paiment_expediteur: true,
        reclamation: true
      },
      is_system_role: true
    },
    {
      name: 'Commercial',
      description: 'Client and sales management',
      permissions: {
        dashboard: true,
        personnel: { commercial: true },
        expediteur: true,
        colis: true,
        pickup: true,
        secteurs: true,
        reclamation: true
      },
      is_system_role: true
    },
    {
      name: 'Finance',
      description: 'Financial operations',
      permissions: {
        dashboard: true,
        personnel: { finance: true },
        paiment_expediteur: true
      },
      is_system_role: true
    },
    {
      name: 'Chef d\'agence',
      description: 'Operational management',
      permissions: {
        dashboard: true,
        personnel: {
          chef_agence: true,
          membre_agence: true,
          livreurs: true
        },
        expediteur: true,
        colis: true,
        pickup: true,
        secteurs: true,
        entrepots: true,
        reclamation: true
      },
      is_system_role: true
    },
    {
      name: 'Membre de l\'agence',
      description: 'Daily operations',
      permissions: {
        dashboard: true,
        colis: true,
        pickup: true,
        reclamation: true
      },
      is_system_role: true
    },
    {
      name: 'Livreurs',
      description: 'Delivery operations',
      permissions: {
        dashboard: true,
        pickup: true
      },
      is_system_role: true
    },
    {
      name: 'Expéditeur',
      description: 'Client parcel tracking',
      permissions: {
        dashboard: true,
        colis: true,
        paiment_expediteur: true,
        reclamation: true
      },
      is_system_role: true
    }
  ];

  for (const role of roles) {
    await db.query(
      'INSERT INTO roles (name, description, permissions, is_system_role) VALUES ($1, $2, $3, $4) ON CONFLICT (name) DO NOTHING',
      [role.name, role.description, JSON.stringify(role.permissions), role.is_system_role]
    );
  }

  console.log('✅ Default roles inserted successfully');
};

const insertDefaultAdmin = async () => {
  console.log('👑 Creating default admin user...');

  const hashedPassword = await bcrypt.hash('admin123', 10);

  // Insert admin user
  const userResult = await db.query(
    'INSERT INTO users (username, email, password_hash, first_name, last_name, is_active, email_verified) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (email) DO NOTHING RETURNING id',
    ['admin', 'admin@quickzone.tn', hashedPassword, 'Admin', 'QuickZone', true, true]
  );

  if (userResult.rows.length > 0) {
    const userId = userResult.rows[0].id;
    
    // Get admin role
    const roleResult = await db.query('SELECT id FROM roles WHERE name = $1', ['Administration']);
    
    if (roleResult.rows.length > 0) {
      const roleId = roleResult.rows[0].id;
      
      // Assign admin role to user
      await db.query(
        'INSERT INTO user_roles (user_id, role_id, assigned_by) VALUES ($1, $2, $3) ON CONFLICT (user_id, role_id) DO NOTHING',
        [userId, roleId, userId]
      );
    }
  }

  console.log('✅ Default admin user created successfully');
};

setupDatabase(); 