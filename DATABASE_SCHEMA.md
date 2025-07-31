# QuickZone Database Schema

## 🗄️ Database Overview

This document outlines the complete database structure for the QuickZone parcel delivery management system, designed to support all the functionality we've implemented including role-based access control, parcel tracking, client management, and operational workflows.

### 🐘 PostgreSQL Setup

#### Create Database
```sql
-- Create database
CREATE DATABASE quickzone_db
    WITH 
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.UTF-8'
    LC_CTYPE = 'en_US.UTF-8'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;

-- Connect to the database
\c quickzone_db;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
```

#### PostgreSQL Configuration
```sql
-- Optimize PostgreSQL for the application
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;

-- Reload configuration
SELECT pg_reload_conf();
```

## 📊 Database Tables

### 1. **Users & Authentication**

#### `users` - Main user accounts
```sql
CREATE TABLE users (
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT idx_email UNIQUE (email),
    CONSTRAINT idx_username UNIQUE (username)
);

CREATE INDEX idx_users_active ON users(is_active);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
```
```

#### `user_roles` - Role assignments
```sql
CREATE TABLE user_roles (
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
    CONSTRAINT unique_user_role UNIQUE (user_id, role_id)
);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
```
```

#### `roles` - System roles
```sql
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB,
    is_system_role BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT idx_name UNIQUE (name)
);
```
```

#### `user_sessions` - Session management
```sql
CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);
```
```

### 2. **Client Management (Expéditeurs)**

#### `clients` - Client companies/individuals
```sql
CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(100) NOT NULL,
    contact_person VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(50) NOT NULL,
    postal_code VARCHAR(10),
    country VARCHAR(50) DEFAULT 'Tunisia',
    sector VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    credit_limit DECIMAL(10,2) DEFAULT 0.00,
    current_balance DECIMAL(10,2) DEFAULT 0.00,
    payment_terms INTEGER DEFAULT 30, -- days
    assigned_commercial_id INTEGER,
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_commercial_id) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT idx_email UNIQUE (email)
);

CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_clients_commercial ON clients(assigned_commercial_id);
```
```

#### `client_users` - Client user accounts
```sql
CREATE TABLE client_users (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    access_level VARCHAR(20) DEFAULT 'user' CHECK (access_level IN ('owner', 'manager', 'user')),
    is_primary_contact BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT unique_client_user UNIQUE (client_id, user_id)
);

CREATE INDEX idx_client_users_client_id ON client_users(client_id);
CREATE INDEX idx_client_users_user_id ON client_users(user_id);
```
```

### 3. **Parcel Management (Colis)**

#### `parcels` - Main parcel information
```sql
CREATE TABLE parcels (
    id SERIAL PRIMARY KEY,
    tracking_number VARCHAR(50) UNIQUE NOT NULL,
    client_id INTEGER NOT NULL,
    sender_name VARCHAR(100) NOT NULL,
    sender_phone VARCHAR(20) NOT NULL,
    sender_address TEXT NOT NULL,
    sender_city VARCHAR(50) NOT NULL,
    sender_postal_code VARCHAR(10),
    
    recipient_name VARCHAR(100) NOT NULL,
    recipient_phone VARCHAR(20) NOT NULL,
    recipient_address TEXT NOT NULL,
    recipient_city VARCHAR(50) NOT NULL,
    recipient_postal_code VARCHAR(10),
    
    weight DECIMAL(8,3) NOT NULL, -- in kg
    dimensions VARCHAR(50), -- format: "LxWxH cm"
    package_type VARCHAR(20) DEFAULT 'package' CHECK (package_type IN ('document', 'package', 'fragile', 'heavy')),
    service_type VARCHAR(20) DEFAULT 'standard' CHECK (service_type IN ('standard', 'express', 'premium')),
    
    declared_value DECIMAL(10,2) DEFAULT 0.00,
    insurance_amount DECIMAL(10,2) DEFAULT 0.00,
    
    status VARCHAR(50) DEFAULT 'en_attente' CHECK (status IN ('en_attente', 'au_depot', 'en_cours', 'rtn_depot', 'lives', 'lives_payes', 'retour_definitif', 'rtn_client_agence', 'retour_expediteur', 'retour_en_cours_expedition', 'retour_recu')),
    
    pickup_date DATE,
    estimated_delivery_date DATE,
    actual_delivery_date DATE,
    
    price DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL,
    
    assigned_driver_id INTEGER,
    assigned_warehouse_id INTEGER,
    
    special_instructions TEXT,
    signature_required BOOLEAN DEFAULT TRUE,
    
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (assigned_driver_id) REFERENCES users(id),
    FOREIGN KEY (assigned_warehouse_id) REFERENCES warehouses(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT idx_tracking UNIQUE (tracking_number)
);

CREATE INDEX idx_parcels_client ON parcels(client_id);
CREATE INDEX idx_parcels_status ON parcels(status);
CREATE INDEX idx_parcels_driver ON parcels(assigned_driver_id);
CREATE INDEX idx_parcels_created_at ON parcels(created_at);
CREATE INDEX idx_parcels_delivery_date ON parcels(estimated_delivery_date);
```
```

#### `parcel_tracking` - Parcel status history
```sql
CREATE TABLE parcel_tracking (
    id SERIAL PRIMARY KEY,
    parcel_id INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('en_attente', 'au_depot', 'en_cours', 'rtn_depot', 'lives', 'lives_payes', 'retour_definitif', 'rtn_client_agence', 'retour_expediteur', 'retour_en_cours_expedition', 'retour_recu')),
    location VARCHAR(100),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    notes TEXT,
    updated_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (parcel_id) REFERENCES parcels(id) ON DELETE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

