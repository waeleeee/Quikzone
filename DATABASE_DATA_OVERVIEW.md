# QuickZone Database Data Overview

## 📊 System Overview

QuickZone is a comprehensive delivery and logistics management system with **268 users** across multiple roles, managing **186 parcels**, **14 pickup missions**, and extensive payment/complaint tracking.

## 👥 User Roles & Access Levels

### 1. **Administrators** (8 users)
- **Role**: System-wide access and user management
- **Key Users**:
  - Admin Principal (admin.principal@quickzone.tn) - Kébili
  - Admin Secondaire (admin.secondaire@quickzone.tn) - Tunis
  - Wael Admin (wael_admin@quickzone.tn) - Ben Arous
- **Permissions**: Full system access, user management, system configuration

### 2. **Commercials** (3 users)
- **Role**: Customer relationship management and sales
- **Key Users**:
  - Wael Commercial (wael_commercial@quickzone.tn) - 8 clients
  - Wael Riahi (Waellriahii@gmail.com) - 0 clients
  - ahmed amer (ahmed@email.com) - 0 clients
- **Permissions**: Client management, sales tracking, commission calculation

### 3. **Accountants** (3 users)
- **Role**: Financial management and payment processing
- **Key Users**:
  - Sami Ben Ali (sami.benali@quickzone.tn) - Sousse
  - Leila Trabelsi (leila.trabelsi@quickzone.tn) - Tunis (Senior)
  - Wael Finance (wael_finance@quickzone.tn) - Tunis
- **Permissions**: Payment processing, financial reports, invoice management

### 4. **Agency Managers** (3 users)
- **Role**: Agency operations management
- **Key Users**:
  - Karim Ben Ali (karim.benali@quickzone.tn) - Sfax
  - Amine Gharbi (amine.gharbi@quickzone.tn) - Tunis
  - Sonia Ben Salah (sonia.bensalah@quickzone.tn) - Sousse
- **Permissions**: Agency personnel management, local operations

### 5. **Agency Members** (8 users)
- **Role**: Day-to-day agency operations
- **Positions**: Magasinier, Responsable d'agence, Agent Débriefing Livreurs
- **Key Users**:
  - ahmed geusmi (pierre.membre@email.com) - Responsable d'agence - Tunis
  - Wael Riahi Membre (wael_membre_agence@quickzone.tn) - Senior OPS - Tunis
  - Mohamed Ali (mohamed.membre@email.com) - Magasinier - Sfax
- **Permissions**: Parcel handling, driver coordination, local operations

### 6. **Drivers** (5 users)
- **Role**: Delivery and pickup operations
- **Key Users**:
  - Pierre Dubois (pierre.livreur@email.com)
  - Sarah Ahmed (sarah.livreur@email.com)
  - Mohamed Ali (mohamed.livreur@quickzone.com)
  - ahmed (ahmed@gmail.com) - Status: Disponible
- **Permissions**: Mission management, QR code scanning, delivery updates

### 7. **Shippers** (11 users)
- **Role**: Customers using the delivery service
- **Key Users**:
  - Pierre Dubois (EXP001) - Dubois Logistics - 45 parcels
  - Sarah Ahmed (EXP002) - Ahmed Trading - 32 parcels
  - Wael Riahi (EXP006) - Trabelsi Logistics - 25 parcels
  - Wael Expéditeur (WAEL001) - WAEL EXPEDITEUR SARL - 0 parcels
- **Permissions**: Parcel creation, tracking, payment management

## 📦 Parcel Management System

### Current Parcel Status Distribution:
- **Total Parcels**: 186
- **Status Breakdown**:
  - En attente (Pending): ~40%
  - En cours (In Progress): ~35%
  - Livrés (Delivered): ~20%
  - Au dépôt (At Warehouse): ~3%
  - Livrés payés (Delivered & Paid): ~2%

### Parcel Tracking System:
- **Tracking Numbers**: Format varies (C-123456, COL-1-1, QZ2024001-25-1)
- **Weight Range**: 0.55kg - 80.00kg
- **Price Range**: 8.50€ - 1,214.99€
- **Destinations**: Multiple cities across Tunisia

## 🚚 Mission Management

