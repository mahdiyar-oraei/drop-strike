# Drop Strike Game Backend API

A comprehensive backend API for the Drop Strike Unity game featuring user authentication, coin rewards system, AdMob integration, PayPal payouts, and admin management panel.

## Features

- 🔐 **Authentication System** - User registration/login with JWT tokens
- 🪙 **Coin System** - Earn coins through gameplay and ads with real money conversion
- 📱 **AdMob Integration** - Reward system for different ad types (rewarded video, interstitial, banner)
- 💰 **PayPal Payouts** - Automated payout system for users
- 🏆 **Leaderboards** - Daily, weekly, monthly, and all-time rankings
- ⏱️ **Engagement Tracking** - Track user play time and game statistics
- 👨‍💼 **Admin Panel** - Comprehensive admin dashboard and management tools
- 🌍 **Geo-location** - Automatic country detection from IP
- 📊 **Analytics** - Detailed user and system analytics

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT tokens
- **Payments**: PayPal REST SDK
- **Security**: Helmet, CORS, Rate limiting
- **Logging**: Winston
- **Validation**: Express Validator

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud)
- PayPal Developer Account
- AdMob Account

### Installation

1. **Clone and install dependencies**
```bash
cd drop_strike
npm install
```

2. **Environment Configuration**
```bash
cp config.env.example .env
```

Edit `.env` with your configuration:
```env
# Server
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/drop_strike

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# PayPal
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_MODE=sandbox

# AdMob
ADMOB_APP_ID=your_admob_app_id
ADMOB_PUBLISHER_ID=your_admob_publisher_id

# Coin System
BASE_COIN_TO_USD_RATE=0.001
```

3. **Start the server**
```bash
# Development
npm run dev

# Production
npm start
```

## API Documentation

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | User login |
| GET | `/api/auth/profile` | Get user profile |
| PUT | `/api/auth/profile` | Update user profile |
| PUT | `/api/auth/change-password` | Change password |

### Game Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/game/session/start` | Start game session |
| PUT | `/api/game/session/:sessionId` | Update game stats |
| POST | `/api/game/session/:sessionId/end` | End game session |
| POST | `/api/game/session/:sessionId/ad-reward` | Process ad reward |
| GET | `/api/game/stats` | Get user game statistics |

### Leaderboard Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/leaderboard/daily` | Daily leaderboard |
| GET | `/api/leaderboard/weekly` | Weekly leaderboard |
| GET | `/api/leaderboard/monthly` | Monthly leaderboard |
| GET | `/api/leaderboard/all-time` | All-time leaderboard |

### Ad System Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ads/rewards` | Get available ad rewards |
| GET | `/api/ads/rewards/:adType` | Get rewards by ad type |
| GET | `/api/ads/can-watch/:adUnitId` | Check if user can watch ad |
| GET | `/api/ads/analytics` | Get user ad analytics |

### Payout Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payouts/request` | Request payout |
| GET | `/api/payouts/history` | Get payout history |
| GET | `/api/payouts/:payoutId` | Get payout details |
| POST | `/api/payouts/:payoutId/cancel` | Cancel pending payout |

### Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/dashboard` | Admin dashboard overview |
| GET | `/api/admin/analytics` | System analytics |
| GET | `/api/users/admin/all` | Get all users |
| POST | `/api/payouts/admin/:payoutId/process` | Process payout |
| POST | `/api/ads/admin/rewards` | Create ad reward config |

## Data Models

### User Model
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  country: String,
  paypalEmail: String,
  coins: Number,
  totalCoinsEarned: Number,
  totalEngagementTime: Number,
  isActive: Boolean,
  role: String (user/admin)
}
```

### Game Session Model
```javascript
{
  userId: ObjectId,
  sessionId: String,
  startTime: Date,
  endTime: Date,
  duration: Number,
  coinsEarned: Number,
  gameStats: {
    ballsDropped: Number,
    successfulHits: Number,
    highestScore: Number
  },
  adsWatched: Array
}
```

### Payout Model
```javascript
{
  userId: ObjectId,
  amount: Number,
  coinsDeducted: Number,
  paypalEmail: String,
  status: String,
  paypalTransactionId: String,
  fees: Object,
  netAmount: Number
}
```

## Coin System

### Earning Coins
- **Rewarded Video Ads**: 10-50 coins per view
- **Interstitial Ads**: 5-20 coins per view
- **Banner Ads**: 1-5 coins per view
- **Game Completion**: Variable based on performance
- **Daily Bonuses**: Fixed rewards for daily login

### Conversion Rates
- Default: 1000 coins = $1.00 USD
- Configurable via environment variables
- Minimum payout: $1.00
- Maximum payout: $10,000

### Fees
- Platform fee: 5% of payout amount
- PayPal fees: $0.25 - 2% (region dependent)

## Security Features

- JWT token authentication
- Password hashing with bcrypt
- Rate limiting (100 requests per 15 minutes)
- Input validation and sanitization
- CORS protection
- Helmet security headers
- Request logging

## Admin Features

### Dashboard
- Real-time user statistics
- Revenue and payout tracking
- System health monitoring
- Geographic user distribution

### User Management
- View/edit user profiles
- Adjust coin balances
- Activate/deactivate accounts
- Bulk operations

### Payout Management
- Review payout requests
- Process PayPal payments
- Handle failed transactions
- Financial reporting

### Ad Management
- Configure ad reward rates
- Monitor ad performance
- Track revenue by ad type
- A/B testing capabilities

## Development

### Project Structure
```
drop_strike/
├── models/           # Database models
├── routes/           # API route handlers
├── middleware/       # Custom middleware
├── utils/            # Utility functions
├── logs/             # Application logs
├── server.js         # Main server file
└── package.json      # Dependencies
```

### Database Indexes
Optimized indexes for:
- User email lookup
- Leaderboard queries
- Transaction history
- Game session analytics

### Logging
- Winston logger with multiple transports
- Error tracking and debugging
- Performance monitoring
- Admin action audit trail

## Deployment

### Environment Setup
1. Set `NODE_ENV=production`
2. Configure production database
3. Set up PayPal live credentials
4. Configure AdMob production settings
5. Set secure JWT secret

### Recommended Infrastructure
- **Server**: AWS EC2, DigitalOcean, or similar
- **Database**: MongoDB Atlas or self-hosted
- **CDN**: CloudFlare for static assets
- **Monitoring**: New Relic, DataDog, or similar

## Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage
```

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Contact: admin@dropstrike.com

## Changelog

### v1.0.0
- Initial release
- Complete authentication system
- Coin rewards and payout system
- AdMob integration
- Admin panel
- Leaderboards and analytics
