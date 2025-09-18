# Warehouse-Parcel Relationship System Guide

## 📋 Overview

This system establishes a relationship between warehouses and parcels (colis) to enable comprehensive tracking and management of parcel flow through different warehouse locations. Every parcel is automatically assigned to a warehouse based on the expediteur's (shipper's) agency location.

## 🏗️ Database Structure

### Key Tables

#### 1. **parcels** Table
```sql
-- Added warehouse_id column
ALTER TABLE parcels ADD COLUMN warehouse_id INTEGER;
ALTER TABLE parcels ADD CONSTRAINT fk_parcels_warehouse 
FOREIGN KEY (warehouse_id) REFERENCES warehouses(id);
```

#### 2. **shippers** Table
```sql
-- Added default_warehouse_id column
ALTER TABLE shippers ADD COLUMN default_warehouse_id INTEGER;
ALTER TABLE shippers ADD CONSTRAINT fk_shippers_default_warehouse 
FOREIGN KEY (default_warehouse_id) REFERENCES warehouses(id);
```

#### 3. **warehouses** Table
```sql
CREATE TABLE warehouses (
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
);
```

## 🗺️ Agency-Warehouse Mapping

The system uses a predefined mapping between agencies and warehouses:

| Agency | Warehouse ID | Warehouse Name |
|--------|-------------|---------------|
| Sousse | 11 | Entrepôt Sousse |
| Tunis | 10 | Entrepôt Tunis Central |
| Sfax | 12 | Entrepôt Sfax |
| Tozeur | 13 | Entrepôt Tozeur |
| Béja | 14 | Entrepôt Béja |

## 🔄 Automatic Assignment Process

### 1. **Shipper Registration**
When a shipper is registered or updated:
- The system checks their agency
- Automatically assigns the corresponding warehouse based on the mapping
- Updates the `default_warehouse_id` in the shippers table

### 2. **Parcel Creation**
When a new parcel is created:
- The system retrieves the shipper's `default_warehouse_id`
- Automatically assigns the warehouse to the parcel
- Stores the `warehouse_id` in the parcels table

### 3. **Existing Data Migration**
For existing parcels without warehouse assignments:
- The system updates parcels based on their shipper's agency
- Uses the agency-warehouse mapping to assign warehouses

## 📊 API Endpoints

### Parcel Management

#### Create Parcel with Warehouse Assignment
```http
POST /api/parcels
```

**Request Body:**
```json
{
  "tracking_number": "TRK123456",
  "shipper_id": 1,
  "destination": "Client Address",
  "status": "En attente",
  "weight": 1.5,
  "price": 10.00,
  "type": "Standard",
  "estimated_delivery_date": "2024-01-15",
  "delivery_fees": 2.00,
  "return_fees": 0.00,
  "recipient_name": "John Doe",
  "recipient_phone": "123456789",
  "recipient_address": "123 Main St",
  "recipient_governorate": "Tunis",
  "article_name": "Package contents",
  "remark": "Handle with care",
  "nb_pieces": 1
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "tracking_number": "TRK123456",
    "warehouse_id": 10,
    "status": "En attente",
    // ... other parcel fields
  },
  "message": "Parcel created successfully",
  "client_code": "123456",
  "warehouse_assigned": "Entrepôt Tunis Central"
}
```

#### Get Parcels with Warehouse Information
```http
GET /api/parcels?warehouse_id=10&limit=10
```