CREATE INDEX idx_parcel_tracking_parcel_id ON parcel_tracking(parcel_id);
CREATE INDEX idx_parcel_tracking_status ON parcel_tracking(status);
CREATE INDEX idx_parcel_tracking_created_at ON parcel_tracking(created_at);
```
```

#### `parcel_status_definitions` - Status definitions and workflow
```sql
CREATE TABLE parcel_status_definitions (
    id SERIAL PRIMARY KEY,
    status_code VARCHAR(50) UNIQUE NOT NULL,
    status_name VARCHAR(100) NOT NULL,
    status_name_ar VARCHAR(100), -- Arabic name
    description TEXT,
    color_code VARCHAR(7) DEFAULT '#6B7280', -- hex color
    icon_class VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    sequence_order INTEGER DEFAULT 0,
    can_transition_to JSONB, -- array of status codes this can transition to
    requires_approval BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT idx_status_code UNIQUE (status_code)
);

CREATE INDEX idx_parcel_status_definitions_active ON parcel_status_definitions(is_active);
CREATE INDEX idx_parcel_status_definitions_sequence ON parcel_status_definitions(sequence_order);
```
```

#### `parcel_attachments` - Documents and images
```sql
CREATE TABLE parcel_attachments (
    id SERIAL PRIMARY KEY,
    parcel_id INTEGER NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50),
    file_size BIGINT,
    attachment_type VARCHAR(20) NOT NULL CHECK (attachment_type IN ('label', 'receipt', 'signature', 'photo', 'document')),
    uploaded_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (parcel_id) REFERENCES parcels(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

CREATE INDEX idx_parcel_attachments_parcel_id ON parcel_attachments(parcel_id);
CREATE INDEX idx_parcel_attachments_type ON parcel_attachments(attachment_type);
```
```

### 4. **Delivery Operations**

#### `delivery_zones` - Geographic zones
```sql
CREATE TABLE delivery_zones (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    city VARCHAR(50) NOT NULL,
    postal_codes JSONB, -- array of postal codes
    delivery_time_days INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_delivery_zones_city ON delivery_zones(city);
CREATE INDEX idx_delivery_zones_active ON delivery_zones(is_active);
```
```

#### `warehouses` - Storage facilities
```sql
CREATE TABLE warehouses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(50) NOT NULL,
    postal_code VARCHAR(10),
    phone VARCHAR(20),
    email VARCHAR(100),
    manager_id INTEGER,
    capacity INTEGER, -- max parcels
    current_occupancy INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (manager_id) REFERENCES users(id)
);

CREATE INDEX idx_warehouses_city ON warehouses(city);
CREATE INDEX idx_warehouses_active ON warehouses(is_active);
```
```

