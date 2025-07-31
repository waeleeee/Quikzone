# QuickZone Database Tables Summary

## 📊 Complete Table List

### 🔐 Authentication & Users (4 tables)
1. **`users`** - Main user accounts with authentication data
2. **`roles`** - System roles and permissions
3. **`user_roles`** - Role assignments to users
4. **`user_sessions`** - Session management and tracking

### 👥 Client Management (2 tables)
5. **`clients`** - Client companies/individuals with contact info
6. **`client_users`** - Client user account associations

### 📦 Parcel Management (4 tables)
7. **`parcels`** - Main parcel information and tracking
8. **`parcel_tracking`** - Parcel status history and updates
9. **`parcel_status_definitions`** - Status configuration and workflow
10. **`parcel_attachments`** - Parcel documents and files

### 🏢 Operations & Logistics (5 tables)
11. **`warehouses`** - Storage facilities and capacity
12. **`delivery_zones`** - Delivery areas and postal codes
13. **`pickup_missions`** - Pickup assignments for drivers
14. **`delivery_missions`** - Delivery assignments for drivers
15. **`mission_parcels`** - Parcels assigned to missions

### 💰 Financial Management (3 tables)
16. **`invoices`** - Client invoices and billing
17. **`invoice_items`** - Invoice line items and details
18. **`payments`** - Client payments and transactions

### 🎯 Customer Service (2 tables)
19. **`complaints`** - Customer complaints and issues
20. **`complaint_updates`** - Complaint progress updates

### 📊 System & Analytics (3 tables)
21. **`system_logs`** - Audit trail and system events
22. **`notifications`** - System notifications for users
23. **`analytics_events`** - User behavior tracking

## 🔗 Key Relationships

### User Management Flow
```
users ←→ user_roles ←→ roles
users ←→ user_sessions
```

### Client & Parcel Flow
```
clients ←→ client_users ←→ users
clients → parcels → parcel_tracking
parcels → parcel_attachments
```

### Operations Flow
```
warehouses → parcels
delivery_zones → parcels
pickup_missions → mission_parcels → parcels
delivery_missions → mission_parcels → parcels
users (drivers) → pickup_missions
users (drivers) → delivery_missions
```

### Financial Flow
```
clients → invoices → invoice_items
clients → payments
invoices → payments
```

### Customer Service Flow
```
clients → complaints → complaint_updates
parcels → complaints
```

## 📋 Table Purposes by Module

### Dashboard & Analytics
- `system_logs` - Track all system activities
- `analytics_events` - User behavior analytics
- `notifications` - System alerts and updates

### User Management
- `users` - All system users
- `roles` - Role definitions
- `user_roles` - Role assignments
- `user_sessions` - Session management

### Client Management
- `clients` - Client information
- `client_users` - Client user accounts

### Parcel Operations
- `parcels` - Main parcel data
- `parcel_tracking` - Status history
- `parcel_status_definitions` - Status workflow
- `parcel_attachments` - Documents

### Logistics
- `warehouses` - Storage facilities
- `delivery_zones` - Service areas
- `pickup_missions` - Pickup operations
- `delivery_missions` - Delivery operations
- `mission_parcels` - Mission assignments

### Financial
- `invoices` - Billing
- `invoice_items` - Invoice details
- `payments` - Payment tracking

### Customer Service
- `complaints` - Issue tracking
- `complaint_updates` - Progress updates

## 🎯 Role-Based Access by Table

### Administration (Full Access)
- All tables

### Commercial
- `clients`, `client_users`
- `parcels` (view only)
- `invoices`, `payments`
- `complaints`

### Finance
- `invoices`, `invoice_items`, `payments`
- `clients` (financial data only)
- `parcels` (billing info only)

### Chef d'agence
- `users` (agency members)
- `parcels`, `pickup_missions`, `delivery_missions`
- `warehouses`, `delivery_zones`
- `complaints` (agency scope)

### Membre de l'agence
- `parcels` (full access)
- `pickup_missions`, `delivery_missions`
- `complaints`

### Livreurs
- `parcels` (assigned only)
- `pickup_missions`, `delivery_missions` (assigned only)

### Expéditeur (Client)
- `parcels` (own parcels only)
- `payments` (own payments)
- `complaints` (own complaints)

## 🚀 Implementation Notes

### Database Setup
- Use PostgreSQL with UTF-8 encoding
- Enable `uuid-ossp` and `pg_trgm` extensions
- Implement proper indexing for performance

### Security Considerations
- Hash all passwords with bcrypt
- Use JWT for session management
- Implement role-based access control
- Log all critical operations

### Performance Optimization
- Use appropriate indexes for frequent queries
- Implement full-text search for parcels and clients
- Use JSONB for flexible data storage
- Implement connection pooling

### Next.js Integration
- Create API routes for each table
- Implement proper error handling
- Use environment variables for configuration
- Implement proper authentication middleware 