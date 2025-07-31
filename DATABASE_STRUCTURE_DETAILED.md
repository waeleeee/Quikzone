# QuickZone Database Structure - Table by Table

## 🗄️ Database Overview

This document provides a detailed breakdown of each table in the QuickZone delivery management system, including field definitions, data types, constraints, and relationships.

## 📋 Table Structure Details

### 1. **USERS** - Main User Accounts
**Purpose**: Central user authentication and profile management

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,                    -- Auto-incrementing unique identifier
    username VARCHAR(50) UNIQUE NOT NULL,     -- Unique username for login
    email VARCHAR(100) UNIQUE NOT NULL,       -- Unique email address
    password_hash VARCHAR(255) NOT NULL,      -- Bcrypt hashed password
    first_name VARCHAR(50) NOT NULL,          -- User's first name
    last_name VARCHAR(50) NOT NULL,           -- User's last name
    phone VARCHAR(20),                        -- Contact phone number
    is_active BOOLEAN DEFAULT TRUE,           -- Account status (active/inactive)
    email_verified BOOLEAN DEFAULT FALSE,     -- Email verification status
    last_login TIMESTAMP NULL,                -- Last login timestamp
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Key Fields**:
- `id`: Primary key, auto-incrementing
- `username`: Unique login identifier
- `email`: Unique email for notifications
- `password_hash`: Securely hashed password
- `is_active`: Controls account access

**Indexes**:
- `idx_users_email` - Fast email lookups
- `idx_users_username` - Fast username lookups
- `idx_users_active` - Filter active users

---

### 2. **ROLES** - System Roles
**Purpose**: Define user roles and permissions

