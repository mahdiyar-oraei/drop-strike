# Drop Strike Admin Dashboard

A modern React-based admin dashboard for managing the Drop Strike game backend. Built with TypeScript, Material-UI, and comprehensive user management features.

## Features

- 🔐 **Secure Authentication** - Admin-only access with JWT tokens
- 📊 **Real-time Dashboard** - Live statistics and system monitoring
- 👥 **User Management** - View, edit, and manage all game users
- 💰 **Payout Processing** - Handle PayPal payout requests
- 📱 **Ad Management** - Configure and monitor ad reward systems
- 📈 **Analytics** - Detailed insights and reporting
- 🎨 **Modern UI** - Beautiful Material-UI design
- 📱 **Responsive** - Works on desktop, tablet, and mobile

## Tech Stack

- **Frontend**: React 18 with TypeScript
- **UI Framework**: Material-UI (MUI) v5
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Charts**: Recharts
- **Forms**: React Hook Form
- **Date Handling**: date-fns
- **Build Tool**: Create React App

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- Drop Strike Backend API running
- Admin user created in the backend

### Installation

1. **Navigate to the admin dashboard directory**
```bash
cd admin-dashboard
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
```bash
# Create .env file
echo "REACT_APP_API_URL=http://localhost:3000/api" > .env
```

4. **Start the development server**
```bash
npm start
```

The dashboard will be available at `http://localhost:3001`

### Default Admin Credentials

- **Email**: admin@dropstrike.com
- **Password**: admin123

⚠️ **Important**: Change these credentials after first login!

## Project Structure

```
admin-dashboard/
├── public/                 # Static assets
├── src/
│   ├── components/        # Reusable UI components
│   │   └── Layout/       # Layout components (Header, Sidebar)
│   │   └── Dashboard/    # Dashboard-specific components
│   ├── contexts/         # React contexts (Auth, etc.)
│   ├── pages/           # Page components
│   ├── services/        # API services
│   ├── types/           # TypeScript type definitions
│   ├── App.tsx          # Main app component
│   └── index.tsx        # App entry point
├── package.json
└── README.md
```

## Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

## Features Overview

### Dashboard
- **System Statistics**: Real-time user, coin, and session metrics
- **Growth Tracking**: User growth rates and trends
- **Quick Actions**: Access to common admin tasks
- **Country Analytics**: Geographic user distribution
- **System Health**: Monitor system status and alerts

### User Management
- **User List**: Paginated table with search and filters
- **Bulk Operations**: Activate/deactivate users, adjust coins
- **User Details**: Comprehensive user profiles and history
- **Search & Filter**: By name, email, country, status
- **Export Data**: Download user data for analysis

### Payout Management
- **Payout Queue**: Review and process payout requests
- **PayPal Integration**: Direct integration with PayPal API
- **Status Tracking**: Monitor payout status and history
- **Approval Workflow**: Admin approval for all payouts
- **Financial Reporting**: Track total payouts and fees

### Ad Reward Management
- **Ad Configuration**: Set up different ad types and rewards
- **Performance Analytics**: Monitor ad view rates and earnings
- **A/B Testing**: Test different reward amounts
- **Daily Limits**: Configure viewing limits per user
- **Cooldown Management**: Set minimum time between ad views

### Analytics
- **User Analytics**: Registration trends, engagement metrics
- **Revenue Analytics**: Coin distribution and conversion rates
- **Geographic Analytics**: User distribution by country
- **Performance Metrics**: System performance and optimization insights

## API Integration

The dashboard communicates with the Drop Strike backend API:

### Authentication
```typescript
// Login
POST /api/auth/login
{
  "email": "admin@dropstrike.com",
  "password": "admin123"
}
```

### Dashboard Data
```typescript
// Get dashboard statistics
GET /api/admin/dashboard

// Get system analytics
GET /api/admin/analytics?timeframe=monthly&metric=users
```

### User Management
```typescript
// Get all users
GET /api/users/admin/all?page=1&limit=25

// Bulk user operations
POST /api/admin/users/bulk-action
{
  "action": "adjust-coins",
  "userIds": ["user1", "user2"],
  "coinAdjustment": 100,
  "reason": "Bonus reward"
}
```

## Environment Configuration

Create a `.env` file in the root directory:

```env
# Backend API URL
REACT_APP_API_URL=http://localhost:3000/api

# App Configuration
REACT_APP_NAME=Drop Strike Admin Dashboard
REACT_APP_VERSION=1.0.0
REACT_APP_ENV=development
```

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-based Access**: Admin-only access control
- **Auto-logout**: Automatic logout on token expiration
- **Protected Routes**: Route-level access control
- **Input Validation**: Client-side form validation
- **Error Handling**: Comprehensive error handling and user feedback

## Responsive Design

The dashboard is fully responsive and works on:
- **Desktop**: Full-featured dashboard experience
- **Tablet**: Optimized layout for medium screens
- **Mobile**: Mobile-friendly navigation and forms

## Development

### Adding New Features

1. **Create Components**: Add new components in `src/components/`
2. **Add Routes**: Define routes in `src/App.tsx`
3. **API Integration**: Add API calls in `src/services/api.ts`
4. **Type Definitions**: Define types in `src/types/index.ts`

### Code Style

- Use TypeScript for type safety
- Follow Material-UI design patterns
- Use functional components with hooks
- Implement proper error handling
- Add loading states for async operations

## Production Deployment

### Build for Production
```bash
npm run build
```

### Deployment Options
- **Static Hosting**: Netlify, Vercel, GitHub Pages
- **Web Server**: Nginx, Apache
- **CDN**: CloudFront, CloudFlare
- **Container**: Docker deployment

### Environment Variables
Set the following environment variables in production:
- `REACT_APP_API_URL`: Production API URL
- `REACT_APP_ENV`: production

## Troubleshooting

### Common Issues

1. **API Connection Failed**
   - Check if backend server is running
   - Verify API URL in environment variables
   - Check CORS settings in backend

2. **Authentication Failed**
   - Verify admin user exists in backend
   - Check JWT token expiration
   - Clear browser localStorage

3. **Build Errors**
   - Update Node.js to latest LTS version
   - Clear node_modules and reinstall
   - Check for TypeScript errors

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Create an issue in the repository
- Contact: admin@dropstrike.com