#### `pickup_missions` - Pickup assignments
```sql
CREATE TABLE pickup_missions (
    id SERIAL PRIMARY KEY,
    mission_number VARCHAR(50) UNIQUE NOT NULL,
    driver_id INTEGER NOT NULL,
    warehouse_id INTEGER NOT NULL,
    client_id INTEGER NOT NULL,
    
    pickup_date DATE NOT NULL,
    pickup_time_slot VARCHAR(20), -- "09:00-12:00"
    estimated_parcels INTEGER DEFAULT 0,
    actual_parcels INTEGER DEFAULT 0,
    
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    
    start_time TIMESTAMP NULL,
    end_time TIMESTAMP NULL,
    
    notes TEXT,
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (driver_id) REFERENCES users(id),
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT idx_mission_number UNIQUE (mission_number)
);

CREATE INDEX idx_pickup_missions_driver ON pickup_missions(driver_id);
CREATE INDEX idx_pickup_missions_date ON pickup_missions(pickup_date);
CREATE INDEX idx_pickup_missions_status ON pickup_missions(status);
```
```

#### `delivery_missions` - Delivery assignments
```sql
CREATE TABLE delivery_missions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    mission_number VARCHAR(50) UNIQUE NOT NULL,
    driver_id BIGINT NOT NULL,
    warehouse_id BIGINT NOT NULL,
    
    delivery_date DATE NOT NULL,
    estimated_parcels INT DEFAULT 0,
    actual_parcels INT DEFAULT 0,
    
    status ENUM('scheduled', 'in_progress', 'completed', 'cancelled') DEFAULT 'scheduled',
    
    start_time TIMESTAMP NULL,
    end_time TIMESTAMP NULL,
    
    route_data JSON, -- optimized route information
    notes TEXT,
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (driver_id) REFERENCES users(id),
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    
    INDEX idx_mission_number (mission_number),
    INDEX idx_driver (driver_id),
    INDEX idx_date (delivery_date),
    INDEX idx_status (status)
);
```

#### `mission_parcels` - Parcels assigned to missions
```sql
CREATE TABLE mission_parcels (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    mission_id BIGINT NOT NULL,
    parcel_id BIGINT NOT NULL,
    mission_type ENUM('pickup', 'delivery') NOT NULL,
    sequence_order INT DEFAULT 0,
    status ENUM('pending', 'completed', 'failed', 'skipped') DEFAULT 'pending',
    completed_at TIMESTAMP NULL,
    notes TEXT,
    
    FOREIGN KEY (mission_id) REFERENCES pickup_missions(id) ON DELETE CASCADE,
    FOREIGN KEY (parcel_id) REFERENCES parcels(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_mission_parcel (mission_id, parcel_id, mission_type),
    INDEX idx_mission (mission_id),
    INDEX idx_parcel (parcel_id),
    INDEX idx_status (status)
);
```

### 5. **Financial Management**

#### `invoices` - Client invoices
```sql
CREATE TABLE invoices (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    client_id BIGINT NOT NULL,
    
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0.00,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL,
    
    status ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled') DEFAULT 'draft',
    paid_amount DECIMAL(10,2) DEFAULT 0.00,
    paid_date DATE NULL,
    
    notes TEXT,
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    
    INDEX idx_invoice_number (invoice_number),
    INDEX idx_client (client_id),
    INDEX idx_status (status),
    INDEX idx_due_date (due_date)
);
```

#### `invoice_items` - Invoice line items
```sql
CREATE TABLE invoice_items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    invoice_id BIGINT NOT NULL,
    parcel_id BIGINT NOT NULL,
    description VARCHAR(255) NOT NULL,
    quantity INT DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (parcel_id) REFERENCES parcels(id),
    
    INDEX idx_invoice (invoice_id),
    INDEX idx_parcel (parcel_id)
);
```

#### `payments` - Payment records
```sql
CREATE TABLE payments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    payment_number VARCHAR(50) UNIQUE NOT NULL,
    client_id BIGINT NOT NULL,
    invoice_id BIGINT,
    
    payment_date DATE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method ENUM('cash', 'bank_transfer', 'credit_card', 'check', 'online') NOT NULL,
    reference_number VARCHAR(100),
    
    status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    notes TEXT,
    
    processed_by BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (invoice_id) REFERENCES invoices(id),
    FOREIGN KEY (processed_by) REFERENCES users(id),
    
    INDEX idx_payment_number (payment_number),
    INDEX idx_client (client_id),
    INDEX idx_invoice (invoice_id),
    INDEX idx_status (status),
    INDEX idx_date (payment_date)
);
```

### 6. **Customer Service**

#### `complaints` - Customer complaints
```sql
CREATE TABLE complaints (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    complaint_number VARCHAR(50) UNIQUE NOT NULL,
    client_id BIGINT NOT NULL,
    parcel_id BIGINT,
    
    complaint_type ENUM('delivery_delay', 'damaged_parcel', 'lost_parcel', 'wrong_address', 'driver_behavior', 'billing_issue', 'other') NOT NULL,
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    
    status ENUM('open', 'in_progress', 'resolved', 'closed') DEFAULT 'open',
    resolution TEXT,
    
    assigned_to BIGINT,
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (parcel_id) REFERENCES parcels(id),
    FOREIGN KEY (assigned_to) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    
    INDEX idx_complaint_number (complaint_number),
    INDEX idx_client (client_id),
    INDEX idx_parcel (parcel_id),
    INDEX idx_status (status),
    INDEX idx_priority (priority),
    INDEX idx_assigned (assigned_to)
);
```

#### `complaint_updates` - Complaint progress tracking
```sql
CREATE TABLE complaint_updates (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    complaint_id BIGINT NOT NULL,
    status ENUM('open', 'in_progress', 'resolved', 'closed') NOT NULL,
    update_text TEXT NOT NULL,
    internal_notes TEXT,
    updated_by BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id),
    
    INDEX idx_complaint (complaint_id),
    INDEX idx_created_at (created_at)
);
```

### 7. **System & Analytics**

#### `system_logs` - Application logs
```sql
CREATE TABLE system_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(50),
    record_id BIGINT,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id),
    
    INDEX idx_user (user_id),
    INDEX idx_action (action),
    INDEX idx_table (table_name),
    INDEX idx_created_at (created_at)
);
```

#### `notifications` - System notifications
```sql
CREATE TABLE notifications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    type ENUM('parcel_status', 'payment_due', 'complaint_update', 'system_alert') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSON,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_user (user_id),
    INDEX idx_type (type),
    INDEX idx_read (is_read),
    INDEX idx_created_at (created_at)
);
```

#### `analytics_events` - User behavior tracking
```sql
CREATE TABLE analytics_events (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT,
    event_type VARCHAR(100) NOT NULL,
    event_data JSON,
    page_url VARCHAR(500),
    session_id VARCHAR(100),
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id),
    
    INDEX idx_user (user_id),
    INDEX idx_event_type (event_type),
    INDEX idx_created_at (created_at)
);
```

## 📦 Parcel Status System

### Status Definitions
The QuickZone system uses a comprehensive 11-status workflow for parcel tracking:

```sql
-- Insert default parcel status definitions
INSERT INTO parcel_status_definitions (status_code, status_name, status_name_ar, description, color_code, icon_class, sequence_order, can_transition_to, requires_approval) VALUES
('en_attente', 'En attente', 'في الانتظار', 'Parcel registered in system, waiting for pickup', '#F59E0B', 'clock', 1, '["au_depot"]', false),
('au_depot', 'Au dépôt', 'في المستودع', 'Parcel received at warehouse', '#3B82F6', 'box', 2, '["en_cours", "rtn_depot"]', false),
('en_cours', 'En cours', 'قيد التوصيل', 'Parcel in transit/delivery', '#8B5CF6', 'truck', 3, '["lives", "rtn_depot", "retour_definitif"]', false),
('rtn_depot', 'RTN dépot', 'عودة للمستودع', 'Return to warehouse', '#F97316', 'arrow-uturn-left', 4, '["en_cours", "retour_expediteur"]', false),
('lives', 'Livés', 'تم التوصيل', 'Parcel delivered successfully', '#10B981', 'check-circle', 5, '["lives_payes", "retour_definitif"]', false),
('lives_payes', 'Livrés payés', 'تم التوصيل والدفع', 'Parcel delivered and payment received', '#059669', 'currency-euro', 6, '["retour_definitif"]', false),
('retour_definitif', 'Retour définitif', 'إرجاع نهائي', 'Permanent return', '#EF4444', 'x-circle', 7, '["rtn_client_agence"]', true),
('rtn_client_agence', 'RTN client agence', 'عودة لوكالة العميل', 'Return to client agency', '#EC4899', 'building-office', 8, '["retour_expediteur"]', false),
('retour_expediteur', 'Retour Expéditeur', 'عودة للمرسل', 'Return to sender', '#6B7280', 'user', 9, '["retour_en_cours_expedition"]', false),
('retour_en_cours_expedition', 'Retour En Cours d''expédition', 'قيد الإرجاع', 'Return in transit', '#6366F1', 'truck', 10, '["retour_recu"]', false),
('retour_recu', 'Retour reçu', 'تم استلام الإرجاع', 'Return received by sender', '#06B6D4', 'check', 11, '[]', false);
```

### Status Workflow
```
En attente → Au dépôt → En cours → Livés → Livrés payés
     ↓           ↓         ↓         ↓
  RTN dépot → Retour définitif → RTN client agence → Retour Expéditeur → Retour En Cours d'expédition → Retour reçu
