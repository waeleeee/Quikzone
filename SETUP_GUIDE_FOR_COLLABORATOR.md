# 🚀 QuickZone Project Setup Guide for Collaborator

## 📋 **Complete Setup Instructions**

This guide will help you set up the QuickZone project exactly as it runs on the original developer's machine.

---

## 🛠️ **Prerequisites Installation**

### 1. **Install Node.js**
- Download and install Node.js v18 or higher from: https://nodejs.org/
- Verify installation: `node --version` and `npm --version`

### 2. **Install PostgreSQL**
- Download PostgreSQL from: https://www.postgresql.org/download/
- During installation, remember the password you set for the `postgres` user
- Verify installation: `psql --version`

### 3. **Install Git**
- Download Git from: https://git-scm.com/
- Verify installation: `git --version`

---

## 📥 **Project Setup**

### 1. **Clone the Repository**
```bash
git clone https://github.com/waeleeee/QuickZoneDelivery.git
cd QuickZoneDelivery
```

### 2. **Database Setup**

#### Create PostgreSQL Database
```bash
# Connect to PostgreSQL as postgres user
psql -U postgres

# In PostgreSQL prompt, create the database
CREATE DATABASE quickzone_db;
\q
```

#### Database Configuration
The project uses these exact database settings:
- **Host**: localhost
- **Port**: 5432
- **Database**: quickzone_db
- **Username**: postgres
- **Password**: waelrh (or your PostgreSQL password)

---

## ⚙️ **Environment Configuration**

### 1. **Backend Environment**
Create file: `backend/.env`
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=quickzone_db
DB_USER=postgres
DB_PASSWORD=waelrh

# JWT Configuration
JWT_SECRET=quickzone_super_secret_jwt_key_2024
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=5000
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:5173,http://localhost:5174

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 2. **Frontend Environment**
Create file: `.env.local` (in root directory)
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 📦 **Dependencies Installation**

### 1. **Backend Dependencies**
```bash
cd backend
npm install
```

### 2. **Frontend Dependencies**
```bash
# Go back to root directory
cd ..
npm install
```

---

## 🗄️ **Database Initialization**

### 1. **Setup Database Tables**
```bash
cd backend
npm run db:setup
```

### 2. **Seed Sample Data (Optional)**
```bash
npm run db:seed
```

---

## 🚀 **Running the Application**

### 1. **Start Backend Server**
```bash
cd backend
npm run dev
```
**Expected Output**: Server running on http://localhost:5000

### 2. **Start Frontend Server** (in a new terminal)
```bash
# From root directory
npm run dev
```
**Expected Output**: Frontend running on http://localhost:5173

---

## 🔐 **Default Login Credentials**

After running the seed script, use these credentials:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@quickzone.com | admin123 |
| **Agency Manager** | manager@agency.com | manager123 |
| **Commercial** | commercial@quickzone.com | commercial123 |
| **Driver** | driver@quickzone.com | driver123 |
| **Warehouse** | warehouse@quickzone.com | warehouse123 |
| **Finance** | finance@quickzone.com | finance123 |

---

## 📁 **Project Structure Overview**

```
QuickZoneDelivery/
├── backend/                 # Backend API server
│   ├── config/             # Database configuration
│   ├── middleware/         # Authentication middleware
│   ├── routes/             # API routes (15+ route files)
│   ├── scripts/            # Database scripts (50+ files)
│   ├── uploads/            # File uploads
│   ├── package.json        # Backend dependencies
│   ├── config.env          # Environment variables
│   └── server.js           # Main server file
├── src/                    # Frontend React application
│   ├── components/         # React components
│   │   ├── dashboard/      # Dashboard components (20+ files)
│   │   ├── charts/         # Chart components
│   │   └── common/         # Common components
│   ├── services/           # API services
│   ├── stores/             # State management
│   └── config/             # Frontend configuration
├── package.json            # Frontend dependencies
├── env.local               # Frontend environment
└── README.md              # Project documentation
```

---

## 🔧 **Available Scripts**

### **Frontend Scripts**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### **Backend Scripts**
```bash
npm run dev          # Start development server with nodemon
npm start            # Start production server
npm run db:setup     # Setup database tables
npm run db:seed      # Seed sample data
```

---

## 🌐 **Access Points**

- **Frontend Application**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **API Documentation**: http://localhost:5000/api (when server is running)

---

## 🚨 **Troubleshooting**

### **Common Issues & Solutions**

#### 1. **Database Connection Error**
```bash
# Check if PostgreSQL is running
sudo service postgresql status  # Linux
brew services list | grep postgresql  # macOS
```

#### 2. **Port Already in Use**
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

#### 3. **Node Modules Issues**
```bash
# Clear npm cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

#### 4. **Permission Issues**
```bash
# Fix PostgreSQL permissions
sudo -u postgres psql
ALTER USER postgres PASSWORD 'waelrh';
\q
```

---

## 📊 **Database Schema**

The project includes a comprehensive database with 15+ tables:
- Users & Authentication
- Agencies & Personnel
- Parcels & Tracking
- Missions & Deliveries
- Payments & Finance
- Complaints & Support
- Warehouses & Inventory

See `DATABASE_SCHEMA.md` for complete schema details.

---

## 🎯 **Key Features**

### **Multi-Role Dashboard**
- Admin, Agency Managers, Commercial, Drivers, Warehouses
- Role-based access control
- Customized interfaces per role

### **Real-time Tracking**
- Live parcel status updates
- Mission progress tracking
- Driver location monitoring

### **QR Code Scanning**
- Mobile-friendly barcode scanning
- Quick status updates
- Delivery confirmation

### **Multi-language Support**
- Arabic and English interfaces
- Dynamic language switching

### **File Management**
- Document uploads
- Complaint attachments
- Invoice generation

---

## 📞 **Support**

If you encounter any issues:

1. Check the troubleshooting section above
2. Review the `README.md` file
3. Check the `DATABASE_SCHEMA.md` for database details
4. Contact the original developer

---

## ✅ **Verification Checklist**

- [ ] Node.js installed (v18+)
- [ ] PostgreSQL installed and running
- [ ] Database `quickzone_db` created
- [ ] Backend dependencies installed
- [ ] Frontend dependencies installed
- [ ] Environment files created
- [ ] Database tables setup
- [ ] Backend server running on port 5000
- [ ] Frontend server running on port 5173
- [ ] Can login with default credentials
- [ ] All features working properly

---

**🎉 You're all set! The QuickZone project should now be running exactly as intended.** 