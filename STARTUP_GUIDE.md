# Drop Strike - Complete Startup Guide

This guide will help you get the Drop Strike backend API and admin dashboard up and running quickly.

## 🚀 Quick Start (5 minutes)

### Step 1: Prerequisites Check
```bash
# Check Node.js version (should be 16+)
node --version

# Check if MongoDB is running (if using local)
mongosh --eval "db.version()"
```

### Step 2: Install Everything
```bash
# Install all dependencies for both backend and admin dashboard
npm run install:all
```

### Step 3: Environment Setup
```bash
# Copy environment template
cp config.env.example .env

# Edit the .env file with your configuration
nano .env
```

**Minimum required configuration:**
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/drop_strike
JWT_SECRET=your_super_secret_jwt_key_here
BASE_COIN_TO_USD_RATE=0.001
```

### Step 4: Database Setup
```bash
# Create admin user and seed initial data
npm run setup
```

### Step 5: Start Both Services
```bash
# Start both backend and admin dashboard simultaneously
npm run dev:all
```

**Services will be available at:**
- 🔧 **Backend API**: http://localhost:3000
- 🎨 **Admin Dashboard**: http://localhost:3001

### Step 6: Access Admin Dashboard
1. Open http://localhost:3001
2. Login with:
   - **Email**: admin@dropstrike.com
   - **Password**: admin123
3. ⚠️ **Change the password immediately after first login!**

## 🔧 Detailed Setup

### MongoDB Setup Options

#### Option 1: Local MongoDB
```bash
# Install MongoDB (macOS)
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community

# Verify connection
mongosh
```

#### Option 2: MongoDB Atlas (Cloud)
1. Create account at https://www.mongodb.com/atlas
2. Create a free cluster
3. Get connection string
4. Update `.env` with your connection string:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/drop_strike
```

### PayPal Integration Setup

1. **Create PayPal Developer Account**
   - Visit https://developer.paypal.com
   - Create an application
   - Get Client ID and Secret

2. **Configure PayPal in .env**
```env
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_MODE=sandbox  # Use 'live' for production
```

### AdMob Integration Setup

1. **Create AdMob Account**
   - Visit https://admob.google.com
   - Create an app
   - Get App ID and Publisher ID

2. **Configure AdMob in .env**
```env
ADMOB_APP_ID=your_admob_app_id
ADMOB_PUBLISHER_ID=your_admob_publisher_id
```

## 🎯 Development Workflow

### Starting Services Individually

**Backend only:**
```bash
npm run dev
```

**Admin dashboard only:**
```bash
npm run admin
# or
cd admin-dashboard && npm start
```

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev:all` | Start both backend and admin dashboard |
| `npm run install:all` | Install dependencies for both projects |
| `npm run setup` | Create admin user and seed data |
| `npm run dev` | Start backend in development mode |
| `npm run admin` | Start admin dashboard |
| `npm run build:admin` | Build admin dashboard for production |
| `npm run seed:ads` | Seed ad reward configurations |
| `npm run create:admin` | Create admin user only |

### Testing the Setup

1. **Test Backend API**
```bash
curl http://localhost:3000/health
```
Expected response:
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456
}
```

2. **Test Admin Login**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@dropstrike.com", "password": "admin123"}'
```

3. **Access Admin Dashboard**
   - Open http://localhost:3001
   - Should see login screen
   - Login should work with default credentials

## 🐛 Troubleshooting

### Common Issues

#### 1. MongoDB Connection Failed
```
Error: MongooseServerSelectionError: connect ECONNREFUSED
```

**Solutions:**
- Check if MongoDB is running: `brew services list | grep mongodb`
- Start MongoDB: `brew services start mongodb-community`
- Verify connection string in `.env`

#### 2. Port Already in Use
```
Error: listen EADDRINUSE :::3000
```

**Solutions:**
- Find process using port: `lsof -i :3000`
- Kill process: `kill -9 <PID>`
- Or change port in `.env`: `PORT=3001`

#### 3. Admin Dashboard Won't Load
- Check if backend is running on port 3000
- Verify CORS settings allow localhost:3001
- Check browser console for errors

#### 4. PayPal Integration Errors
- Verify PayPal credentials in `.env`
- Check if using correct mode (sandbox/live)
- Ensure PayPal account has proper permissions

#### 5. Permission Errors on Scripts
```bash
# Make scripts executable
chmod +x scripts/*.js
```

### Logs and Debugging

**Backend logs:**
```bash
# View logs
tail -f logs/all.log

# View error logs only
tail -f logs/error.log
```

**Enable debug mode:**
```bash
NODE_ENV=development DEBUG=* npm run dev
```

## 📱 Unity Integration

### API Endpoints for Unity

**Base URL:** `http://localhost:3000/api`

**Key endpoints:**
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /game/session/start` - Start game session
- `POST /game/session/:id/ad-reward` - Process ad rewards
- `GET /leaderboard/daily` - Get leaderboards

**Example Unity HTTP request:**
```csharp
UnityWebRequest request = UnityWebRequest.Post(
    "http://localhost:3000/api/auth/login",
    jsonData
);
request.SetRequestHeader("Content-Type", "application/json");
yield return request.SendWebRequest();
```

### Testing with Unity

1. **Configure Unity to use localhost:**
   - Use `http://localhost:3000/api` as base URL
   - Handle CORS if needed

2. **Test user registration and login**
3. **Test game session management**
4. **Test ad reward system**

## 🚀 Production Deployment

### Backend Deployment (Example: DigitalOcean)

```bash
# 1. Create droplet and SSH in
ssh root@your-server-ip

# 2. Install Node.js and MongoDB
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs mongodb

# 3. Clone your repository
git clone https://github.com/yourusername/drop-strike.git
cd drop-strike

# 4. Install dependencies
npm install

# 5. Configure environment
cp config.env.example .env
nano .env  # Edit with production values

# 6. Set up database and start
npm run setup
npm start
```

### Admin Dashboard Deployment (Example: Netlify)

```bash
# 1. Build the admin dashboard
npm run build:admin

# 2. Deploy build folder to Netlify
# - Drag admin-dashboard/build folder to Netlify
# - Or connect GitHub repository

# 3. Configure environment variables in Netlify
# REACT_APP_API_URL=https://your-api-domain.com/api
```

## 📞 Support

### Getting Help

1. **Check logs first:**
   - Backend: `logs/error.log`
   - Admin dashboard: Browser console

2. **Common solutions:**
   - Restart services: `npm run dev:all`
   - Clear database: Drop MongoDB database and run `npm run setup`
   - Reinstall dependencies: `rm -rf node_modules && npm run install:all`

3. **Create GitHub issue with:**
   - Error message
   - Steps to reproduce
   - Environment details (OS, Node.js version)
   - Relevant log files

### Useful Commands

```bash
# Check service status
curl http://localhost:3000/health
curl http://localhost:3001

# View running processes
ps aux | grep node

# Check port usage
lsof -i :3000
lsof -i :3001

# MongoDB operations
mongosh drop_strike
db.users.find()
db.coinTransactions.find().limit(5)
```

---

🎉 **Congratulations!** You now have a fully functional Drop Strike backend with admin dashboard. Start building your Unity game integration!