```

### Status Transition Rules
- **En attente**: Initial status, can only transition to "Au dépôt"
- **Au dépôt**: Can transition to "En cours" or "RTN dépot"
- **En cours**: Can transition to "Livés", "RTN dépot", or "Retour définitif"
- **RTN dépot**: Can transition to "En cours" or "Retour Expéditeur"
- **Livés**: Can transition to "Livrés payés" or "Retour définitif"
- **Livrés payés**: Can only transition to "Retour définitif"
- **Retour définitif**: Requires approval, can transition to "RTN client agence"
- **RTN client agence**: Can transition to "Retour Expéditeur"
- **Retour Expéditeur**: Can transition to "Retour En Cours d'expédition"
- **Retour En Cours d'expédition**: Can transition to "Retour reçu"
- **Retour reçu**: Final status, no further transitions

### Status Color Mapping
```javascript
const statusColors = {
  'en_attente': '#F59E0B',           // Yellow
  'au_depot': '#3B82F6',             // Blue
  'en_cours': '#8B5CF6',             // Purple
  'rtn_depot': '#F97316',            // Orange
  'lives': '#10B981',                // Green
  'lives_payes': '#059669',          // Emerald
  'retour_definitif': '#EF4444',     // Red
  'rtn_client_agence': '#EC4899',    // Pink
  'retour_expediteur': '#6B7280',    // Gray
  'retour_en_cours_expedition': '#6366F1', // Indigo
  'retour_recu': '#06B6D4'           // Cyan
};
```

### Status-Based Business Logic
- **Payment Tracking**: Only "Livrés payés" status triggers payment processing
- **Delivery Confirmation**: "Livés" status requires recipient signature
- **Return Processing**: Return statuses require additional documentation
- **Approval Workflow**: "Retour définitif" requires manager approval
- **Analytics**: Status transitions are tracked for performance metrics

## ⚡ Next.js & PostgreSQL Optimization

### Database Connection Setup
```typescript
// lib/db.ts
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'quickzone_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export default pool;
```

### Environment Variables (.env.local)
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=quickzone_db
DB_USER=postgres
DB_PASSWORD=your_password
NEXTAUTH_SECRET=your_secret_key
NEXTAUTH_URL=http://localhost:3000
```

