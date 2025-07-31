# Role-Based Access Control (RBAC) - QuickZone Dashboard

## 🎯 Overview

This document describes the comprehensive role-based access control system implemented in the QuickZone dashboard. The system ensures that users can only access modules and features relevant to their role within the organization.

## 👥 User Roles & Permissions

### 1. **Administration** 🔧
**Full System Access**
- **Dashboard**: Complete system overview with global statistics
- **Personnel Management**: Access to all personnel modules
  - Administration team management
  - Commercial team management  
  - Finance team management
  - Chef d'agence management
  - Membre de l'agence management
  - Livreurs management
- **All Modules**: Complete access to all system modules
  - Expéditeur (Client management)
  - Colis (Parcel management)
  - Pick up (Pickup missions)
  - Secteurs (Sectors)
  - Entrepôts (Warehouses)
  - Paiement Expéditeur (Client payments)
  - Réclamation (Complaints)

### 2. **Commercial** 💼
**Client & Sales Management**
- **Dashboard**: Commercial-focused dashboard with client statistics
- **Personnel**: Limited access (only Commercial team management)
- **Client Management**: Full access to expéditeur management
  - View all client information
  - Add/edit/delete clients
  - View client statistics and parcel history
- **Parcel Management**: Manage parcels for their clients
- **Pickup Missions**: View and manage pickup operations
- **Sectors**: View sectors they work in
- **Complaints**: Manage client complaints
- **Restricted**: No access to financial operations, warehouses, or other personnel

### 3. **Finance** 💰
**Financial Operations**
- **Dashboard**: Financial dashboard with payment statistics
- **Personnel**: Limited access (only Finance team management)
- **Payments**: Full access to payment management
  - Process client payments
  - Generate invoices
  - Financial reporting
- **Restricted**: Limited access to operational modules

### 4. **Chef d'agence** 🏢
**Operational Management**
- **Dashboard**: Operational dashboard with team and mission statistics
- **Personnel**: Manage their agency team
  - Chef d'agence management
  - Membre de l'agence management
  - Livreurs management
- **Operations**: Full access to operational modules
  - Client management (agency clients)
  - Parcel management
  - Pickup missions
  - Sectors (agency sectors)
  - Warehouses (local warehouses)
  - Complaints (agency complaints)
- **Restricted**: No access to financial operations

### 5. **Membre de l'agence** 👤
**Daily Operations**
- **Dashboard**: Daily operations dashboard with task statistics
- **Parcel Management**: Full access to parcel operations
- **Pickup Missions**: View and manage pickup missions
- **Complaints**: Manage complaints
- **Restricted**: Limited access to other modules

### 6. **Livreurs** 🚚
**Delivery Operations**
- **Dashboard**: Delivery dashboard with mission statistics
- **Pickup Missions**: View and manage their pickup missions
- **Restricted**: Very limited access to other modules

### 7. **Expéditeur (Client)** 📦
**Client Parcel Tracking**
- **Dashboard**: Client dashboard with parcel tracking statistics
- **Parcel Tracking**: View and track their own parcels
  - See parcel status and delivery information
  - Contact assigned delivery drivers
  - Download receipts and tracking documents
- **Payment History**: View their payment history and balance
- **Complaints**: Create and track complaints about their parcels
- **Restricted**: Cannot access other clients' data or operational modules

## 🔧 Technical Implementation

### 1. **Permissions Configuration** (`src/config/permissions.js`)
```javascript
export const ROLE_PERMISSIONS = {
  'Administration': {
    dashboard: true,
    personnel: { administration: true, commercial: true, /* ... */ },
    expediteur: true,
    colis: true,
    // ... all modules
  },
  'Commercial': {
    dashboard: true,
    personnel: { commercial: true }, // Limited personnel access
    expediteur: true, // Full client access
    colis: true,
    // ... restricted modules
  },
  // ... other roles
};
```

### 2. **Helper Functions**
- `hasAccess(userRole, module, subModule)`: Check if user has access to specific module
- `getFilteredMenu(userRole)`: Generate filtered menu based on user permissions

### 3. **Component Integration**

