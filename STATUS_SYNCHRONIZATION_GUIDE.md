# Status Synchronization Guide

## Overview

This document explains the colis status synchronization flow between the Pick-Up page and Livreur Dashboard to ensure consistent status updates across the system.

## Status Flow

The colis status follows this progression using the 13 existing statuses:

1. **"En attente"** - Initial status when pick-up mission is created
2. **"À enlever"** - When livreur accepts the mission
3. **"Enlevé"** - When livreur scans parcel codes
4. **"Au dépôt"** - When livreur completes with security code

## Database Status Mapping

### Mission Status Mapping
| French Display | Database Value | Description |
|----------------|----------------|-------------|
| En attente | scheduled | Initial status when mission is created |
| À enlever | Accepté par livreur | When driver accepts the mission |
| Enlevé | En cours de ramassage | When driver scans parcel codes |
| Au dépôt | Au dépôt | When driver completes with security code |
| Mission terminée | Mission terminée | Final status (displays as "Au dépôt") |

### Parcel Status Mapping
| Mission Status | Parcel Status | Description |
|----------------|---------------|-------------|
| Accepté par livreur | À enlever | Parcels ready for pickup |
| En cours de ramassage | Enlevé | Parcels being picked up |
| Au dépôt | Au dépôt | Parcels at depot |

## Implementation Details

### Frontend Components

#### LivreurDashboard.jsx
- **Status Mapping**: Maps French display status to database values
- **Action Handlers**: 
  - `handlePickupAction()` - Accept/refuse missions
  - `handleMissionStatusUpdate()` - Update mission status
  - `handleCompleteScanning()` - Complete parcel scanning
  - `handleSecurityCodeSubmit()` - Submit security code

#### Pickup.jsx
- **Mission Creation**: Sets initial status to "scheduled"
- **Status Display**: Shows status badges with proper colors
- **Real-time Updates**: Refreshes data after status changes

### Backend API

#### missionsPickup.js
- **Status Updates**: Updates both mission and parcel status in transaction
- **Security Code Verification**: Validates security code for mission completion
- **Parcel Synchronization**: Ensures all parcels in mission are updated together

#### Key Endpoints:
- `PUT /missions-pickup/:id` - Update mission status
- `GET /missions-pickup/:id/security-code` - Get security code
- `GET /missions-pickup` - Get missions with parcel status

## Status Transition Rules

### 1. Mission Creation
```javascript
// Pickup.jsx - handleSubmit()
const data = {
  status: 'scheduled', // Initial status
  // ... other fields
};
```

### 2. Driver Accepts Mission
```javascript
// LivreurDashboard.jsx - handlePickupAction()
const updateData = { 
  status: 'Accepté par livreur' // Maps to "À enlever"
};
```

### 3. Driver Starts Pickup
```javascript
// LivreurDashboard.jsx - handleCompleteScanning()
const updateData = { 
  status: 'En cours de ramassage' // Maps to "Enlevé"
};
```

### 4. Driver Completes Mission
```javascript
// LivreurDashboard.jsx - handleSecurityCodeSubmit()
const updateData = { 
  status: 'Au dépôt',
  securityCode: securityCode
};
```

## Database Updates

### Mission Status Update
```sql
UPDATE pickup_missions 
SET status = $1, updated_at = NOW() 
WHERE id = $2
```

### Parcel Status Update
```sql
-- Update parcels table
UPDATE parcels 
SET status = $1, updated_at = NOW() 
WHERE id = $2

-- Update mission_parcels table
UPDATE mission_parcels 
SET status = $1 
WHERE mission_id = $2 AND parcel_id = $3
```

## Security Code Generation

The security code is generated using:
```javascript
function generateMissionCode(missionNumber, driverId, date) {
  const dateStr = new Date(date).toISOString().slice(0, 10).replace(/-/g, '');
  const code = `${missionNumber.slice(-4)}${driverId}${dateStr.slice(-4)}`;
  return code.toUpperCase();
}
```

## Testing

Use the test script to verify synchronization:
```bash
cd backend
node test_status_synchronization.js
```

This will test the complete flow:
1. Create mission
2. Accept mission
3. Start pickup
4. Complete with security code
5. Verify final status

## Troubleshooting

### Common Issues

1. **Status Not Updating**: Check if transaction is properly committed
2. **Parcels Not Synchronized**: Verify parcel status mapping in backend
3. **Security Code Error**: Ensure code generation logic is consistent
4. **Display Issues**: Check status mapping in frontend components

### Debug Logs

Enable debug logging by checking console output:
- Frontend: Browser developer tools
- Backend: Server console logs
- Database: Check transaction logs

## Best Practices

1. **Always use transactions** for status updates involving multiple tables
2. **Validate status transitions** before applying updates
3. **Log all status changes** for audit purposes
4. **Test status flow** regularly with automated tests
5. **Keep status mappings consistent** between frontend and backend

## Future Enhancements

1. **Real-time Updates**: Implement WebSocket for live status updates
2. **Status History**: Track all status changes with timestamps
3. **Notifications**: Alert users when status changes
4. **Validation Rules**: Add business rules for status transitions
5. **Audit Trail**: Complete history of all status changes 