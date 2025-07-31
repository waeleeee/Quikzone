# QuickZone Backend API

A comprehensive Node.js backend API for the QuickZone logistics management system.

## 🚀 Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **User Management**: Complete user lifecycle management with roles and permissions
- **Personnel Management**: Administrators, commercials, accountants, agency managers, members, and drivers
- **Client Management**: Shipper/expéditeur management with detailed profiles
- **Parcel Tracking**: Complete parcel lifecycle with timeline tracking
- **Operations Management**: Pickup missions and delivery operations
- **Geographic Management**: Sectors and warehouse management
- **Financial Management**: Payments, invoices, and financial reporting
- **Customer Service**: Complaint management and resolution tracking
- **Dashboard Analytics**: Real-time statistics and performance metrics

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Validation**: Joi
- **Security**: Helmet, CORS, Rate Limiting

## 📋 Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd quickzone/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   # Copy the config file
   cp config.env.example config.env
   
   # Edit the configuration
   nano config.env
   ```

4. **Database Setup**
   ```bash
   # Create PostgreSQL database
   createdb quickzone_db
   
   # Run database setup
   npm run db:setup
   
   # Seed with sample data
   npm run db:seed
   ```

5. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## ⚙️ Configuration

Edit `config.env` with your settings:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=quickzone_db
DB_USER=postgres
DB_PASSWORD=waelrh

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=5000
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🗄️ Database Schema

### Core Tables

- **users**: User accounts and authentication
- **roles**: System roles and permissions
- **user_roles**: Role assignments
- **administrators**: Admin personnel
- **commercials**: Sales personnel
- **accountants**: Finance personnel
- **agency_managers**: Agency management
- **agency_members**: Agency staff
- **drivers**: Delivery personnel
- **shippers**: Client/expéditeur management
- **parcels**: Parcel tracking and management
- **parcel_timeline**: Parcel status history
- **pickup_missions**: Delivery missions
- **mission_parcels**: Mission-parcel associations
- **sectors**: Geographic sectors
- **warehouses**: Storage facilities
- **warehouse_users**: Warehouse staff
- **payments**: Financial transactions
- **invoices**: Invoice management
- **complaints**: Customer service

## 🔐 Authentication

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@quickzone.tn",
  "password": "admin123"
}
```

### Response
```json
{
  "success": true,
  "data": {
    "accessToken": "jwt_token_here",
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@quickzone.tn",
      "firstName": "Admin",
      "lastName": "QuickZone",
      "name": "Admin QuickZone",
      "role": "Administration",
      "permissions": { ... }
    }
  }
}
```

## 👥 User Roles & Permissions

### 1. Administration
- Full system access
- User management
- All modules access

### 2. Commercial
- Client management
- Sales operations
- Limited personnel access

### 3. Finance
- Financial operations
- Payment management
- Limited operational access

### 4. Chef d'agence
- Agency management
- Operational oversight
- Staff management

### 5. Membre de l'agence
- Daily operations
- Parcel management
- Complaint handling

### 6. Livreurs
- Delivery operations
- Mission management
- Limited access

### 7. Expéditeur
- Parcel tracking
- Payment history
- Complaint submission

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration (admin only)
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/logout` - User logout
- `PUT /api/auth/change-password` - Change password

### Dashboard
- `GET /api/dashboard/stats` - Global statistics
- `GET /api/dashboard/recent-activity` - Recent activity
- `GET /api/dashboard/performance` - Performance metrics

### Personnel Management
- `GET /api/personnel/administrators` - List administrators
- `GET /api/personnel/commercials` - List commercials
- `GET /api/personnel/accountants` - List accountants
- `GET /api/personnel/agency-managers` - List agency managers
- `GET /api/personnel/agency-members` - List agency members
- `GET /api/personnel/drivers` - List drivers

### Client Management
- `GET /api/shippers` - List shippers
- `POST /api/shippers` - Create shipper
- `GET /api/shippers/:id` - Get shipper details
- `PUT /api/shippers/:id` - Update shipper
- `DELETE /api/shippers/:id` - Delete shipper

### Parcel Management
- `GET /api/parcels` - List parcels
- `POST /api/parcels` - Create parcel
- `GET /api/parcels/:id` - Get parcel details
- `PUT /api/parcels/:id` - Update parcel
- `DELETE /api/parcels/:id` - Delete parcel
- `GET /api/parcels/:id/timeline` - Get parcel timeline

### Operations
- `GET /api/missions` - List pickup missions
- `POST /api/missions` - Create mission
- `GET /api/missions/:id` - Get mission details
- `PUT /api/missions/:id` - Update mission

### Geographic Management
- `GET /api/sectors` - List sectors
- `GET /api/warehouses` - List warehouses
- `GET /api/warehouses/:id` - Get warehouse details

### Financial Management
- `GET /api/payments` - List payments
- `POST /api/payments` - Create payment
- `GET /api/payments/:id/invoice` - Get payment invoice

### Customer Service
- `GET /api/complaints` - List complaints
- `POST /api/complaints` - Create complaint
- `PUT /api/complaints/:id` - Update complaint

## 🧪 Test Credentials

### Default Admin
- **Email**: `admin@quickzone.tn`
- **Password**: `admin123`

### Test Users
- **Commercial**: `pierre@quickzone.tn` / `pierre123`
- **Finance**: `claude@quickzone.tn` / `claude123`
- **Chef d'agence**: `francois@quickzone.tn` / `francois123`
- **Membre agence**: `thomas@quickzone.tn` / `thomas123`
- **Livreur**: `marc@quickzone.tn` / `marc123`
- **Expéditeur**: `expediteur1@quickzone.tn` / `expediteur123`

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcryptjs for password security
- **Role-based Access Control**: Granular permissions system
- **Input Validation**: Joi schema validation
- **Rate Limiting**: API rate limiting protection
- **CORS Protection**: Cross-origin resource sharing control
- **Helmet Security**: Security headers middleware

## 📈 Performance

- **Database Indexing**: Optimized queries with proper indexes
- **Connection Pooling**: PostgreSQL connection pooling
- **Query Optimization**: Efficient database queries
- **Caching Ready**: Prepared for Redis integration

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Docker (Optional)
```bash
# Build image
docker build -t quickzone-backend .

# Run container
docker run -p 5000:5000 quickzone-backend
```

## 📝 API Documentation

The API follows RESTful conventions and returns JSON responses. All endpoints require authentication unless specified otherwise.

### Error Responses
```json
{
  "error": "Error message",
  "status": 400
}
```

### Success Responses
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions, please contact the development team or create an issue in the repository. #   Q u i c k Z o n e   B a c k e n d   A P I  
 