#### Sidebar (`src/components/Sidebar.jsx`)
- Dynamically filters menu items based on user role
- Shows only accessible modules
- Handles nested menu structures (Personnel sub-modules)

#### Dashboard (`src/components/Dashboard.jsx`)
- Role-based content rendering
- Access control for each module
- Graceful handling of unauthorized access

#### DashboardHome (`src/components/DashboardHome.jsx`)
- Role-specific statistics and charts
- Customized dashboard content for each role
- Relevant quick actions based on permissions

### 4. **Login System** (`src/components/Login.jsx`)
- Role selection interface for testing
- User creation with role-based permissions
- Demo mode for testing different roles

## 📊 Role-Specific Dashboards

### Administration Dashboard
- Global system statistics
- Total users, parcels, clients, revenue
- System-wide performance metrics

### Commercial Dashboard
- Client-focused statistics
- Active clients, client parcels, new clients
- Sales performance metrics

### Finance Dashboard
- Financial statistics
- Payments received, pending payments, invoices
- Revenue and margin metrics

### Chef d'agence Dashboard
- Operational statistics
- Team members, active missions, parcels in processing
- Agency performance metrics

### Membre de l'agence Dashboard
- Daily operations statistics
- Parcels processed, current tasks, complaints
- Efficiency metrics

### Livreurs Dashboard
- Delivery statistics
- Daily missions, delivered parcels, in-progress deliveries
- Performance metrics

## 🛡️ Security Features

### 1. **Access Control**
- Server-side permission validation (to be implemented)
- Client-side permission checks
- Graceful error handling for unauthorized access

### 2. **Data Filtering**
- Role-based data access
- User-specific data views
- Secure data transmission

### 3. **Session Management**
- User session validation
- Automatic logout on session expiry
- Secure token handling

## 🧪 Testing the System

### 1. **Login with Different Roles**
1. Navigate to the login page
2. Select different roles from the role selection interface
3. Click "Se connecter" to access the dashboard
4. Observe the different menu items and dashboard content

### 2. **Testing Access Restrictions**
1. Login as a restricted role (e.g., Livreurs)
2. Try to access restricted modules
3. Verify that access is denied with appropriate error messages

### 3. **Testing Role Switching**
1. Login as one role
2. Logout and login as another role
3. Verify that the interface updates correctly

## 🚀 Future Enhancements

### 1. **Advanced Permissions**
- Granular permission system (CRUD operations)
- Dynamic permission assignment
- Permission inheritance

### 2. **Audit Trail**
- User action logging
- Permission change tracking
- Security event monitoring

### 3. **Role Management**
- Dynamic role creation
- Role hierarchy management
- Custom permission sets

### 4. **Multi-tenancy**
- Organization-level permissions
- Cross-organization access control
- Tenant isolation

## 📝 Usage Examples

### Adding a New Role
```javascript
// In src/config/permissions.js
export const ROLE_PERMISSIONS = {
  'New Role': {
    dashboard: true,
    personnel: { new_role: true },
    expediteur: false,
    colis: true,
    // ... define permissions
  }
};
```

### Checking Permissions in Components
```javascript
import { hasAccess } from '../config/permissions';

const MyComponent = () => {
  const user = JSON.parse(localStorage.getItem('currentUser'));
  
  if (!hasAccess(user.role, 'expediteur')) {
    return <AccessDenied />;
  }
  
  return <ExpediteurComponent />;
};
```

### Customizing Dashboard Content
```javascript
const generateRoleSpecificStats = (role) => {
  const stats = {
    'Custom Role': {
      title: "Custom Dashboard",
      cards: [
        { title: "Custom Metric", value: "123", change: "+5%" }
      ]
    }
  };
  return stats[role] || defaultStats;
};
```

## 🔍 Monitoring & Maintenance

### 1. **Permission Auditing**
- Regular permission reviews
- Access pattern analysis
- Security compliance checks

### 2. **Performance Monitoring**
- Menu rendering performance
- Permission check efficiency
- User experience metrics

### 3. **User Feedback**
- Role-specific feature requests
- Permission adjustment needs
- Usability improvements

---

This RBAC system provides a solid foundation for secure, role-based access control in the QuickZone dashboard, ensuring that users only see and interact with features relevant to their responsibilities within the organization. 