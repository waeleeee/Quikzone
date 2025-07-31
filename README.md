# QuickZone Delivery Management System

A comprehensive delivery and logistics management system with role-based access control, real-time tracking, and multi-language support.

## 🚀 Features

### Core Features
- **Multi-Role Dashboard**: Admin, Agency Managers, Commercial, Drivers, Warehouses, and more
- **Real-time Tracking**: Live parcel and mission tracking
- **QR Code Scanning**: Mobile-friendly barcode/QR code scanning for deliveries
- **Multi-language Support**: Arabic and English interface
- **File Upload System**: Support for complaints and document attachments
- **Payment Management**: Integrated payment tracking and invoicing
- **Complaints System**: Customer complaint management with file attachments
- **Analytics & Reports**: Charts and statistics for business insights

### User Roles
- **Administrator**: Full system access and user management
- **Agency Managers**: Manage agency operations and personnel
- **Commercial**: Handle customer relationships and sales
- **Drivers**: Mobile delivery tracking and mission management
- **Warehouses**: Inventory and storage management
- **Finance**: Payment processing and financial reports
- **Shippers**: Customer portal for shipment tracking

## 🛠️ Tech Stack

### Frontend
- **React 19** with Vite
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Zustand** for state management
- **React Query** for API data fetching
- **Chart.js** for analytics
- **React Hook Form** for form handling
- **i18next** for internationalization

### Backend
- **Node.js** with Express
- **PostgreSQL** database
- **JWT** authentication
- **Multer** for file uploads
- **bcrypt** for password hashing
- **CORS** enabled for cross-origin requests

## 📋 Prerequisites

Before running this project, make sure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **PostgreSQL** (v12 or higher)
- **Git**

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/waeleeee/QuickZone-delivery-front-back-.git
cd QuickZone-delivery-front-back-
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create PostgreSQL database
# Run this in your PostgreSQL client:
# CREATE DATABASE quickzone_db;

# Copy environment file
cp config.env .env

# Edit .env file with your database credentials
# Update DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD

# Setup database tables
npm run db:setup

# Seed initial data (optional)
npm run db:seed

# Start backend server
npm run dev
```

### 3. Frontend Setup

```bash
# Navigate back to root directory
cd ..

# Install dependencies
npm install

# Start development server
npm run dev
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=quickzone_db
DB_USER=your_username
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
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

### Database Setup

The system uses PostgreSQL. Make sure to:

1. Install PostgreSQL on your system
2. Create a database named `quickzone_db`
3. Update the database credentials in the `.env` file
4. Run the database setup script: `npm run db:setup`

## 🎯 Usage

### Starting the Application

1. **Start Backend Server**:
   ```bash
   cd backend
   npm run dev
   ```
   The backend will run on `http://localhost:5000`

2. **Start Frontend Development Server**:
   ```bash
   npm run dev
   ```
   The frontend will run on `http://localhost:5173`

### Default Login Credentials

After running the seed script, you can use these default credentials:

- **Admin**: `admin@quickzone.com` / `admin123`
- **Agency Manager**: `manager@agency.com` / `manager123`
- **Commercial**: `commercial@quickzone.com` / `commercial123`
- **Driver**: `driver@quickzone.com` / `driver123`

### Key Features Usage

#### Dashboard Navigation
- Use the sidebar to navigate between different modules
- Switch between Arabic and English using the language switcher
- Access role-specific features based on your user type

#### Parcel Management
- Create new parcels with customer details
- Track parcel status in real-time
- Generate delivery notes and invoices
- Scan QR codes for quick status updates

#### Mission Management
- Assign drivers to delivery missions
- Track mission progress
- Generate pickup schedules
- Monitor driver performance

#### Reports & Analytics
- View delivery statistics
- Generate financial reports
- Monitor agency performance
- Export data to Excel/PDF

## 📁 Project Structure

```
quickzone/
├── backend/                 # Backend API server
│   ├── config/             # Database configuration
│   ├── middleware/         # Authentication middleware
│   ├── routes/             # API routes
│   ├── scripts/            # Database scripts
│   ├── uploads/            # File uploads
│   └── server.js           # Main server file
├── src/                    # Frontend React application
│   ├── components/         # React components
│   │   ├── dashboard/      # Dashboard components
│   │   └── charts/         # Chart components
│   ├── services/           # API services
│   ├── stores/             # State management
│   └── config/             # Frontend configuration
├── public/                 # Static assets
└── README.md              # This file
```

## 🔧 Development

### Available Scripts

**Frontend:**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

**Backend:**
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm run db:setup` - Setup database tables
- `npm run db:seed` - Seed sample data

### Adding New Features

1. **Backend API**: Add new routes in `backend/routes/`
2. **Frontend Components**: Create components in `src/components/`
3. **Database**: Add migration scripts in `backend/scripts/`
4. **State Management**: Update stores in `src/stores/`

## 🚀 Deployment

### Production Build

1. **Build Frontend**:
   ```bash
   npm run build
   ```

2. **Deploy Backend**:
   ```bash
   cd backend
   npm start
   ```

3. **Environment Setup**:
   - Set `NODE_ENV=production`
   - Configure production database
   - Update CORS origins for production domain

### Docker Deployment (Optional)

Create a `Dockerfile` in the root directory:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/waeleeee/QuickZone-delivery-front-back-/issues) page
2. Create a new issue with detailed description
3. Contact the development team

## 🙏 Acknowledgments

- React team for the amazing framework
- Tailwind CSS for the utility-first CSS framework
- Chart.js for beautiful charts
- All contributors and users of QuickZone

---

**QuickZone** - Making delivery management simple and efficient! 🚚✨