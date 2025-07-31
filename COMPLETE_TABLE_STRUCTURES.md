# 🗄️ Complete Database Table Structures for QuickZone

## 📋 **All Tables Used in QuickZone Database**

This document contains the complete structure of every table used in your QuickZone project.

---

## 👥 **1. USERS & AUTHENTICATION TABLES**

### **`users` - Main User Accounts**
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
```

### **`roles` - System Roles**
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

### **`user_roles` - Role Assignments**
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
```

### **`user_sessions` - Session Management**
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
```

---

## 🏢 **2. CLIENT MANAGEMENT TABLES**

### **`clients` - Client Companies/Individuals**
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
    payment_terms INTEGER DEFAULT 30,
    assigned_commercial_id INTEGER,
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_commercial_id) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT idx_email UNIQUE (email)
);
```

### **`client_users` - Client User Accounts**
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
```

---

## 📦 **3. PARCEL MANAGEMENT TABLES**

### **`parcels` - Main Parcel Information**
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
    
    weight DECIMAL(8,3) NOT NULL,
    dimensions VARCHAR(50),
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
```

### **`parcel_tracking` - Parcel Status History**
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
```

### **`parcel_status_definitions` - Status Definitions**
```sql
CREATE TABLE parcel_status_definitions (
    id SERIAL PRIMARY KEY,
    status_code VARCHAR(50) UNIQUE NOT NULL,
    status_name VARCHAR(100) NOT NULL,
    status_name_ar VARCHAR(100),
    description TEXT,
    color_code VARCHAR(7) DEFAULT '#6B7280',
    icon_class VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    sequence_order INTEGER DEFAULT 0,
    can_transition_to JSONB,
    requires_approval BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT idx_status_code UNIQUE (status_code)
);
```

### **`parcel_attachments` - Documents and Images**
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
```

---

## 🚚 **4. MISSION MANAGEMENT TABLES**

### **`pickup_missions` - Pickup Assignments**
```sql
CREATE TABLE pickup_missions (
    id SERIAL PRIMARY KEY,
    mission_number VARCHAR(50) UNIQUE NOT NULL,
    driver_id INTEGER NOT NULL,
    warehouse_id INTEGER NOT NULL,
    client_id INTEGER NOT NULL,
    
    pickup_date DATE NOT NULL,
    pickup_time_slot VARCHAR(20),
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
```

### **`delivery_missions` - Delivery Assignments**
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
    
    route_data JSON,
    notes TEXT,
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (driver_id) REFERENCES users(id),
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);
```

### **`mission_parcels` - Parcels Assigned to Missions**
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
    
    UNIQUE KEY unique_mission_parcel (mission_id, parcel_id, mission_type)
);
```

---

## 🏢 **5. AGENCY & PERSONNEL TABLES**

### **`agencies` - Agency Information**
```sql
CREATE TABLE agencies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(50) NOT NULL,
    postal_code VARCHAR(10),
    phone VARCHAR(20),
    email VARCHAR(100),
    manager_id INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (manager_id) REFERENCES users(id)
);
```

### **`agency_managers` - Agency Managers**
```sql
CREATE TABLE agency_managers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    agency_id INTEGER NOT NULL,
    assigned_sectors JSONB,
    permissions JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (agency_id) REFERENCES agencies(id),
    CONSTRAINT unique_agency_manager UNIQUE (user_id, agency_id)
);
```

### **`agency_members` - Agency Staff**
```sql
CREATE TABLE agency_members (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    agency_id INTEGER NOT NULL,
    position VARCHAR(50) NOT NULL,
    department VARCHAR(50),
    hire_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave', 'terminated')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (agency_id) REFERENCES agencies(id),
    CONSTRAINT unique_agency_member UNIQUE (user_id, agency_id)
);
```

### **`sectors` - Geographic Sectors**
```sql
CREATE TABLE sectors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    cities JSONB NOT NULL,
    manager_id INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (manager_id) REFERENCES users(id)
);
```

---

## 🏪 **6. WAREHOUSE & INVENTORY TABLES**

### **`warehouses` - Storage Facilities**
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
    capacity INTEGER,
    current_occupancy INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (manager_id) REFERENCES users(id)
);
```

### **`warehouse_inventory` - Stock Management**
```sql
CREATE TABLE warehouse_inventory (
    id SERIAL PRIMARY KEY,
    warehouse_id INTEGER NOT NULL,
    parcel_id INTEGER NOT NULL,
    location_code VARCHAR(50),
    status VARCHAR(20) DEFAULT 'stored' CHECK (status IN ('received', 'stored', 'picked', 'shipped')),
    received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    picked_at TIMESTAMP NULL,
    shipped_at TIMESTAMP NULL,
    notes TEXT,
    
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
    FOREIGN KEY (parcel_id) REFERENCES parcels(id),
    CONSTRAINT unique_warehouse_parcel UNIQUE (warehouse_id, parcel_id)
);
```

---

## 💰 **7. FINANCIAL MANAGEMENT TABLES**

### **`invoices` - Client Invoices**
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
    FOREIGN KEY (created_by) REFERENCES users(id)
);
```

