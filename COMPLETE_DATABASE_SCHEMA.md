# QuickZone Complete Database Schema

## 🗄️ Database Overview

This document provides a complete overview of all database tables used in the QuickZone parcel delivery management system. The system is designed to support role-based access control, parcel tracking, client management, and operational workflows.

## 🐘 PostgreSQL Database Setup

### Database Creation
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

## 📊 Complete Table Structure

### 1. **Users & Authentication Tables**

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
    avatar_url VARCHAR(255),
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

### 2. **Client Management Tables**

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

### 3. **Parcel Management Tables**

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
```

#### `parcel_status_definitions` - Status configuration
```sql
CREATE TABLE parcel_status_definitions (
    id SERIAL PRIMARY KEY,
    status_code VARCHAR(50) UNIQUE NOT NULL,
    status_name VARCHAR(100) NOT NULL,
    status_name_ar VARCHAR(100),
    color_code VARCHAR(7) DEFAULT '#6B7280',
    icon_class VARCHAR(100),
    can_transition_to JSONB, -- array of allowed next statuses
    requires_approval BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `parcel_attachments` - Parcel documents
```sql
CREATE TABLE parcel_attachments (
    id SERIAL PRIMARY KEY,
    parcel_id INTEGER NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50),
    file_size INTEGER,
    uploaded_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (parcel_id) REFERENCES parcels(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

CREATE INDEX idx_parcel_attachments_parcel_id ON parcel_attachments(parcel_id);
```

### 4. **Operational Tables**

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

#### `delivery_zones` - Delivery areas
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

#### `pickup_missions` - Pickup assignments
```sql
CREATE TABLE pickup_missions (
    id SERIAL PRIMARY KEY,
    mission_number VARCHAR(50) UNIQUE NOT NULL,
    driver_id INTEGER NOT NULL,
    warehouse_id INTEGER NOT NULL,
    
    pickup_date DATE NOT NULL,
    estimated_parcels INTEGER DEFAULT 0,
    actual_parcels INTEGER DEFAULT 0,
    
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    
    start_time TIMESTAMP NULL,
    end_time TIMESTAMP NULL,
    
    route_data JSONB, -- optimized route information
    notes TEXT,
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (driver_id) REFERENCES users(id),
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_pickup_missions_driver ON pickup_missions(driver_id);
CREATE INDEX idx_pickup_missions_date ON pickup_missions(pickup_date);
CREATE INDEX idx_pickup_missions_status ON pickup_missions(status);
```

#### `delivery_missions` - Delivery assignments
```sql
CREATE TABLE delivery_missions (
    id SERIAL PRIMARY KEY,
    mission_number VARCHAR(50) UNIQUE NOT NULL,
    driver_id INTEGER NOT NULL,
    warehouse_id INTEGER NOT NULL,
    
    delivery_date DATE NOT NULL,
    estimated_parcels INTEGER DEFAULT 0,
    actual_parcels INTEGER DEFAULT 0,
    
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    
    start_time TIMESTAMP NULL,
    end_time TIMESTAMP NULL,
    
    route_data JSONB, -- optimized route information
    notes TEXT,
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (driver_id) REFERENCES users(id),
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_delivery_missions_driver ON delivery_missions(driver_id);
CREATE INDEX idx_delivery_missions_date ON delivery_missions(delivery_date);
CREATE INDEX idx_delivery_missions_status ON delivery_missions(status);
```

#### `mission_parcels` - Parcels assigned to missions
```sql
CREATE TABLE mission_parcels (
    id SERIAL PRIMARY KEY,
    mission_id INTEGER NOT NULL,
    parcel_id INTEGER NOT NULL,
    mission_type VARCHAR(10) NOT NULL CHECK (mission_type IN ('pickup', 'delivery')),
    sequence_order INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'skipped')),
    completed_at TIMESTAMP NULL,
    notes TEXT,
    
    FOREIGN KEY (mission_id) REFERENCES pickup_missions(id) ON DELETE CASCADE,
    FOREIGN KEY (parcel_id) REFERENCES parcels(id) ON DELETE CASCADE,
    
    CONSTRAINT unique_mission_parcel UNIQUE (mission_id, parcel_id, mission_type)
);

CREATE INDEX idx_mission_parcels_mission ON mission_parcels(mission_id);
CREATE INDEX idx_mission_parcels_parcel ON mission_parcels(parcel_id);
CREATE INDEX idx_mission_parcels_status ON mission_parcels(status);
```

### 5. **Financial Management Tables**

#### `invoices` - Client invoices
```sql
CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    client_id INTEGER NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
    payment_terms INTEGER DEFAULT 30,
    notes TEXT,
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_invoices_client ON invoices(client_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
```

#### `invoice_items` - Invoice line items
```sql
CREATE TABLE invoice_items (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER NOT NULL,
    parcel_id INTEGER,
    description VARCHAR(255) NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (parcel_id) REFERENCES parcels(id)
);

CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_parcel ON invoice_items(parcel_id);
```

#### `payments` - Client payments
```sql
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    payment_number VARCHAR(50) UNIQUE NOT NULL,
    client_id INTEGER NOT NULL,
    invoice_id INTEGER,
    payment_date DATE NOT NULL,
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('cash', 'check', 'bank_transfer', 'credit_card', 'online')),
    amount DECIMAL(10,2) NOT NULL,
    reference_number VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    notes TEXT,
    processed_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (invoice_id) REFERENCES invoices(id),
    FOREIGN KEY (processed_by) REFERENCES users(id)
);

CREATE INDEX idx_payments_client ON payments(client_id);
CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_payments_date ON payments(payment_date);
CREATE INDEX idx_payments_status ON payments(status);
```

### 6. **Customer Service Tables**

#### `complaints` - Customer complaints
```sql
CREATE TABLE complaints (
    id SERIAL PRIMARY KEY,
    complaint_number VARCHAR(50) UNIQUE NOT NULL,
    client_id INTEGER NOT NULL,
    parcel_id INTEGER,
    complaint_type VARCHAR(50) NOT NULL CHECK (complaint_type IN ('delivery_delay', 'damage', 'lost_parcel', 'wrong_address', 'service_quality', 'billing_issue', 'other')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    resolution TEXT,
    assigned_to INTEGER,
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (parcel_id) REFERENCES parcels(id),
    FOREIGN KEY (assigned_to) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_complaints_client ON complaints(client_id);
CREATE INDEX idx_complaints_parcel ON complaints(parcel_id);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_priority ON complaints(priority);
```

#### `complaint_updates` - Complaint progress updates
```sql
CREATE TABLE complaint_updates (
    id SERIAL PRIMARY KEY,
    complaint_id INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL,
    update_text TEXT NOT NULL,
    updated_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

CREATE INDEX idx_complaint_updates_complaint ON complaint_updates(complaint_id);
```

### 7. **System & Analytics Tables**

#### `system_logs` - Audit trail
```sql
CREATE TABLE system_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(50),
    record_id INTEGER,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_system_logs_user ON system_logs(user_id);
CREATE INDEX idx_system_logs_action ON system_logs(action);
CREATE INDEX idx_system_logs_table ON system_logs(table_name);
CREATE INDEX idx_system_logs_created_at ON system_logs(created_at);
```

#### `notifications` - System notifications
```sql
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('parcel_status', 'payment_due', 'complaint_update', 'system_alert')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
```

#### `analytics_events` - User behavior tracking
```sql
CREATE TABLE analytics_events (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB,
    page_url VARCHAR(500),
    session_id VARCHAR(100),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_analytics_events_user ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at);
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

## 🛡️ Security & Performance Indexes

### Performance Indexes
```sql
-- Parcel tracking performance
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

## 📊 Next.js Backend Implementation

### Database Connection (lib/db.js)
```javascript
import { Pool } from 'pg';

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export default pool;
```

### API Routes Structure
```
pages/api/
├── auth/
│   ├── login.js
│   ├── logout.js
│   └── register.js
├── users/
│   ├── index.js
│   └── [id].js
├── clients/
│   ├── index.js
│   └── [id].js
├── parcels/
│   ├── index.js
│   └── [id].js
├── missions/
│   ├── pickup/
│   └── delivery/
├── invoices/
│   ├── index.js
│   └── [id].js
├── payments/
│   ├── index.js
│   └── [id].js
└── complaints/
    ├── index.js
    └── [id].js
```

### Environment Variables (.env.local)
```env
# Database
DB_USER=postgres
DB_HOST=localhost
DB_NAME=quickzone_db
DB_PASSWORD=your_password
DB_PORT=5432

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# API
API_URL=http://localhost:3000/api
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

## 🚀 Migration Scripts

### Initial Data Setup
```sql
-- Insert default roles
INSERT INTO roles (name, description, permissions, is_system_role) VALUES
('Administration', 'Full system access', '{"dashboard": true, "personnel": {"administration": true, "commercial": true, "finance": true, "chef_agence": true, "membre_agence": true, "livreurs": true}, "expediteur": true, "colis": true, "pickup": true, "secteurs": true, "entrepots": true, "paiment_expediteur": true, "reclamation": true}', true),
('Commercial', 'Client management access', '{"dashboard": true, "expediteur": true, "paiment_expediteur": true, "reclamation": true}', true),
('Finance', 'Financial operations access', '{"dashboard": true, "personnel": {"finance": true}, "paiment_expediteur": true}', true),
('Chef d''agence', 'Agency management access', '{"dashboard": true, "personnel": {"chef_agence": true, "membre_agence": true, "livreurs": true}, "expediteur": true, "colis": true, "pickup": true, "secteurs": true, "entrepots": true, "reclamation": true}', true),
('Membre de l''agence', 'Daily operations access', '{"dashboard": true, "colis": true, "pickup": true, "reclamation": true}', true),
('Livreurs', 'Delivery operations access', '{"dashboard": true, "pickup": true}', true),
('Expéditeur', 'Client access', '{"dashboard": true, "colis": true, "paiment_expediteur": true, "reclamation": true}', true);

-- Insert default parcel status definitions
INSERT INTO parcel_status_definitions (status_code, status_name, status_name_ar, color_code, icon_class, can_transition_to, requires_approval) VALUES
('en_attente', 'En attente', 'في الانتظار', '#6B7280', 'clock', '["au_depot", "en_cours"]', false),
('au_depot', 'Au dépôt', 'في المستودع', '#3B82F6', 'package', '["en_cours", "retour_expediteur"]', false),
('en_cours', 'En cours', 'قيد التوصيل', '#F59E0B', 'truck', '["lives", "rtn_depot", "retour_definitif"]', false),
('rtn_depot', 'Retour au dépôt', 'عودة إلى المستودع', '#EF4444', 'arrow-left', '["en_cours", "retour_definitif"]', false),
('lives', 'Livrés', 'تم التوصيل', '#10B981', 'check-circle', '["lives_payes"]', false),
('lives_payes', 'Livrés et payés', 'تم التوصيل والدفع', '#059669', 'check-circle', '[]', false),
('retour_definitif', 'Retour définitif', 'عودة نهائية', '#DC2626', 'x-circle', '["rtn_client_agence"]', false),
('rtn_client_agence', 'Retour client agence', 'عودة العميل للوكالة', '#7C3AED', 'building', '["retour_expediteur"]', false),
('retour_expediteur', 'Retour expéditeur', 'عودة المرسل', '#F97316', 'user', '["retour_en_cours_expedition"]', false),
('retour_en_cours_expedition', 'Retour en cours d''expédition', 'العودة قيد الشحن', '#8B5CF6', 'truck', '["retour_recu"]', false),
('retour_recu', 'Retour reçu', 'تم استلام العودة', '#6B7280', 'package-check', '[]', false);
```

This comprehensive schema provides all the necessary tables and relationships for the QuickZone parcel delivery management system, ready for implementation with PostgreSQL and Next.js. 