# 🚚 Pickup Mission Agency Filtering Solution

## 🎯 Problem Description
The pickup mission system had a limitation where:
- **Admins** could see all missions but couldn't filter by agency
- **Chef d'agence** users couldn't properly filter missions to only see their agency's missions
- The system was relying on complex joins to determine agency information

## ✅ Solution Implemented

### 1. Database Schema Update
Added an `agency` column to the `pickup_missions` table that gets automatically populated with the driver's agency when a mission is created.

```sql
-- New column added to pickup_missions table
ALTER TABLE pickup_missions ADD COLUMN agency VARCHAR(100) NOT NULL;

-- Index for better performance
CREATE INDEX idx_pickup_missions_agency ON pickup_missions(agency);
```

### 2. Automatic Agency Population
When creating a new pickup mission:
- The system automatically gets the driver's agency from the `drivers` table
- Stores it directly in the `pickup_missions.agency` field
- No manual input required - it's filled automatically

### 3. Enhanced Security & Permissions
- **Chef d'agence** users can only assign missions to drivers in their own agency
- **Chef d'agence** users can only see missions from their agency
- **Admin** users continue to see all missions across all agencies

## 🔧 Implementation Details

### Files Modified:
1. **`backend/scripts/add_agency_to_pickup_missions.js`** - Database migration script
2. **`backend/routes/pickupMissions.js`** - Updated API endpoints
3. **`backend/test_agency_filtering.js`** - Test script to verify functionality

### Key Changes:

#### Mission Creation (`POST /pickup-missions`):
```javascript
// NEW: Include driver's agency when creating mission
const createMissionSqlQuery = `
  INSERT INTO pickup_missions (
    mission_number, driver_id, shipper_id, scheduled_date, 
    created_by, status, agency  // ← NEW agency field
  )
  VALUES ($1, $2, $3, $4, $5, 'En attente', $6)
  RETURNING id
`;

// Agency is automatically filled from driver data
const missionResult = await client.query(createMissionSqlQuery, [
  missionCode,
  livreur_id,
  shipperId,
  new Date(),
  req.user.id,
  livreur.agency  // ← Driver's agency
]);
```

#### Mission Retrieval (`GET /pickup-missions`):
```javascript
// NEW: Filter by mission agency field (not shipper agency)
if (req.user.role === 'Chef d\'agence' && userAgency) {
  missionsSqlQuery += ` AND pm.agency = $${queryParams.length + 1}`;
  queryParams.push(userAgency);
}
```

#### Agency Permission Check:
```javascript
// NEW: Check if Chef d'agence can assign to this driver's agency
if (req.user.role === 'Chef d\'agence') {
  const userAgency = userAgencyResult.rows[0].agency;
  if (userAgency !== livreur.agency) {
    return res.status(403).json({ 
      error: 'You can only assign missions to drivers in your agency'
    });
  }
}
```

## 🚀 How to Deploy

### Step 1: Run the Database Migration
```bash
cd backend
node scripts/add_agency_to_pickup_missions.js
```

### Step 2: Test the Functionality
```bash
cd backend
node test_agency_filtering.js
```

### Step 3: Restart Your Server
The changes are automatically applied to the API endpoints.

## 🧪 Testing the Solution

### For Admin Users:
- ✅ Can see all missions across all agencies
- ✅ Can assign missions to any driver
- ✅ No filtering restrictions

### For Chef d'agence Users:
- ✅ Can only see missions from their agency
- ✅ Can only assign missions to drivers in their agency
- ✅ Proper agency isolation maintained

### Example Test Scenarios:
1. **Admin creates mission** → Mission gets driver's agency automatically
2. **Chef d'agence views missions** → Only sees missions from their agency
3. **Chef d'agence tries to assign to different agency** → Gets permission error
4. **Mission filtering** → Works correctly by agency field

## 📊 Benefits of This Solution

1. **Performance**: Direct agency field instead of complex joins
2. **Security**: Proper agency isolation for Chef d'agence users
3. **Simplicity**: Automatic agency population - no manual input needed
4. **Scalability**: Index on agency field for fast filtering
5. **Maintainability**: Clean, straightforward code structure

## 🔍 Database Schema After Changes

```sql
CREATE TABLE pickup_missions (
    id SERIAL PRIMARY KEY,
    mission_number VARCHAR(20) UNIQUE NOT NULL,
    driver_id INTEGER NOT NULL,
    shipper_id INTEGER NOT NULL,
    scheduled_date TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'En attente',
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completion_code VARCHAR(20),
    agency VARCHAR(100) NOT NULL,  -- ← NEW FIELD
    FOREIGN KEY (driver_id) REFERENCES drivers(id),
    FOREIGN KEY (shipper_id) REFERENCES shippers(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Performance index
CREATE INDEX idx_pickup_missions_agency ON pickup_missions(agency);
```

## 🎉 Result
Now your pickup mission system properly supports agency-based filtering:
- **Admins** see everything
- **Chef d'agence** only see their agency's missions
- **Automatic agency assignment** from driver data
- **Secure permissions** preventing cross-agency access
- **Better performance** with direct field access

The solution is clean, secure, and maintains the existing functionality while adding the missing agency filtering capability you requested!











