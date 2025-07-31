# QuickZone Database - Entity Relationship Diagram

## 🗂️ Database Structure Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     USERS       │    │      ROLES      │    │   USER_ROLES    │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ id (PK)         │    │ id (PK)         │    │ id (PK)         │
│ username        │    │ name            │    │ user_id (FK)    │
│ email           │    │ description     │    │ role_id (FK)    │
│ password_hash   │    │ permissions     │    │ assigned_by     │
│ first_name      │    │ is_system_role  │    │ assigned_at     │
│ last_name       │    │ created_at      │    │ expires_at      │
│ phone           │    │ updated_at      │    │ is_active       │
│ avatar_url      │    └─────────────────┘    └─────────────────┘
│ is_active       │
│ email_verified  │
│ last_login      │
│ created_at      │
│ updated_at      │
└─────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     CLIENTS     │    │  CLIENT_USERS   │    │    PARCELS      │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ id (PK)         │    │ id (PK)         │    │ id (PK)         │
│ company_name    │    │ client_id (FK)  │    │ tracking_number │
│ contact_person  │    │ user_id (FK)    │    │ client_id (FK)  │
│ email           │    │ access_level    │    │ sender_name     │
│ phone           │    │ is_primary      │    │ sender_phone    │
│ address         │    │ created_at      │    │ sender_address  │
│ city            │    └─────────────────┘    │ recipient_name  │
│ postal_code     │                           │ recipient_phone │
│ country         │                           │ recipient_address│
│ sector          │                           │ weight          │
│ status          │                           │ dimensions      │
│ credit_limit    │                           │ package_type    │
│ current_balance │                           │ service_type    │
│ payment_terms   │                           │ declared_value  │
│ assigned_commercial_id │                   │ insurance_amount │
│ created_by      │                           │ status          │
│ created_at      │                           │ pickup_date     │
│ updated_at      │                           │ estimated_delivery_date │
└─────────────────┘                           │ actual_delivery_date │
         │                                     │ price           │
         │ 1:N                                 │ tax_amount      │
         ▼                                     │ total_amount    │
┌─────────────────┐                           │ assigned_driver_id │
│   WAREHOUSES    │                           │ assigned_warehouse_id │
├─────────────────┤                           │ special_instructions │
│ id (PK)         │                           │ signature_required │
│ name            │                           │ created_by      │
│ address         │                           │ created_at      │
│ city            │                           │ updated_at      │
│ postal_code     │                           └─────────────────┘
│ phone           │                                    │
│ email           │                                    │ 1:N
│ manager_id      │                                    ▼
│ capacity        │                           ┌─────────────────┐
│ current_occupancy │                         │ PARCEL_TRACKING │
│ is_active       │                           ├─────────────────┤
│ created_at      │                           │ id (PK)         │
│ updated_at      │                           │ parcel_id (FK)  │
└─────────────────┘                           │ status          │
         │                                     │ location        │
         │ 1:N                                 │ latitude        │
         ▼                                     │ longitude       │
