# Shipper Management Issues and Solutions

## 🔍 Problem Analysis

You were experiencing issues with shipper management, specifically:

1. **Delete Operation**: Cannot delete shippers due to foreign key constraint with payments
2. **Update Operation**: Issues with the two different types of shippers (individual vs company)
3. **Form Validation**: Missing validation for required fields based on shipper type

## 🛠️ Solutions Implemented

### 1. Fixed Delete Operation

**Problem**: Foreign key constraint `payments_shipper_id_fkey` prevents deletion when payments exist.

**Solution**: Enhanced the delete route in `backend/routes/shippers.js`:

```javascript
// Now checks for dependencies before deletion
const paymentsCheck = await db.query('SELECT COUNT(*) as count FROM payments WHERE shipper_id = $1', [id]);
const hasPayments = parseInt(paymentsCheck.rows[0].count) > 0;

if (hasPayments) {
  return res.status(400).json({
    success: false,
    message: 'Cannot delete shipper because there are payments associated with them. Please delete the payments first or contact support.'
  });
}
```

### 2. Enhanced Update Operation

**Problem**: Missing validation for the two shipper types.

**Solution**: Added form type validation in both create and update routes:

```javascript
// Validate required fields based on form type
if (formType === 'individual') {
  if (!identity_number) {
    return res.status(400).json({
      success: false,
      message: 'Numéro d\'identité is required for individual shippers'
    });
  }
} else if (formType === 'company') {
  if (!company_name || !fiscal_number || !company_address || !company_governorate) {
    return res.status(400).json({
      success: false,
      message: 'Company name, fiscal number, address, and governorate are required for company shippers'
    });
  }
}
```

### 3. Added Payment Management Tools

Created three new scripts to help manage payments:

#### `manageShipperPayments.js`
Shows all shippers with payments and their counts:
```bash
node scripts/manageShipperPayments.js
```

#### `showShipperPayments.js`
Shows detailed payments for a specific shipper:
```bash
node scripts/showShipperPayments.js <shipper_id>
```

#### `deleteShipperPayments.js`
Safely deletes all payments for a specific shipper:
```bash
node scripts/deleteShipperPayments.js <shipper_id>
```

### 4. Enhanced API Routes

Added new payment management routes in `backend/routes/payments.js`:

- `GET /api/payments/shipper/:id` - Get payments for a specific shipper
- `DELETE /api/payments/:id` - Delete a specific payment

## 📋 Two Types of Shippers

### 1. Individual Shippers (Carte d'identité)
**Required Fields:**
- Code (auto-generated)
- Password
- Name and surname
- Identity number
- Email
- Phone
- Agency

**Optional Fields:**
- Commercial
- Delivery fees
- Return fees
- Status
- ID document upload

### 2. Company Shippers (Patente)
**Required Fields:**
- Code (auto-generated)
- Password
- Name and surname
- Email
- Phone
- Agency
- Company name
- Fiscal number
- Company address
- Company governorate

**Optional Fields:**
- Commercial
- Delivery fees
- Return fees
- Status
- Company documents upload

## 🚀 How to Use

### To Delete a Shipper with Payments:

1. **Check which shippers have payments:**
   ```bash
   cd backend
   node scripts/manageShipperPayments.js
   ```

2. **View payments for a specific shipper:**
   ```bash
   node scripts/showShipperPayments.js 35
   ```

3. **Delete payments for the shipper:**
   ```bash
   node scripts/deleteShipperPayments.js 35
   ```

4. **Now you can delete the shipper** through the web interface

### To Create/Update Shippers:

1. **Individual Shippers**: Select "Carte d'identité" and fill in identity number
2. **Company Shippers**: Select "Patente" and fill in company details
3. The system will validate required fields based on the selected type

## 🔧 Backend Commands

### Start the backend:
```bash
cd backend
node server.js
```

### Useful scripts:
```bash
# Check shippers with payments
node scripts/manageShipperPayments.js

# Show payments for shipper ID 35
node scripts/showShipperPayments.js 35

# Delete payments for shipper ID 35
node scripts/deleteShipperPayments.js 35

# Setup database
node scripts/setupDatabase.js

# Seed sample data
node scripts/seedData.js
```

## ✅ What's Fixed

1. ✅ **Delete Operation**: Now provides clear error messages and prevents deletion when dependencies exist
2. ✅ **Update Operation**: Properly validates required fields based on shipper type
3. ✅ **Create Operation**: Validates required fields based on shipper type
4. ✅ **Payment Management**: Tools to safely manage payments before shipper deletion
5. ✅ **Error Messages**: More specific and helpful error messages
6. ✅ **Form Type Handling**: Proper handling of individual vs company shipper types

## 🎯 Next Steps

1. Test the new delete functionality with shippers that have payments
2. Test creating both types of shippers (individual and company)
3. Test updating shippers and changing between types
4. Use the payment management scripts when needed

The system should now handle all shipper operations properly with clear error messages and proper validation! 