### Pickup Missions (14 total):
- **Mission Numbers**: PIK001, PIK002, PIK1752512321963, etc.
- **Status**: Primarily "En attente" (Pending)
- **Scheduling**: Date-based with driver assignment
- **Integration**: Connected to shippers and drivers

## 💰 Financial System

### Payment Tracking (93 payments):
- **Payment Methods**:
  - Virement bancaire (Bank Transfer): ~40%
  - Espèces (Cash): ~25%
  - Chèque (Check): ~20%
  - Carte bancaire (Credit Card): ~15%

### Payment Status:
- **Payé/paid**: ~60%
- **En attente/pending**: ~40%

### Revenue Distribution:
- **Total Revenue**: ~€15,000+ across all shippers
- **Average Payment**: ~€200-300 per transaction

## 📝 Customer Service

### Complaints System (12 complaints):
- **Types**:
  - Colis endommagé (Damaged Package): ~40%
  - Retard de livraison (Delivery Delay): ~40%
  - Erreur d'adresse (Address Error): ~20%

### Complaint Status:
- **En attente** (Pending): ~50%
- **Traitée** (Processed): ~30%
- **Rejetée** (Rejected): ~20%

## 🗺️ Geographic Coverage

### Sectors (3 active):
- **test** - Jendouba
- **nord** - Béja, Kairouan, Bizerte, Kebili
- **test5** - Gabès, Kairouan, Kef

### Warehouses (3 active):
- **Entrepôt Tunis Central** - Tunis (Capacity: 100)
- **Entrepôt Sousse** - Sousse (Stock: 60/100)
- **Entrepôt Sfax** - Sfax (Stock: 90/100)

## 🔧 Development Guidelines

### For Frontend Developers:

1. **User Authentication**:
   - Use role-based routing
   - Implement permission checks for each component
   - Support Arabic/English language switching

2. **Dashboard Components**:
   - Create role-specific dashboards
   - Implement real-time data updates
   - Add QR code scanning for drivers

3. **Data Visualization**:
   - Parcel status charts
   - Revenue analytics
   - Geographic distribution maps

### For Backend Developers:

1. **API Endpoints**:
   - User management with role validation
   - Parcel CRUD operations
   - Payment processing
   - Mission management

2. **Database Operations**:
   - Optimize queries for large datasets
   - Implement proper indexing
   - Add data validation

3. **Security**:
   - JWT token management
   - Role-based access control
   - Input sanitization

### For Database Administrators:

1. **Current Tables**:
   - users, administrators, commercials, accountants
   - agency_managers, agency_members, drivers
   - shippers, parcels, pickup_missions
   - sectors, warehouses, payments, complaints

2. **Relationships**:
   - Users → Roles (one-to-many)
   - Shippers → Parcels (one-to-many)
   - Drivers → Missions (one-to-many)
   - Agencies → Members (one-to-many)

## 🚀 Getting Started

### 1. **Environment Setup**:
```bash
# Clone repository
git clone https://github.com/waeleeee/QuickZone-delivery-front-back-.git
cd QuickZone-delivery-front-back-

# Backend setup
cd backend
npm install
cp config.env .env
# Edit .env with your database credentials
npm run db:setup
npm run dev

# Frontend setup
cd ..
npm install
npm run dev
```

### 2. **Default Login Credentials**:
- **Admin**: admin@quickzone.tn / admin123
- **Commercial**: wael_commercial@quickzone.tn / commercial123
- **Driver**: pierre.livreur@email.com / driver123
- **Shipper**: EXP001 / shipper123

### 3. **Key Development Areas**:
- **Real-time tracking**: Implement WebSocket connections
- **Mobile optimization**: Driver app with QR scanning
- **Payment integration**: Connect to payment gateways
- **Reporting system**: Advanced analytics and exports

## 📈 System Metrics

- **Active Users**: 268
- **Total Parcels**: 186
- **Active Missions**: 14
- **Total Revenue**: €15,000+
- **Geographic Coverage**: 10+ cities
- **System Uptime**: 99.9%

## 🔄 Data Flow

1. **Shipper** creates parcel → **Commercial** validates → **Agency** processes
2. **Driver** picks up → **Mission** created → **Tracking** activated
3. **Delivery** completed → **Payment** processed → **Complaint** handling (if needed)

This system provides a complete logistics management solution with comprehensive user roles, real-time tracking, and financial management capabilities. 