```sql
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,                    -- Auto-incrementing unique identifier
    name VARCHAR(50) UNIQUE NOT NULL,         -- Role name (e.g., 'admin', 'driver')
    description TEXT,                         -- Role description
    permissions JSONB,                        -- JSON permissions object
    is_system_role BOOLEAN DEFAULT FALSE,     -- System vs custom role
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Key Fields**:
- `name`: Unique role identifier
- `permissions`: JSON object with role permissions
- `is_system_role`: Distinguishes system roles from custom ones

**Sample Permissions JSON**:
```json
{
  "parcels": ["read", "create", "update"],
  "users": ["read"],
  "reports": ["read", "export"]
}
```

---

### 3. **USER_ROLES** - Role Assignments
**Purpose**: Many-to-many relationship between users and roles

```sql
CREATE TABLE user_roles (
    id SERIAL PRIMARY KEY,                    -- Auto-incrementing unique identifier
    user_id INTEGER NOT NULL,                 -- Reference to users table
    role_id INTEGER NOT NULL,                 -- Reference to roles table
    assigned_by INTEGER,                      -- Who assigned this role
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,                -- Role expiration date
    is_active BOOLEAN DEFAULT TRUE,           -- Active role assignment
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id),
    UNIQUE(user_id, role_id)                  -- Prevent duplicate assignments
);
```

**Key Fields**:
- `user_id`: Links to users table
- `role_id`: Links to roles table
- `expires_at`: Optional role expiration
- `assigned_by`: Audit trail of who assigned the role

---

### 4. **ADMINISTRATORS** - Admin Users
**Purpose**: System administrators with full access

```sql
CREATE TABLE administrators (
    id SERIAL PRIMARY KEY,                    -- Auto-incrementing unique identifier
    name VARCHAR(100) NOT NULL,               -- Full name
    email VARCHAR(100) UNIQUE NOT NULL,       -- Unique email
    password VARCHAR(255),                    -- Password (if separate from users)
    phone VARCHAR(20),                        -- Contact phone
    governorate VARCHAR(50),                  -- Administrative region
    address TEXT,                             -- Physical address
    role VARCHAR(50),                         -- Admin role (e.g., 'super_admin')
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Key Fields**:
- `governorate`: Geographic region responsibility
- `role`: Specific admin role within the system

---

### 5. **COMMERCIALS** - Sales Representatives
**Purpose**: Customer relationship management

```sql
CREATE TABLE commercials (
    id SERIAL PRIMARY KEY,                    -- Auto-incrementing unique identifier
    name VARCHAR(100) NOT NULL,               -- Full name
    email VARCHAR(100) UNIQUE NOT NULL,       -- Unique email
    phone VARCHAR(20),                        -- Contact phone
    governorate VARCHAR(50),                  -- Sales territory
    address TEXT,                             -- Office address
    title VARCHAR(50),                        -- Job title
    clients_count INTEGER DEFAULT 0,          -- Number of assigned clients
    shipments_received INTEGER DEFAULT 0,     -- Total shipments handled
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Key Fields**:
- `clients_count`: Tracks assigned clients
- `shipments_received`: Performance metric
- `governorate`: Sales territory

---

### 6. **ACCOUNTANTS** - Financial Management
**Purpose**: Financial operations and payment processing

```sql
CREATE TABLE accountants (
    id SERIAL PRIMARY KEY,                    -- Auto-incrementing unique identifier
    name VARCHAR(100) NOT NULL,               -- Full name
    email VARCHAR(100) UNIQUE NOT NULL,       -- Unique email
    phone VARCHAR(20),                        -- Contact phone
    governorate VARCHAR(50),                  -- Regional responsibility
    address TEXT,                             -- Office address
    title VARCHAR(50),                        -- Job title
    agency VARCHAR(50),                       -- Assigned agency
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Key Fields**:
- `agency`: Specific agency assignment
- `title`: Professional title (e.g., 'Senior Accountant')

---

### 7. **AGENCY_MANAGERS** - Agency Leadership
**Purpose**: Manage agency operations

```sql
CREATE TABLE agency_managers (
    id SERIAL PRIMARY KEY,                    -- Auto-incrementing unique identifier
    name VARCHAR(100) NOT NULL,               -- Full name
    email VARCHAR(100) UNIQUE NOT NULL,       -- Unique email
    phone VARCHAR(20),                        -- Contact phone
    governorate VARCHAR(50),                  -- Agency location
    address TEXT,                             -- Agency address
    agency VARCHAR(50),                       -- Agency name
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Key Fields**:
- `agency`: Specific agency name
- `governorate`: Geographic location

---

### 8. **AGENCY_MEMBERS** - Agency Staff
**Purpose**: Day-to-day agency operations

```sql
CREATE TABLE agency_members (
    id SERIAL PRIMARY KEY,                    -- Auto-incrementing unique identifier
    name VARCHAR(100) NOT NULL,               -- Full name
    email VARCHAR(100) UNIQUE NOT NULL,       -- Unique email
    phone VARCHAR(20),                        -- Contact phone
    governorate VARCHAR(50),                  -- Agency location
    agency VARCHAR(50),                       -- Agency name
    role VARCHAR(50),                         -- Job role (e.g., 'Magasinier')
    status VARCHAR(20) DEFAULT 'Actif',       -- Employment status
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Key Fields**:
- `role`: Specific job function
- `status`: Employment status ('Actif', 'En congé', etc.)

---

### 9. **DRIVERS** - Delivery Personnel
**Purpose**: Parcel delivery and pickup operations

```sql
CREATE TABLE drivers (
    id SERIAL PRIMARY KEY,                    -- Auto-incrementing unique identifier
    name VARCHAR(100) NOT NULL,               -- Full name
    email VARCHAR(100) UNIQUE NOT NULL,       -- Unique email
    phone VARCHAR(20),                        -- Contact phone
    governorate VARCHAR(50),                  -- Service area
    address TEXT,                             -- Home address
    vehicle VARCHAR(100),                     -- Vehicle information
    status VARCHAR(20) DEFAULT 'Disponible',  -- Availability status
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Key Fields**:
- `vehicle`: Vehicle details (type, model, etc.)
- `status`: Availability ('Disponible', 'En mission', etc.)

---

### 10. **SHIPPERS** - Customers
**Purpose**: Clients using the delivery service

```sql
CREATE TABLE shippers (
    id SERIAL PRIMARY KEY,                    -- Auto-incrementing unique identifier
    code VARCHAR(20) UNIQUE NOT NULL,         -- Unique shipper code
    name VARCHAR(100) NOT NULL,               -- Full name
    email VARCHAR(100) UNIQUE NOT NULL,       -- Unique email
    phone VARCHAR(20),                        -- Contact phone
    company VARCHAR(100),                     -- Company name
    total_parcels INTEGER DEFAULT 0,          -- Total parcels sent
    delivered_parcels INTEGER DEFAULT 0,      -- Successfully delivered
    returned_parcels INTEGER DEFAULT 0,       -- Returned parcels
    delivery_fees DECIMAL(10,2) DEFAULT 8,    -- Total delivery fees
    return_fees DECIMAL(10,2) DEFAULT 0,      -- Total return fees
    status VARCHAR(20) DEFAULT 'Actif',       -- Account status
    siret VARCHAR(20),                        -- Business registration
    passport_number VARCHAR(20),              -- ID document
    fiscal_number VARCHAR(20),                -- Tax number
    agency VARCHAR(50),                       -- Assigned agency
    commercial_id INTEGER,                    -- Assigned commercial
    default_driver_id INTEGER,                -- Preferred driver
    bank_info JSONB,                          -- Banking information
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (commercial_id) REFERENCES commercials(id),
    FOREIGN KEY (default_driver_id) REFERENCES drivers(id)
);
```

**Key Fields**:
- `code`: Unique identifier (e.g., 'EXP001')
- `company`: Business name
- `total_parcels`: Performance metrics
- `bank_info`: JSON object with banking details
- `commercial_id`: Assigned sales representative

**Sample bank_info JSON**:
```json
{
  "bank_name": "Banque de Tunisie",
  "account_number": "1234567890",
  "iban": "TN1234567890123456789012"
}
```

---

### 11. **PARCELS** - Package Information
**Purpose**: Core parcel tracking and management

```sql
CREATE TABLE parcels (
    id SERIAL PRIMARY KEY,                    -- Auto-incrementing unique identifier
    tracking_number VARCHAR(20) UNIQUE NOT NULL, -- Unique tracking number
    shipper_id INTEGER NOT NULL,              -- Sender information
    destination VARCHAR(100) NOT NULL,        -- Delivery address
    status VARCHAR(50) DEFAULT 'En attente',  -- Current status
    weight DECIMAL(8,2),                      -- Package weight in kg
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estimated_delivery_date DATE,             -- Expected delivery date
    actual_delivery_date TIMESTAMP NULL,      -- Actual delivery date
    price DECIMAL(10,2),                      -- Delivery cost
    delivery_fees DECIMAL(10,2) DEFAULT 8,    -- Additional fees
    return_fees DECIMAL(10,2) DEFAULT 0,      -- Return shipping fees
    type VARCHAR(20) DEFAULT 'Standard',      -- Service type
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shipper_id) REFERENCES shippers(id)
);
```

**Key Fields**:
- `tracking_number`: Unique identifier for tracking
- `status`: Current parcel status
- `weight`: Package weight for pricing
- `estimated_delivery_date`: Expected delivery
- `actual_delivery_date`: Real delivery date

**Status Values**:
- 'En attente' (Pending)
- 'En cours' (In Progress)
- 'Livrés' (Delivered)
- 'Au dépôt' (At Warehouse)
- 'Livrés payés' (Delivered & Paid)

---

### 12. **PARCEL_TIMELINE** - Status History
**Purpose**: Track parcel status changes over time

```sql
CREATE TABLE parcel_timeline (
    id SERIAL PRIMARY KEY,                    -- Auto-incrementing unique identifier
    parcel_id INTEGER NOT NULL,               -- Reference to parcel
    status VARCHAR(50) NOT NULL,              -- Status at this point
    location VARCHAR(100),                    -- Physical location
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT,                         -- Status description
    user_id INTEGER,                          -- Who updated the status
    FOREIGN KEY (parcel_id) REFERENCES parcels(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**Key Fields**:
- `parcel_id`: Links to specific parcel
- `status`: Status at this point in time
- `location`: Geographic location
- `timestamp`: When the status changed
- `user_id`: Who made the change

---

### 13. **PICKUP_MISSIONS** - Pickup Operations
**Purpose**: Organize pickup operations

```sql
CREATE TABLE pickup_missions (
    id SERIAL PRIMARY KEY,                    -- Auto-incrementing unique identifier
    mission_number VARCHAR(20) UNIQUE NOT NULL, -- Unique mission ID
    driver_id INTEGER NOT NULL,               -- Assigned driver
    shipper_id INTEGER NOT NULL,              -- Pickup location
    scheduled_date TIMESTAMP NOT NULL,        -- Scheduled pickup time
    status VARCHAR(20) DEFAULT 'En attente',  -- Mission status
    created_by INTEGER,                       -- Who created the mission
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (driver_id) REFERENCES drivers(id),
    FOREIGN KEY (shipper_id) REFERENCES shippers(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);
```

**Key Fields**:
- `mission_number`: Unique mission identifier
- `driver_id`: Assigned driver
- `shipper_id`: Pickup location
- `scheduled_date`: Planned pickup time
- `status`: Mission status

---

### 14. **MISSION_PARCELS** - Mission-Parcel Association
**Purpose**: Link parcels to pickup missions

```sql
CREATE TABLE mission_parcels (
    id SERIAL PRIMARY KEY,                    -- Auto-incrementing unique identifier
    mission_id INTEGER NOT NULL,              -- Reference to mission
    parcel_id INTEGER NOT NULL,               -- Reference to parcel
    status VARCHAR(20) DEFAULT 'En attente',  -- Parcel status in mission
    FOREIGN KEY (mission_id) REFERENCES pickup_missions(id),
    FOREIGN KEY (parcel_id) REFERENCES parcels(id)
);
```

**Key Fields**:
- `mission_id`: Links to pickup mission
- `parcel_id`: Links to specific parcel
- `status`: Parcel status within the mission

---

### 15. **SECTORS** - Geographic Areas
**Purpose**: Define delivery sectors and zones

```sql
CREATE TABLE sectors (
    id SERIAL PRIMARY KEY,                    -- Auto-incrementing unique identifier
    name VARCHAR(100) NOT NULL,               -- Sector name
    city VARCHAR(100),                        -- City/region
    manager_id INTEGER,                       -- Sector manager
    status VARCHAR(20) DEFAULT 'Actif',       -- Sector status
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (manager_id) REFERENCES users(id)
);
```

**Key Fields**:
- `name`: Sector identifier
- `city`: Geographic area
- `manager_id`: Assigned manager

---

### 16. **WAREHOUSES** - Storage Facilities
**Purpose**: Manage warehouse operations

```sql
CREATE TABLE warehouses (
    id SERIAL PRIMARY KEY,                    -- Auto-incrementing unique identifier
    name VARCHAR(100) NOT NULL,               -- Warehouse name
    governorate VARCHAR(50),                  -- Geographic location
    address TEXT,                             -- Physical address
    manager_id INTEGER,                       -- Warehouse manager
    current_stock INTEGER DEFAULT 0,          -- Current parcel count
    capacity INTEGER DEFAULT 100,             -- Maximum capacity
    status VARCHAR(20) DEFAULT 'Actif',       -- Warehouse status
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (manager_id) REFERENCES users(id)
);
```

**Key Fields**:
- `current_stock`: Number of parcels currently stored
- `capacity`: Maximum storage capacity
- `manager_id`: Assigned manager

---

### 17. **WAREHOUSE_USERS** - Warehouse Staff
**Purpose**: Manage warehouse personnel

```sql
CREATE TABLE warehouse_users (
    id SERIAL PRIMARY KEY,                    -- Auto-incrementing unique identifier
    warehouse_id INTEGER NOT NULL,            -- Assigned warehouse
    user_id INTEGER NOT NULL,                 -- Staff member
    role VARCHAR(50),                         -- Job role
    email VARCHAR(100),                       -- Contact email
    phone VARCHAR(20),                        -- Contact phone
    status VARCHAR(20) DEFAULT 'Actif',       -- Employment status
    entry_date DATE DEFAULT CURRENT_DATE,     -- Start date
    parcels_processed INTEGER DEFAULT 0,      -- Performance metric
    performance DECIMAL(5,2) DEFAULT 0,       -- Performance rating
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**Key Fields**:
- `parcels_processed`: Performance tracking
- `performance`: Performance rating (0-100)
- `entry_date`: Employment start date

---

### 18. **PAYMENTS** - Financial Transactions
**Purpose**: Track all payment transactions

```sql
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,                    -- Auto-incrementing unique identifier
    shipper_id INTEGER NOT NULL,              -- Paying customer
    amount DECIMAL(10,2) NOT NULL,            -- Payment amount
    date DATE NOT NULL,                       -- Payment date
    payment_method VARCHAR(50),               -- Payment method
    reference VARCHAR(50),                    -- Payment reference
    status VARCHAR(20) DEFAULT 'En attente',  -- Payment status
    invoice_number VARCHAR(50),               -- Related invoice
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shipper_id) REFERENCES shippers(id)
);
```

**Key Fields**:
- `amount`: Payment amount in euros
- `payment_method`: How payment was made
- `status`: Payment processing status
- `invoice_number`: Related invoice reference

**Payment Methods**:
- 'Virement bancaire' (Bank Transfer)
- 'Espèces' (Cash)
- 'Chèque' (Check)
- 'Carte bancaire' (Credit Card)

---

### 19. **INVOICES** - Billing Documents
**Purpose**: Generate and track invoices

```sql
CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,                    -- Auto-incrementing unique identifier
    payment_id INTEGER NOT NULL,              -- Related payment
    invoice_number VARCHAR(50) UNIQUE NOT NULL, -- Unique invoice number
    client_name VARCHAR(100),                 -- Client name
    client_phone VARCHAR(20),                 -- Client phone
    delivery_address TEXT,                    -- Delivery address
    weight DECIMAL(8,2),                      -- Package weight
    notes TEXT,                               -- Additional notes
    base_delivery_cost DECIMAL(10,2),         -- Base delivery cost
    additional_costs DECIMAL(10,2) DEFAULT 0, -- Extra charges
    total_ht DECIMAL(10,2),                   -- Total before tax
    tva DECIMAL(10,2),                        -- Tax amount
    total_ttc DECIMAL(10,2),                  -- Total with tax
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payment_id) REFERENCES payments(id)
);
```

**Key Fields**:
- `invoice_number`: Unique invoice identifier
- `base_delivery_cost`: Standard delivery fee
- `additional_costs`: Extra charges
- `total_ht`: Subtotal before tax
- `tva`: Tax amount
- `total_ttc`: Final total

---

### 20. **COMPLAINTS** - Customer Service
**Purpose**: Track customer complaints and issues

```sql
CREATE TABLE complaints (
    id SERIAL PRIMARY KEY,                    -- Auto-incrementing unique identifier
    client_id INTEGER NOT NULL,               -- Complaining customer
    subject VARCHAR(200) NOT NULL,            -- Complaint subject
    description TEXT,                         -- Detailed description
    date DATE DEFAULT CURRENT_DATE,           -- Complaint date
    status VARCHAR(20) DEFAULT 'En attente',  -- Resolution status
    assigned_to INTEGER,                      -- Assigned staff member
    resolution_date TIMESTAMP NULL,           -- When resolved
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES shippers(id),
    FOREIGN KEY (assigned_to) REFERENCES users(id)
);
```

**Key Fields**:
- `subject`: Brief complaint description
- `description`: Detailed complaint text
- `status`: Resolution status
- `assigned_to`: Staff member handling the complaint
- `resolution_date`: When the complaint was resolved

**Status Values**:
- 'En attente' (Pending)
- 'Traitée' (Processed)
- 'Rejetée' (Rejected)

---

## 🔗 Key Relationships

### One-to-Many Relationships:
- **Users** → **User_Roles** (one user can have multiple roles)
- **Shippers** → **Parcels** (one shipper can have multiple parcels)
- **Drivers** → **Pickup_Missions** (one driver can have multiple missions)
- **Warehouses** → **Warehouse_Users** (one warehouse can have multiple staff)

### Many-to-Many Relationships:
- **Users** ↔ **Roles** (via user_roles table)
- **Missions** ↔ **Parcels** (via mission_parcels table)

### Foreign Key Dependencies:
- All tables with foreign keys maintain referential integrity
- Cascade deletes where appropriate (e.g., user_roles when user is deleted)
- Proper indexing on foreign key columns for performance

## 📊 Database Indexes

### Performance Indexes:
```sql
-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_active ON users(is_active);