**Response includes:**
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "tracking_number": "TRK123456",
      "status": "En attente",
      "warehouse_id": 10,
      "warehouse_name": "Entrepôt Tunis Central",
      "warehouse_governorate": "Tunis",
      "warehouse_address": "123 Warehouse St",
      "shipper_name": "John Shipper",
      "shipper_agency": "Tunis"
      // ... other fields
    }
  ]
}
```

### Warehouse Management

#### Get Warehouse Statistics
```http
GET /api/warehouses/{id}/parcels-stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "warehouse": {
      "id": 10,
      "name": "Entrepôt Tunis Central",
      "governorate": "Tunis",
      "manager_name": "John Manager"
    },
    "overview": {
      "totalParcels": 150,
      "pendingParcels": 25,
      "atWarehouseParcels": 45,
      "inTransitParcels": 30,
      "deliveredParcels": 50,
      "returnedParcels": 5,
      "avgDeliveryTimeHours": 48.5,
      "parcelsCreatedToday": 12,
      "parcelsDeliveredToday": 8
    },
    "statusBreakdown": [
      {
        "status": "En attente",
        "count": 25,
        "percentage": 16.7
      },
      {
        "status": "Au dépôt",
        "count": 45,
        "percentage": 30.0
      }
    ],
    "recentParcels": [
      {
        "id": 123,
        "tracking_number": "TRK123456",
        "status": "En attente",
        "destination": "Client Address",
        "created_at": "2024-01-10T10:30:00Z",
        "shipper_name": "John Shipper",
        "shipper_agency": "Tunis"
      }
    ],
    "assignedShippers": [
      {
        "id": 1,
        "name": "John Shipper",
        "email": "john@example.com",
        "agency": "Tunis",
        "total_parcels": 50,
        "delivered_parcels": 30
      }
    ]
  }
}
```

## 🚀 Implementation Steps

### 1. **Run the Enhancement Script**
```bash
cd backend
node scripts/enhance_warehouse_parcel_relationship.js
```

This script will:
- Add necessary database columns and constraints
- Create agency-warehouse mappings
- Update existing shippers and parcels
- Create performance indexes

### 2. **Test the System**
```bash
cd backend
node test_warehouse_parcel_relationship.js
```

### 3. **Verify Functionality**
- Check that new parcels are automatically assigned warehouses
- Verify warehouse statistics are accurate
- Test warehouse filtering in parcel queries

## 📈 Benefits

### 1. **Automatic Assignment**
- No manual warehouse assignment required
- Reduces human error
- Ensures consistent warehouse allocation

### 2. **Enhanced Tracking**
- Track parcels by warehouse location
- Monitor warehouse capacity and utilization
- Analyze delivery performance by warehouse

### 3. **Improved Management**
- Warehouse-specific dashboards
- Better resource allocation
- Performance analytics by location

### 4. **Operational Efficiency**
- Streamlined parcel flow
- Better inventory management
- Optimized delivery routes

## 🔧 Maintenance

### Regular Tasks

1. **Monitor Warehouse Capacity**
   - Check current occupancy vs capacity
   - Rebalance if necessary

2. **Update Agency Mappings**
   - Add new warehouses as needed
   - Update agency assignments

3. **Performance Monitoring**
   - Track delivery times by warehouse
   - Identify bottlenecks

### Troubleshooting

#### Parcels Without Warehouse Assignment
```sql
-- Find parcels without warehouse
SELECT p.id, p.tracking_number, s.name as shipper_name, s.agency
FROM parcels p
LEFT JOIN shippers s ON p.shipper_id = s.id
WHERE p.warehouse_id IS NULL;
```

#### Fix Missing Warehouse Assignments
```sql
-- Update parcels based on shipper agency
UPDATE parcels 
SET warehouse_id = s.default_warehouse_id
FROM shippers s
WHERE parcels.shipper_id = s.id
AND parcels.warehouse_id IS NULL
AND s.default_warehouse_id IS NOT NULL;
```

## 📝 Notes

- The system automatically handles warehouse assignment during parcel creation
- Warehouse information is included in all parcel queries
- Statistics are available for each warehouse
- The system maintains referential integrity through foreign key constraints
- Performance is optimized with database indexes

## 🔮 Future Enhancements

1. **Dynamic Warehouse Assignment**
   - Route optimization based on destination
   - Load balancing between warehouses

2. **Advanced Analytics**
   - Predictive capacity planning
   - Performance benchmarking

3. **Real-time Tracking**
   - Live warehouse status updates
   - Automated notifications

4. **Multi-warehouse Operations**
   - Cross-warehouse transfers
   - Centralized inventory management 