# 🚀 QuickZone Cloud Deployment Guide

This guide will help you deploy your QuickZone application to the cloud using:
- **Frontend (React) → Vercel**
- **Backend (Express API) → Render**  
- **Database (PostgreSQL) → Neon**

## 📋 Prerequisites

1. GitHub account
2. Vercel account
3. Render account
4. Neon account
5. Your local database backup (`qz.sql`)

## 🗄️ Step 1: Set up Neon Database

### 1.1 Create Neon Account
1. Go to [neon.tech](https://neon.tech)
2. Sign up with GitHub
3. Create a new project called "quickzone"
4. Choose PostgreSQL 17
5. Copy the connection string

### 1.2 Migrate Database
1. Update the connection string in `migrate_to_neon.js`
2. Run the migration script:
   ```bash
   node migrate_to_neon.js
   ```

## 🔧 Step 2: Deploy Backend to Render

### 2.1 Prepare Repository
1. Push your code to GitHub
2. Make sure `backend/` folder contains all necessary files

### 2.2 Deploy to Render
1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Configure:
   - **Name**: `quickzone-backend`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: `Node`

### 2.3 Set Environment Variables
In Render dashboard, add these environment variables:
```
NODE_ENV=production
PORT=10000
JWT_SECRET=your_super_secure_jwt_secret_here
JWT_EXPIRES_IN=24h
CORS_ORIGIN=https://quickzone-frontend.vercel.app
```

### 2.4 Add Database Connection
1. In Render, go to "Dashboard" → "New +" → "PostgreSQL"
2. Choose "Neon" as the provider
3. Enter your Neon connection details
4. Connect it to your web service

## ⚛️ Step 3: Deploy Frontend to Vercel

### 3.1 Prepare Frontend
1. Make sure your `package.json` has the `vercel-build` script
2. Update `vercel.json` with correct backend URL

### 3.2 Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Click "New Project"
4. Import your GitHub repository
5. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `.` (root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### 3.3 Set Environment Variables
In Vercel dashboard, add:
```
VITE_API_URL=https://quickzone-backend.onrender.com
```

## 🔗 Step 4: Update CORS Settings

### 4.1 Update Backend CORS
In your Render backend, update the CORS origin to include your Vercel URL:
```
CORS_ORIGIN=https://your-app-name.vercel.app
```

### 4.2 Test Connection
1. Visit your Vercel URL
2. Check browser console for any CORS errors
3. Test login functionality

## 🧪 Step 5: Testing

### 5.1 Test Database Connection
```bash
# Test from your local machine
psql "your_neon_connection_string" -c "SELECT COUNT(*) FROM users;"
```

### 5.2 Test Backend API
```bash
curl https://quickzone-backend.onrender.com/api/health
```

### 5.3 Test Frontend
1. Visit your Vercel URL
2. Try logging in
3. Check all major features

## 🔧 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Update CORS_ORIGIN in Render
   - Restart the backend service

2. **Database Connection Issues**
   - Check Neon connection string
   - Verify SSL settings

3. **Build Failures**
   - Check build logs in Vercel/Render
   - Ensure all dependencies are in package.json

4. **Environment Variables**
   - Double-check all environment variables
   - Restart services after changes

## 📊 Monitoring

### Render
- Check service logs in Render dashboard
- Monitor resource usage
- Set up alerts for downtime

### Vercel
- Monitor build logs
- Check function logs
- Monitor performance

### Neon
- Monitor database performance
- Check connection limits
- Monitor storage usage

## 🔄 Updates

### Updating Backend
1. Push changes to GitHub
2. Render will automatically redeploy
3. Check logs for any issues

### Updating Frontend
1. Push changes to GitHub
2. Vercel will automatically redeploy
3. Test the new deployment

### Updating Database
1. Make changes locally
2. Export new schema/data
3. Run migration script
4. Test in production

## 🎉 Success!

Once everything is deployed and working:
- Your frontend will be available at: `https://your-app.vercel.app`
- Your backend API will be available at: `https://quickzone-backend.onrender.com`
- Your database will be hosted on Neon

## 📞 Support

If you encounter issues:
1. Check the logs in Render/Vercel dashboards
2. Verify all environment variables
3. Test database connection separately
4. Check CORS settings

Happy deploying! 🚀