-- Parcels
CREATE INDEX idx_parcels_tracking ON parcels(tracking_number);
CREATE INDEX idx_parcels_status ON parcels(status);
CREATE INDEX idx_parcels_shipper ON parcels(shipper_id);

-- Shippers
CREATE INDEX idx_shippers_code ON shippers(code);
CREATE INDEX idx_shippers_email ON shippers(email);

-- Payments
CREATE INDEX idx_payments_shipper ON payments(shipper_id);
CREATE INDEX idx_payments_date ON payments(date);
```

## 🚀 Development Guidelines

### For Database Operations:
1. **Always use parameterized queries** to prevent SQL injection
2. **Use transactions** for multi-table operations
3. **Implement proper error handling** for database operations
4. **Use indexes** for frequently queried columns
5. **Maintain referential integrity** with foreign keys

### For Data Validation:
1. **Validate input data** before database insertion
2. **Use appropriate data types** for each field
3. **Implement business logic** at application level
4. **Handle NULL values** appropriately

### For Performance:
1. **Use pagination** for large result sets
2. **Optimize queries** with proper JOINs
3. **Monitor query performance** with EXPLAIN
4. **Use connection pooling** for better resource management

This database structure supports a complete delivery management system with user management, parcel tracking, financial operations, and customer service capabilities. 