┌─────────────────┐                           │ notes           │
│ PICKUP_MISSIONS │                           │ updated_by      │
├─────────────────┤                           │ created_at      │
│ id (PK)         │                           └─────────────────┘
│ mission_number  │
│ driver_id (FK)  │
│ warehouse_id (FK) │
│ client_id (FK)  │
│ pickup_date     │
│ pickup_time_slot │
│ estimated_parcels │
│ actual_parcels  │
│ status          │
│ start_time      │
│ end_time        │
│ notes           │
│ created_by      │
│ created_at      │
│ updated_at      │
└─────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ DELIVERY_MISSIONS │  │ MISSION_PARCELS │  │    INVOICES     │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ id (PK)         │    │ id (PK)         │    │ id (PK)         │
│ mission_number  │    │ mission_id (FK) │    │ invoice_number  │
│ driver_id (FK)  │    │ parcel_id (FK)  │    │ client_id (FK)  │
│ warehouse_id (FK) │  │ mission_type    │    │ invoice_date    │
│ delivery_date   │    │ sequence_order  │    │ due_date        │
│ estimated_parcels │  │ status          │    │ subtotal        │
│ actual_parcels  │    │ completed_at    │    │ tax_amount      │
│ status          │    │ notes           │    │ discount_amount │
│ start_time      │    └─────────────────┘    │ total_amount    │
│ end_time        │                           │ status          │
│ route_data      │                           │ paid_amount     │
│ notes           │                           │ paid_date       │
│ created_by      │                           │ notes           │
│ created_at      │                           │ created_by      │
│ updated_at      │                           │ created_at      │
└─────────────────┘                           │ updated_at      │
                                              └─────────────────┘
                                                       │
                                                       │ 1:N
                                                       ▼
                                              ┌─────────────────┐
                                              │ INVOICE_ITEMS   │
                                              ├─────────────────┤
                                              │ id (PK)         │
                                              │ invoice_id (FK) │
                                              │ parcel_id (FK)  │
                                              │ description     │
                                              │ quantity        │
                                              │ unit_price      │
                                              │ total_price     │
                                              └─────────────────┘
                                                       │
                                                       │ 1:N
                                                       ▼
                                              ┌─────────────────┐
                                              │    PAYMENTS     │
                                              ├─────────────────┤
                                              │ id (PK)         │
                                              │ payment_number  │
                                              │ client_id (FK)  │
                                              │ invoice_id (FK) │
                                              │ payment_date    │
                                              │ amount          │
                                              │ payment_method  │
                                              │ reference_number │
                                              │ status          │
                                              │ notes           │
                                              │ processed_by    │
                                              │ created_at      │
                                              │ updated_at      │
                                              └─────────────────┘
```

## 🔗 Key Relationships

### 1. **User Management**
- **Users** ↔ **Roles** (Many-to-Many via User_Roles)
- **Users** → **User_Sessions** (One-to-Many)

### 2. **Client Management**
- **Clients** → **Client_Users** (One-to-Many)
- **Clients** → **Parcels** (One-to-Many)
- **Clients** → **Invoices** (One-to-Many)
- **Clients** → **Payments** (One-to-Many)
- **Clients** → **Complaints** (One-to-Many)

### 3. **Parcel Operations**
- **Parcels** → **Parcel_Tracking** (One-to-Many)
- **Parcels** → **Parcel_Attachments** (One-to-Many)
- **Parcels** → **Mission_Parcels** (One-to-Many)
- **Parcels** → **Invoice_Items** (One-to-Many)
- **Parcel_Status_Definitions** → **Parcel_Tracking** (One-to-Many)

### 4. **Delivery Operations**
- **Pickup_Missions** → **Mission_Parcels** (One-to-Many)
- **Delivery_Missions** → **Mission_Parcels** (One-to-Many)
- **Warehouses** → **Parcels** (One-to-Many)
- **Users** (Drivers) → **Parcels** (One-to-Many)

### 5. **Financial Flow**
- **Invoices** → **Invoice_Items** (One-to-Many)
- **Invoices** → **Payments** (One-to-Many)
- **Parcels** → **Invoice_Items** (One-to-Many)

### 6. **Customer Service**
- **Complaints** → **Complaint_Updates** (One-to-Many)
- **Parcels** → **Complaints** (One-to-Many)

## 📦 Parcel Status System

### Status Workflow Diagram
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ En attente  │───▶│ Au dépôt    │───▶│ En cours    │───▶│ Livés       │───▶│ Livrés payés│
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ RTN dépot   │    │ Retour      │    │ RTN client  │    │ Retour      │
│             │    │ définitif   │    │ agence      │    │ Expéditeur  │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Retour      │    │ Retour En   │    │ Retour reçu │    │ [Final]     │
│ Expéditeur  │───▶│ Cours       │───▶│             │    │             │
│             │    │ d'expédition│    │             │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### Status Definitions Table
The `parcel_status_definitions` table contains:
- **status_code**: Internal identifier (e.g., 'en_attente', 'lives')
- **status_name**: Display name in French (e.g., 'En attente', 'Livés')
- **status_name_ar**: Display name in Arabic
- **color_code**: Hex color for UI display
- **icon_class**: CSS icon class
- **can_transition_to**: JSON array of allowed next statuses
- **requires_approval**: Boolean for approval workflow

### Status Transition Rules
- Each status has defined allowed transitions
- Some transitions require manager approval
- Status history is maintained in `parcel_tracking` table
- Business logic is enforced at application level

## 📊 Database Implementation Guide

### 1. **Setup Scripts**

#### Create Database
```sql
CREATE DATABASE quickzone_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE quickzone_db;
```

#### Enable JSON Support
```sql
-- Ensure JSON functions are available
SET GLOBAL sql_mode = 'STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO';
```

### 2. **Migration Strategy**

#### Phase 1: Core Tables
1. Users & Authentication
2. Roles & Permissions
3. Clients & Client Users

#### Phase 2: Operations
1. Warehouses & Delivery Zones
2. Parcels & Tracking
3. Pickup & Delivery Missions

#### Phase 3: Financial
1. Invoices & Invoice Items
2. Payments
3. Financial Reports

#### Phase 4: Customer Service
1. Complaints & Updates
2. Notifications
3. Analytics

### 3. **Data Seeding**

#### Default Roles
```sql
-- Insert system roles
INSERT INTO roles (name, description, permissions, is_system_role) VALUES
('Administration', 'Full system access', JSON_OBJECT(
  'dashboard', true,
  'personnel', JSON_OBJECT(
    'administration', true,
    'commercial', true,
    'finance', true,
    'chef_agence', true,
    'membre_agence', true,
    'livreurs', true
  ),
  'expediteur', true,
  'colis', true,
  'pickup', true,
  'secteurs', true,
  'entrepots', true,
  'paiment_expediteur', true,
  'reclamation', true
), true);
```

#### Default Admin User
```sql
-- Create admin user (password: admin123)
INSERT INTO users (username, email, password_hash, first_name, last_name, is_active, email_verified) VALUES
('admin', 'admin@quickzone.tn', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'QuickZone', true, true);

