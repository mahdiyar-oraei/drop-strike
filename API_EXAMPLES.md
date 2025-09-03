# Drop Strike API Examples

This document provides example API calls for testing the Drop Strike backend.

## Authentication

### Register User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "paypalEmail": "john.paypal@example.com",
    "deviceInfo": {
      "deviceId": "device123",
      "platform": "Android",
      "version": "1.0.0"
    }
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Get Profile
```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Game Session Management

### Start Game Session
```bash
curl -X POST http://localhost:3000/api/game/session/start \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceInfo": {
      "deviceId": "device123",
      "platform": "Android",
      "version": "1.0.0",
      "screenResolution": "1080x1920"
    }
  }'
```

### Update Game Session
```bash
curl -X PUT http://localhost:3000/api/game/session/SESSION_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "gameStats": {
      "ballsDropped": 25,
      "successfulHits": 18,
      "highestScore": 1250,
      "levelsCompleted": 3
    },
    "coinsEarned": 45
  }'
```

### Record Ad Reward
```bash
curl -X POST http://localhost:3000/api/game/session/SESSION_ID/ad-reward \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "adType": "rewarded_video",
    "adUnitId": "ca-app-pub-3940256099942544/5224354917",
    "completed": true
  }'
```

### End Game Session
```bash
curl -X POST http://localhost:3000/api/game/session/SESSION_ID/end \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Leaderboards

### Get Daily Leaderboard
```bash
curl -X GET http://localhost:3000/api/leaderboard/daily?page=1&limit=50
```

### Get Weekly Leaderboard by Country
```bash
curl -X GET "http://localhost:3000/api/leaderboard/weekly?country=US&page=1&limit=20"
```

### Get All-Time Leaderboard
```bash
curl -X GET http://localhost:3000/api/leaderboard/all-time?page=1&limit=100
```

## Ad System

### Get Available Ad Rewards
```bash
curl -X GET http://localhost:3000/api/ads/rewards
```

### Check If User Can Watch Ad
```bash
curl -X GET http://localhost:3000/api/ads/can-watch/ca-app-pub-3940256099942544/5224354917 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get User Ad Analytics
```bash
curl -X GET "http://localhost:3000/api/ads/analytics?timeframe=weekly" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## User Dashboard and Statistics

### Get User Dashboard
```bash
curl -X GET http://localhost:3000/api/users/dashboard \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Transaction History
```bash
curl -X GET "http://localhost:3000/api/users/transactions?page=1&limit=20&type=earned" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get User Statistics
```bash
curl -X GET http://localhost:3000/api/users/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Payout System

### Get Payout Configuration
```bash
curl -X GET http://localhost:3000/api/payouts/config/info \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Request Payout
```bash
curl -X POST http://localhost:3000/api/payouts/request \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 5.00,
    "paypalEmail": "john.paypal@example.com"
  }'
```

### Get Payout History
```bash
curl -X GET http://localhost:3000/api/payouts/history?page=1&limit=10 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Cancel Pending Payout
```bash
curl -X POST http://localhost:3000/api/payouts/PAYOUT_ID/cancel \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Admin Endpoints

### Admin Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@dropstrike.com",
    "password": "admin123"
  }'
```

### Get Admin Dashboard
```bash
curl -X GET http://localhost:3000/api/admin/dashboard \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

### Get All Users (Admin)
```bash
curl -X GET "http://localhost:3000/api/users/admin/all?page=1&limit=20&sortBy=totalCoinsEarned&sortOrder=desc" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

### Process Payout (Admin)
```bash
curl -X POST http://localhost:3000/api/payouts/admin/PAYOUT_ID/process \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "adminNotes": "Processed by admin - verified user identity"
  }'
```

### Create Ad Reward Configuration (Admin)
```bash
curl -X POST http://localhost:3000/api/ads/admin/rewards \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "adType": "rewarded_video",
    "adUnitId": "ca-app-pub-1234567890/1234567890",
    "adUnitName": "Premium Rewarded Video",
    "coinReward": 75,
    "description": "High-value rewarded video for premium users",
    "minimumWatchTime": 30,
    "dailyLimit": 5,
    "requirements": {
      "minLevel": 5,
      "cooldownMinutes": 10
    }
  }'
```

### Bulk User Operations (Admin)
```bash
curl -X POST http://localhost:3000/api/admin/users/bulk-action \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "adjust-coins",
    "userIds": ["USER_ID_1", "USER_ID_2"],
    "coinAdjustment": 100,
    "reason": "Bonus reward for beta testing"
  }'
```

## System Endpoints

### Health Check
```bash
curl -X GET http://localhost:3000/health
```

### System Health (Admin)
```bash
curl -X GET http://localhost:3000/api/admin/health \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

### Get System Analytics (Admin)
```bash
curl -X GET "http://localhost:3000/api/admin/analytics?timeframe=monthly&metric=users" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

## Response Examples

### Successful User Registration
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "65abc123def456789",
      "name": "John Doe",
      "email": "john@example.com",
      "country": "US",
      "coins": 0,
      "moneyEquivalent": 0,
      "isActive": true,
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Leaderboard Response
```json
{
  "success": true,
  "data": {
    "leaderboard": [
      {
        "rank": 1,
        "name": "TopPlayer",
        "country": "US",
        "totalCoinsEarned": 15420
      },
      {
        "rank": 2,
        "name": "GameMaster",
        "country": "CA",
        "totalCoinsEarned": 14850
      }
    ],
    "currentUser": {
      "rank": 156,
      "totalCoinsEarned": 2340
    },
    "pagination": {
      "currentPage": 1,
      "totalPages": 45,
      "totalUsers": 2250,
      "hasNextPage": true,
      "hasPrevPage": false
    },
    "timeframe": "daily",
    "country": "global"
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Validation errors",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email"
    }
  ]
}
```

## Testing Tips

1. **Get JWT Token**: Always login first to get the JWT token for authenticated endpoints
2. **Replace Placeholders**: Replace `YOUR_JWT_TOKEN`, `SESSION_ID`, etc. with actual values
3. **Check Responses**: Always check the `success` field in responses
4. **Rate Limiting**: Be aware of rate limits (100 requests per 15 minutes by default)
5. **Environment**: These examples assume the server is running on `localhost:3000`

## Postman Collection

You can import these examples into Postman by creating a new collection and adding each endpoint as a separate request. Don't forget to set up environment variables for:
- `base_url`: http://localhost:3000
- `jwt_token`: Your authentication token
- `admin_token`: Admin authentication token
