import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  People as PeopleIcon,
  AccountBalanceWallet as WalletIcon,
  VideogameAsset as GameIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material';
import { DashboardStats as Stats } from '../../types';

interface DashboardStatsProps {
  stats: Stats;
}

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, icon, color, subtitle }) => {
  const formatChange = (change: number) => {
    const isPositive = change >= 0;
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {isPositive ? <TrendingUpIcon fontSize="small" /> : <TrendingDownIcon fontSize="small" />}
        <Typography variant="body2" color={isPositive ? 'success.main' : 'error.main'}>
          {isPositive ? '+' : ''}{change.toFixed(1)}%
        </Typography>
      </Box>
    );
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ color: `${color}.main` }}>
            {icon}
          </Box>
          {change !== undefined && formatChange(change)}
        </Box>
        
        <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </Typography>
        
        <Typography variant="h6" color="text.secondary" gutterBottom>
          {title}
        </Typography>
        
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

const DashboardStats: React.FC<DashboardStatsProps> = ({ stats }) => {
  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <StatCard
          title="Total Users"
          value={stats.users.total}
          change={stats.users.growthRate}
          icon={<PeopleIcon fontSize="large" />}
          color="primary"
          subtitle={`${stats.users.active} active users`}
        />
      </Grid>
      
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <StatCard
          title="Coins Distributed"
          value={`${(stats.coins.totalDistributed / 1000).toFixed(1)}K`}
          icon={<WalletIcon fontSize="large" />}
          color="warning"
          subtitle={`$${(stats.coins.totalDistributed * stats.coins.conversionRate).toFixed(2)} equivalent`}
        />
      </Grid>
      
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <StatCard
          title="Active Sessions"
          value={stats.gaming.activeSessions}
          icon={<GameIcon fontSize="large" />}
          color="success"
          subtitle={`${stats.gaming.totalSessions} total sessions`}
        />
      </Grid>
      
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <StatCard
          title="Pending Payouts"
          value={stats.payouts.pending}
          icon={<PaymentIcon fontSize="large" />}
          color="error"
          subtitle={`$${stats.payouts.totalAmount.toFixed(2)} total paid`}
        />
      </Grid>

      {/* Additional stats row */}
      <Grid size={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Today's Activity
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h4" color="primary.main" sx={{ fontWeight: 'bold' }}>
                    {stats.users.newToday}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    New Users Today
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h4" color="warning.main" sx={{ fontWeight: 'bold' }}>
                    {(stats.coins.distributedToday / 1000).toFixed(1)}K
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Coins Distributed Today
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold' }}>
                    {stats.system.todayAdViews}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Ad Views Today
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Top Countries */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Top Countries
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {stats.topCountries.slice(0, 5).map((country, index) => (
                <Box key={country.country} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      label={`#${index + 1}`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                    <Typography variant="body1">
                      {country.country}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {country.users} users
                  </Typography>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Quick Actions */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              System Status
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body1">Active Ad Rewards</Typography>
                <Chip
                  label={stats.system.activeAdRewards}
                  color="success"
                  size="small"
                />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body1">Pending Payouts</Typography>
                <Chip
                  label={stats.payouts.pending}
                  color={stats.payouts.pending > 0 ? 'warning' : 'success'}
                  size="small"
                />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body1">Completed Payouts</Typography>
                <Chip
                  label={stats.payouts.completed}
                  color="info"
                  size="small"
                />
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default DashboardStats;