-- Assign admin role
INSERT INTO user_roles (user_id, role_id, assigned_by) VALUES (1, 1, 1);
```

### 4. **Performance Optimization**

#### Indexing Strategy
```sql
-- Composite indexes for common queries
CREATE INDEX idx_parcels_tracking_status ON parcels(tracking_number, status);
CREATE INDEX idx_parcels_client_status ON parcels(client_id, status);
CREATE INDEX idx_parcels_driver_date ON parcels(assigned_driver_id, estimated_delivery_date);

-- Full-text search indexes
CREATE FULLTEXT INDEX idx_parcels_search ON parcels(tracking_number, sender_name, recipient_name);
CREATE FULLTEXT INDEX idx_clients_search ON clients(company_name, contact_person, email);
```

#### Partitioning Strategy
```sql
-- Partition parcels table by date
ALTER TABLE parcels PARTITION BY RANGE (YEAR(created_at)) (
    PARTITION p2023 VALUES LESS THAN (2024),
    PARTITION p2024 VALUES LESS THAN (2025),
    PARTITION p2025 VALUES LESS THAN (2026),
    PARTITION p_future VALUES LESS THAN MAXVALUE
);
```

### 5. **Backup Strategy**

#### Automated Backups
```bash
#!/bin/bash
# backup_quickzone.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/quickzone"
DB_NAME="quickzone_db"

# Create backup directory
mkdir -p $BACKUP_DIR

# Full database backup
mysqldump --single-transaction --routines --triggers \
  --user=quickzone_user --password=secure_password \
  $DB_NAME > $BACKUP_DIR/quickzone_full_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/quickzone_full_$DATE.sql

# Keep only last 30 days of backups
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
```

### 6. **Monitoring & Maintenance**

#### Performance Monitoring
```sql
-- Check slow queries
SELECT * FROM mysql.slow_log WHERE start_time > DATE_SUB(NOW(), INTERVAL 1 DAY);

-- Check table sizes
SELECT 
    table_name,
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)'
FROM information_schema.tables 
WHERE table_schema = 'quickzone_db'
ORDER BY (data_length + index_length) DESC;
```

#### Regular Maintenance
```sql
-- Optimize tables weekly
OPTIMIZE TABLE parcels, parcel_tracking, system_logs;

-- Analyze table statistics
ANALYZE TABLE parcels, clients, invoices;

-- Check for orphaned records
SELECT COUNT(*) as orphaned_parcels 
FROM parcels p 
LEFT JOIN clients c ON p.client_id = c.id 
WHERE c.id IS NULL;
```

This database structure provides a robust foundation for the QuickZone system, supporting all the functionality we've implemented while ensuring scalability, security, and performance. 