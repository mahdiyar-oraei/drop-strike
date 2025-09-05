import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Button,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  AttachMoney as MoneyIcon,
  Gamepad as GameIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { adminApi } from '../services/api';
import AnalyticsChart from '../components/Charts/AnalyticsChart';
import { format, subDays, subMonths } from 'date-fns';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const Analytics: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeframe, setTimeframe] = useState('monthly');
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  useEffect(() => {
    loadAnalytics();
  }, [timeframe]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError('');

      // Load different metrics based on current tab
      const metrics = ['users', 'coins', 'sessions', 'payouts'];
      const promises = metrics.map(metric => 
        adminApi.getAnalytics(timeframe, metric).catch(err => ({ success: false, error: err }))
      );

      const results = await Promise.all(promises);
      
      const data = {
        users: results[0].success ? results[0].data : null,
        coins: results[1].success ? results[1].data : null,
        sessions: results[2].success ? results[2].data : null,
        payouts: results[3].success ? results[3].data : null,
      };

      setAnalyticsData(data);

    } catch (err) {
      setError('Failed to load analytics data');
      console.error('Analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (dataType: string) => {
    try {
      const startDate = format(subMonths(new Date(), 1), 'yyyy-MM-dd');
      const endDate = format(new Date(), 'yyyy-MM-dd');
      
      const response = await adminApi.exportData(dataType, startDate, endDate);
      
      if (response.success && response.data) {
        // Create and download file
        const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${dataType}-export-${format(new Date(), 'yyyy-MM-dd')}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Export error:', err);
    }
  };

  const formatChartData = (data: any[], xKey: string, yKey: string) => {
    if (!data || !Array.isArray(data)) return [];
    
    return data.map(item => ({
      name: item[xKey] ? format(new Date(item[xKey]), 'MMM dd') : item.label || 'Unknown',
      value: item[yKey] || 0,
      ...item
    }));
  };

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case 'users': return <PeopleIcon />;
      case 'coins': return <MoneyIcon />;
      case 'sessions': return <GameIcon />;
      case 'payouts': return <TrendingUpIcon />;
      default: return <TrendingUpIcon />;
    }
  };

  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Analytics Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Detailed insights and reporting for your game's performance and user engagement.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Controls */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Timeframe</InputLabel>
              <Select
                value={timeframe}
                label="Timeframe"
                onChange={(e) => setTimeframe(e.target.value)}
              >
                <MenuItem value="daily">Last 7 Days</MenuItem>
                <MenuItem value="weekly">Last 4 Weeks</MenuItem>
                <MenuItem value="monthly">Last 12 Months</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={9}>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => handleExport('users')}
              >
                Export Users
              </Button>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => handleExport('payouts')}
              >
                Export Payouts
              </Button>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => handleExport('analytics')}
              >
                Export Analytics
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="User Analytics" />
          <Tab label="Revenue Analytics" />
          <Tab label="Engagement Analytics" />
          <Tab label="Geographic Analytics" />
        </Tabs>
      </Box>

      {/* User Analytics */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          {/* Summary Cards */}
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PeopleIcon sx={{ color: 'primary.main', mr: 2 }} />
                  <Box>
                    <Typography variant="h6" component="div">
                      {analyticsData?.users?.summary?.totalUsers?.toLocaleString() || '0'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Users
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TrendingUpIcon sx={{ color: 'success.main', mr: 2 }} />
                  <Box>
                    <Typography variant="h6" component="div">
                      {analyticsData?.users?.summary?.newUsers?.toLocaleString() || '0'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      New Users ({timeframe})
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <GameIcon sx={{ color: 'info.main', mr: 2 }} />
                  <Box>
                    <Typography variant="h6" component="div">
                      {analyticsData?.users?.summary?.activeUsers?.toLocaleString() || '0'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Users
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <MoneyIcon sx={{ color: 'warning.main', mr: 2 }} />
                  <Box>
                    <Typography variant="h6" component="div">
                      {((analyticsData?.users?.summary?.retentionRate || 0) * 100).toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Retention Rate
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* User Growth Chart */}
          <Grid item xs={12} md={8}>
            <AnalyticsChart
              data={formatChartData(analyticsData?.users?.analyticsData || [], 'date', 'count')}
              type="area"
              title="User Growth Over Time"
              height={350}
            />
          </Grid>

          {/* User Status Distribution */}
          <Grid item xs={12} md={4}>
            <AnalyticsChart
              data={[
                { name: 'Active', value: analyticsData?.users?.summary?.activeUsers || 0 },
                { name: 'Inactive', value: (analyticsData?.users?.summary?.totalUsers || 0) - (analyticsData?.users?.summary?.activeUsers || 0) },
              ]}
              type="pie"
              title="User Status Distribution"
              height={350}
            />
          </Grid>
        </Grid>
      </TabPanel>

      {/* Revenue Analytics */}
      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          {/* Revenue Summary Cards */}
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <MoneyIcon sx={{ color: 'success.main', mr: 2 }} />
                  <Box>
                    <Typography variant="h6" component="div">
                      {analyticsData?.coins?.summary?.totalCoinsDistributed?.toLocaleString() || '0'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Coins Distributed
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TrendingUpIcon sx={{ color: 'primary.main', mr: 2 }} />
                  <Box>
                    <Typography variant="h6" component="div">
                      ${analyticsData?.payouts?.summary?.totalPayouts?.toFixed(2) || '0.00'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Payouts
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <GameIcon sx={{ color: 'info.main', mr: 2 }} />
                  <Box>
                    <Typography variant="h6" component="div">
                      {analyticsData?.coins?.summary?.avgCoinsPerUser?.toLocaleString() || '0'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Avg Coins per User
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PeopleIcon sx={{ color: 'warning.main', mr: 2 }} />
                  <Box>
                    <Typography variant="h6" component="div">
                      {((analyticsData?.payouts?.summary?.conversionRate || 0) * 100).toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Payout Conversion Rate
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Revenue Charts */}
          <Grid item xs={12} md={6}>
            <AnalyticsChart
              data={formatChartData(analyticsData?.coins?.analyticsData || [], 'date', 'amount')}
              type="bar"
              title="Coin Distribution Over Time"
              height={350}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <AnalyticsChart
              data={formatChartData(analyticsData?.payouts?.analyticsData || [], 'date', 'amount')}
              type="line"
              title="Payouts Over Time"
              height={350}
            />
          </Grid>
        </Grid>
      </TabPanel>

      {/* Engagement Analytics */}
      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          {/* Engagement Summary Cards */}
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <GameIcon sx={{ color: 'primary.main', mr: 2 }} />
                  <Box>
                    <Typography variant="h6" component="div">
                      {analyticsData?.sessions?.summary?.totalSessions?.toLocaleString() || '0'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Sessions
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TrendingUpIcon sx={{ color: 'success.main', mr: 2 }} />
                  <Box>
                    <Typography variant="h6" component="div">
                      {Math.round(analyticsData?.sessions?.summary?.avgSessionDuration / 60 || 0)}m
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Avg Session Duration
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PeopleIcon sx={{ color: 'info.main', mr: 2 }} />
                  <Box>
                    <Typography variant="h6" component="div">
                      {analyticsData?.sessions?.summary?.avgSessionsPerUser?.toFixed(1) || '0.0'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Sessions per User
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <MoneyIcon sx={{ color: 'warning.main', mr: 2 }} />
                  <Box>
                    <Typography variant="h6" component="div">
                      {analyticsData?.sessions?.summary?.totalEngagementTime ? 
                        Math.round(analyticsData.sessions.summary.totalEngagementTime / 3600) : '0'}h
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Play Time
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Engagement Charts */}
          <Grid item xs={12} md={8}>
            <AnalyticsChart
              data={formatChartData(analyticsData?.sessions?.analyticsData || [], 'date', 'count')}
              type="line"
              title="Daily Active Sessions"
              height={350}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <AnalyticsChart
              data={formatChartData(analyticsData?.sessions?.hourlyData || [], 'hour', 'sessions')}
              type="bar"
              title="Sessions by Hour"
              height={350}
            />
          </Grid>
        </Grid>
      </TabPanel>

      {/* Geographic Analytics */}
      <TabPanel value={tabValue} index={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Users by Country
                </Typography>
                {analyticsData?.users?.countryData ? (
                  <Box>
                    {analyticsData.users.countryData.slice(0, 10).map((country: any, index: number) => (
                      <Box key={country._id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1, borderBottom: index < 9 ? 1 : 0, borderColor: 'divider' }}>
                        <Typography variant="body1">
                          {country._id || 'Unknown'}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            {((country.count / (analyticsData.users.summary?.totalUsers || 1)) * 100).toFixed(1)}%
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                            {country.count.toLocaleString()}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No geographic data available.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <AnalyticsChart
              data={analyticsData?.users?.countryData?.slice(0, 5).map((country: any) => ({
                name: country._id || 'Unknown',
                value: country.count
              })) || []}
              type="pie"
              title="Top 5 Countries"
              height={350}
            />
          </Grid>
        </Grid>
      </TabPanel>
    </Container>
  );
};

export default Analytics;