### TypeScript Types
```typescript
// types/database.ts
export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  is_active: boolean;
  email_verified: boolean;
  last_login?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Parcel {
  id: number;
  tracking_number: string;
  client_id: number;
  sender_name: string;
  sender_phone: string;
  sender_address: string;
  sender_city: string;
  sender_postal_code?: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  recipient_city: string;
  recipient_postal_code?: string;
  weight: number;
  dimensions?: string;
  package_type: 'document' | 'package' | 'fragile' | 'heavy';
  service_type: 'standard' | 'express' | 'premium';
  declared_value: number;
  insurance_amount: number;
  status: ParcelStatus;
  pickup_date?: Date;
  estimated_delivery_date?: Date;
  actual_delivery_date?: Date;
  price: number;
  tax_amount: number;
  total_amount: number;
  assigned_driver_id?: number;
  assigned_warehouse_id?: number;
  special_instructions?: string;
  signature_required: boolean;
  created_by: number;
  created_at: Date;
  updated_at: Date;
}

export type ParcelStatus = 
  | 'en_attente' 
  | 'au_depot' 
  | 'en_cours' 
  | 'rtn_depot' 
  | 'lives' 
  | 'lives_payes' 
  | 'retour_definitif' 
  | 'rtn_client_agence' 
  | 'retour_expediteur' 
  | 'retour_en_cours_expedition' 
  | 'retour_recu';
```

### Database Utilities
```typescript
// lib/db-utils.ts
import pool from './db';

export async function query(text: string, params?: any[]) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('Executed query', { text, duration, rows: res.rowCount });
  return res;
}

export async function getClient() {
  const client = await pool.connect();
  const query = client.query;
  const release = client.release;
  
  client.query = (...args) => {
    client.lastQuery = args;
    return query.apply(client, args);
  };
  
  client.release = () => {
    delete client.lastQuery;
    delete client.lastError;
    return release.apply(client);
  };
  
  return client;
}
```

## 🔐 Initial Data Setup