### **`invoice_items` - Invoice Line Items**
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
    FOREIGN KEY (parcel_id) REFERENCES parcels(id)
);
```

### **`payments` - Payment Records**
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
    FOREIGN KEY (processed_by) REFERENCES users(id)
);
```

---

## 📝 **8. CUSTOMER SERVICE TABLES**

### **`complaints` - Customer Complaints**
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
    FOREIGN KEY (created_by) REFERENCES users(id)
);
```

### **`complaint_attachments` - Complaint Files**
```sql
CREATE TABLE complaint_attachments (
    id SERIAL PRIMARY KEY,
    complaint_id INTEGER NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50),
    file_size BIGINT,
    uploaded_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
);
```

### **`complaint_updates` - Complaint Progress Tracking**
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
    FOREIGN KEY (updated_by) REFERENCES users(id)
);
```

---

## 🔧 **9. SYSTEM & ANALYTICS TABLES**

### **`system_logs` - Application Logs**
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
    
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### **`notifications` - System Notifications**
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
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### **`analytics_events` - User Behavior Tracking**
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
    
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## 📊 **10. PERFORMANCE INDEXES**

### **Critical Indexes for Performance**
```sql
-- Users & Authentication
CREATE INDEX idx_users_active ON users(is_active);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);

-- Clients
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_clients_commercial ON clients(assigned_commercial_id);
CREATE INDEX idx_client_users_client_id ON client_users(client_id);
CREATE INDEX idx_client_users_user_id ON client_users(user_id);

-- Parcels
CREATE INDEX idx_parcels_client ON parcels(client_id);
CREATE INDEX idx_parcels_status ON parcels(status);
CREATE INDEX idx_parcels_driver ON parcels(assigned_driver_id);
CREATE INDEX idx_parcels_created_at ON parcels(created_at);
CREATE INDEX idx_parcels_delivery_date ON parcels(estimated_delivery_date);
CREATE INDEX idx_parcels_tracking_status ON parcels(tracking_number, status);
CREATE INDEX idx_parcels_client_status ON parcels(client_id, status);
CREATE INDEX idx_parcels_driver_date ON parcels(assigned_driver_id, estimated_delivery_date);

-- Parcel Tracking
CREATE INDEX idx_parcel_tracking_parcel_id ON parcel_tracking(parcel_id);
CREATE INDEX idx_parcel_tracking_status ON parcel_tracking(status);
CREATE INDEX idx_parcel_tracking_created_at ON parcel_tracking(created_at);

-- Parcel Attachments
CREATE INDEX idx_parcel_attachments_parcel_id ON parcel_attachments(parcel_id);
CREATE INDEX idx_parcel_attachments_type ON parcel_attachments(attachment_type);

-- Missions
CREATE INDEX idx_pickup_missions_driver ON pickup_missions(driver_id);
CREATE INDEX idx_pickup_missions_date ON pickup_missions(pickup_date);
CREATE INDEX idx_pickup_missions_status ON pickup_missions(status);
CREATE INDEX idx_pickup_missions_driver_date ON pickup_missions(driver_id, pickup_date, status);

-- Warehouses
CREATE INDEX idx_warehouses_city ON warehouses(city);
CREATE INDEX idx_warehouses_active ON warehouses(is_active);

-- Financial
CREATE INDEX idx_invoices_client_status ON invoices(client_id, status, due_date);
CREATE INDEX idx_payments_client_date ON payments(client_id, payment_date, status);

-- Complaints
CREATE INDEX idx_complaints_client ON complaints(client_id);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_priority ON complaints(priority);
CREATE INDEX idx_complaints_assigned ON complaints(assigned_to);

-- System
CREATE INDEX idx_system_logs_user ON system_logs(user_id);
CREATE INDEX idx_system_logs_action ON system_logs(action);
CREATE INDEX idx_system_logs_created_at ON system_logs(created_at);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
```

---

## 🔄 **11. DATABASE RELATIONSHIPS**

### **Key Relationships:**
1. **Users → User Roles → Roles** (Many-to-Many)
2. **Clients → Parcels** (One-to-Many)
3. **Users → Parcels** (Driver assignment)
4. **Warehouses → Parcels** (Storage assignment)
5. **Pickup/Delivery Missions → Parcels** (Mission assignment)
6. **Clients → Invoices → Payments** (Financial flow)
7. **Clients → Complaints** (Customer service)
8. **Agencies → Agency Managers/Members** (One-to-Many)
9. **Sectors → Managers** (One-to-Many)

---

## 📈 **12. TABLE STATISTICS**

### **Current Data Counts:**
- **users**: 305 records
- **parcels**: 57 records
- **pickup_missions**: 10 records
- **payments**: 3 records
- **complaints**: 6 records
- **warehouses**: 3 records
- **sectors**: 3 records
- **clients**: Multiple records
- **invoices**: Multiple records

---

**This is the complete structure of all tables used in your QuickZone database! 🎉** 