### Default Roles
```sql
INSERT INTO roles (name, description, permissions, is_system_role) VALUES
('Administration', 'Full system access', '{"dashboard": true, "personnel": {"administration": true, "commercial": true, "finance": true, "chef_agence": true, "membre_agence": true, "livreurs": true}, "expediteur": true, "colis": true, "pickup": true, "secteurs": true, "entrepots": true, "paiment_expediteur": true, "reclamation": true}', true),
('Commercial', 'Client and sales management', '{"dashboard": true, "personnel": {"commercial": true}, "expediteur": true, "colis": true, "pickup": true, "secteurs": true, "reclamation": true}', true),
('Finance', 'Financial operations', '{"dashboard": true, "personnel": {"finance": true}, "paiment_expediteur": true}', true),
('Chef d''agence', 'Operational management', '{"dashboard": true, "personnel": {"chef_agence": true, "membre_agence": true, "livreurs": true}, "expediteur": true, "colis": true, "pickup": true, "secteurs": true, "entrepots": true, "reclamation": true}', true),
('Membre de l''agence', 'Daily operations', '{"dashboard": true, "colis": true, "pickup": true, "reclamation": true}', true),
('Livreurs', 'Delivery operations', '{"dashboard": true, "pickup": true}', true),
('Expéditeur', 'Client parcel tracking', '{"dashboard": true, "colis": true, "paiment_expediteur": true, "reclamation": true}', true);
```

### Default Admin User
```sql
INSERT INTO users (username, email, password_hash, first_name, last_name, is_active, email_verified) VALUES
('admin', 'admin@quickzone.tn', '$2b$10$...', 'Admin', 'QuickZone', true, true);

INSERT INTO user_roles (user_id, role_id, assigned_by) VALUES
(1, 1, 1); -- Assign Administration role to admin user
```

## 📈 Performance Indexes

### Critical Indexes for Performance
```sql
-- Parcel tracking performance
CREATE INDEX idx_parcels_tracking_status ON parcels(tracking_number, status);
CREATE INDEX idx_parcels_client_status ON parcels(client_id, status);
CREATE INDEX idx_parcels_driver_date ON parcels(assigned_driver_id, estimated_delivery_date);

-- Mission performance
CREATE INDEX idx_pickup_missions_driver_date ON pickup_missions(driver_id, pickup_date, status);
CREATE INDEX idx_delivery_missions_driver_date ON delivery_missions(driver_id, delivery_date, status);

-- Financial performance
CREATE INDEX idx_invoices_client_status ON invoices(client_id, status, due_date);
CREATE INDEX idx_payments_client_date ON payments(client_id, payment_date, status);

-- Search performance (PostgreSQL full-text search)
CREATE INDEX idx_parcels_search ON parcels USING gin(to_tsvector('french', tracking_number || ' ' || sender_name || ' ' || recipient_name || ' ' || sender_address || ' ' || recipient_address));
CREATE INDEX idx_clients_search ON clients USING gin(to_tsvector('french', company_name || ' ' || contact_person || ' ' || email || ' ' || address));

-- Trigram indexes for fuzzy search
CREATE INDEX idx_parcels_tracking_trgm ON parcels USING gin(tracking_number gin_trgm_ops);
CREATE INDEX idx_clients_name_trgm ON clients USING gin(company_name gin_trgm_ops);
```

## 🔄 Database Relationships

### Key Relationships:
1. **Users → User Roles → Roles** (Many-to-Many)
2. **Clients → Parcels** (One-to-Many)
3. **Users → Parcels** (Driver assignment)
4. **Warehouses → Parcels** (Storage assignment)
5. **Pickup/Delivery Missions → Parcels** (Mission assignment)
6. **Clients → Invoices → Payments** (Financial flow)
7. **Clients → Complaints** (Customer service)

## 🛡️ Security Considerations

### Data Protection:
- All passwords are hashed using bcrypt
- Sensitive data is encrypted at rest
- Session tokens are securely generated
- Audit trails for all critical operations

### Access Control:
- Role-based permissions stored in JSON format
- User session management with expiration
- IP address and user agent tracking
- Comprehensive logging of all actions

## 📊 Scalability Features

### Partitioning Strategy:
- Parcels table partitioned by date
- Tracking logs partitioned by month
- System logs partitioned by week

### Caching Strategy:
- Redis for session management
- Memcached for frequently accessed data
- CDN for static assets and documents

This database schema provides a solid foundation for the QuickZone system, supporting all the functionality we've implemented while ensuring scalability, security, and performance. 