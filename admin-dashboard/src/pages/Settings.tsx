import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Alert,
  Switch,
  FormControlLabel,
  Divider,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Security as SecurityIcon,
  Payment as PaymentIcon,
  Settings as SettingsIcon,
  Health as HealthIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { adminApi } from '../services/api';
import { format } from 'date-fns';

interface SystemHealth {
  status: string;
  timestamp: string;
  uptime: number;
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  database: string;
  services: {
    paypal: boolean;
    admob: boolean;
    email: boolean;
  };
}

const Settings: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [logsDialog, setLogsDialog] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);

  // System Configuration State
  const [config, setConfig] = useState({
    // Coin Configuration
    baseCoinToUsdRate: 0.001,
    minimumPayoutAmount: 1.00,
    maximumPayoutAmount: 10000.00,
    platformFeeRate: 0.05,

    // Ad Configuration
    defaultAdCooldown: 5,
    maxDailyAdViews: 50,
    rewardedVideoCoins: 10,
    interstitialAdCoins: 5,
    bannerAdCoins: 1,

    // Game Configuration
    maxGameSessionTime: 3600,
    coinBonusMultiplier: 1.0,
    levelUpCoinBonus: 100,

    // Security Configuration
    maxLoginAttempts: 5,
    sessionTimeout: 86400,
    requireEmailVerification: true,
    enableTwoFactor: false,

    // System Configuration
    maintenanceMode: false,
    registrationEnabled: true,
    payoutsEnabled: true,
    debugMode: false,
  });

  useEffect(() => {
    loadSystemHealth();
    loadSystemConfig();
  }, []);

  const loadSystemHealth = async () => {
    try {
      const response = await adminApi.getSystemHealth();
      if (response.success && response.data) {
        setSystemHealth(response.data);
      }
    } catch (err) {
      console.error('Health check error:', err);
    }
  };

  const loadSystemConfig = async () => {
    // This would load actual system configuration from the backend
    // For now, we'll use default values
    try {
      // const response = await adminApi.getSystemConfig();
      // if (response.success && response.data) {
      //   setConfig(response.data);
      // }
    } catch (err) {
      console.error('Config load error:', err);
    }
  };

  const handleSaveConfig = async (section: string) => {
    try {
      setLoading(true);
      setError('');
      
      // This would save the configuration to the backend
      // const response = await adminApi.updateSystemConfig(section, config);
      // if (response.success) {
        setSuccess(`${section} configuration saved successfully`);
        setTimeout(() => setSuccess(''), 3000);
      // }
    } catch (err) {
      setError(`Failed to save ${section} configuration`);
    } finally {
      setLoading(false);
    }
  };

  const loadSystemLogs = async () => {
    try {
      // This would load actual system logs from the backend
      // const response = await adminApi.getSystemLogs({ limit: 100 });
      // if (response.success && response.data) {
      //   setLogs(response.data.logs);
      // }
      
      // Mock logs for demonstration
      setLogs([
        { level: 'info', message: 'User login: admin@dropstrike.com', timestamp: new Date().toISOString() },
        { level: 'warn', message: 'High memory usage detected', timestamp: new Date(Date.now() - 300000).toISOString() },
        { level: 'error', message: 'PayPal API timeout', timestamp: new Date(Date.now() - 600000).toISOString() },
        { level: 'info', message: 'Payout processed: $25.00', timestamp: new Date(Date.now() - 900000).toISOString() },
      ]);
    } catch (err) {
      console.error('Logs error:', err);
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'error';
      case 'warn': return 'warning';
      case 'info': return 'info';
      default: return 'default';
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          System Settings
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Configure system parameters, monitor health, and manage application settings.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* System Health */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <HealthIcon sx={{ color: 'primary.main', mr: 1 }} />
                <Typography variant="h6">System Health</Typography>
                <Box sx={{ ml: 'auto' }}>
                  <IconButton onClick={loadSystemHealth} size="small">
                    <RefreshIcon />
                  </IconButton>
                </Box>
              </Box>

              {systemHealth ? (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Status:</Typography>
                    <Chip 
                      label={systemHealth.status.toUpperCase()} 
                      color={systemHealth.status === 'healthy' ? 'success' : 'error'}
                      size="small"
                    />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Uptime:</Typography>
                    <Typography variant="body2">{formatUptime(systemHealth.uptime)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Memory Used:</Typography>
                    <Typography variant="body2">{formatBytes(systemHealth.memory.heapUsed)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Database:</Typography>
                    <Chip 
                      label={systemHealth.database.toUpperCase()} 
                      color={systemHealth.database === 'connected' ? 'success' : 'error'}
                      size="small"
                    />
                  </Box>

                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="subtitle2" gutterBottom>Services</Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">PayPal:</Typography>
                    <Chip 
                      label={systemHealth.services.paypal ? 'ENABLED' : 'DISABLED'} 
                      color={systemHealth.services.paypal ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">AdMob:</Typography>
                    <Chip 
                      label={systemHealth.services.admob ? 'ENABLED' : 'DISABLED'} 
                      color={systemHealth.services.admob ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Email:</Typography>
                    <Chip 
                      label={systemHealth.services.email ? 'ENABLED' : 'DISABLED'} 
                      color={systemHealth.services.email ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>

                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<ViewIcon />}
                    onClick={() => {
                      loadSystemLogs();
                      setLogsDialog(true);
                    }}
                    sx={{ mt: 2 }}
                  >
                    View System Logs
                  </Button>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Loading system health...
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Coin & Payout Configuration */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <PaymentIcon sx={{ color: 'primary.main', mr: 1 }} />
                <Typography variant="h6">Coin & Payout Configuration</Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Base Coin to USD Rate"
                    type="number"
                    value={config.baseCoinToUsdRate}
                    onChange={(e) => setConfig({ ...config, baseCoinToUsdRate: parseFloat(e.target.value) })}
                    inputProps={{ step: 0.0001, min: 0.0001 }}
                    helperText="How many USD per coin (e.g., 0.001 = 1000 coins = $1)"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Platform Fee Rate"
                    type="number"
                    value={config.platformFeeRate}
                    onChange={(e) => setConfig({ ...config, platformFeeRate: parseFloat(e.target.value) })}
                    inputProps={{ step: 0.01, min: 0, max: 1 }}
                    helperText="Platform fee as decimal (e.g., 0.05 = 5%)"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Minimum Payout Amount ($)"
                    type="number"
                    value={config.minimumPayoutAmount}
                    onChange={(e) => setConfig({ ...config, minimumPayoutAmount: parseFloat(e.target.value) })}
                    inputProps={{ step: 0.01, min: 0.01 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Maximum Payout Amount ($)"
                    type="number"
                    value={config.maximumPayoutAmount}
                    onChange={(e) => setConfig({ ...config, maximumPayoutAmount: parseFloat(e.target.value) })}
                    inputProps={{ step: 0.01, min: 1 }}
                  />
                </Grid>
              </Grid>
            </CardContent>
            <CardActions>
              <Button
                startIcon={<SaveIcon />}
                variant="contained"
                onClick={() => handleSaveConfig('Coin & Payout')}
                disabled={loading}
              >
                Save Configuration
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Ad Configuration */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <SettingsIcon sx={{ color: 'primary.main', mr: 1 }} />
                <Typography variant="h6">Ad Configuration</Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Default Ad Cooldown (minutes)"
                    type="number"
                    value={config.defaultAdCooldown}
                    onChange={(e) => setConfig({ ...config, defaultAdCooldown: parseInt(e.target.value) })}
                    inputProps={{ min: 0 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Max Daily Ad Views"
                    type="number"
                    value={config.maxDailyAdViews}
                    onChange={(e) => setConfig({ ...config, maxDailyAdViews: parseInt(e.target.value) })}
                    inputProps={{ min: 1 }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Rewarded Video Coins"
                    type="number"
                    value={config.rewardedVideoCoins}
                    onChange={(e) => setConfig({ ...config, rewardedVideoCoins: parseInt(e.target.value) })}
                    inputProps={{ min: 1 }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Interstitial Ad Coins"
                    type="number"
                    value={config.interstitialAdCoins}
                    onChange={(e) => setConfig({ ...config, interstitialAdCoins: parseInt(e.target.value) })}
                    inputProps={{ min: 1 }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Banner Ad Coins"
                    type="number"
                    value={config.bannerAdCoins}
                    onChange={(e) => setConfig({ ...config, bannerAdCoins: parseInt(e.target.value) })}
                    inputProps={{ min: 1 }}
                  />
                </Grid>
              </Grid>
            </CardContent>
            <CardActions>
              <Button
                startIcon={<SaveIcon />}
                variant="contained"
                onClick={() => handleSaveConfig('Ad')}
                disabled={loading}
              >
                Save Configuration
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Security Configuration */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <SecurityIcon sx={{ color: 'primary.main', mr: 1 }} />
                <Typography variant="h6">Security Configuration</Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Max Login Attempts"
                    type="number"
                    value={config.maxLoginAttempts}
                    onChange={(e) => setConfig({ ...config, maxLoginAttempts: parseInt(e.target.value) })}
                    inputProps={{ min: 1 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Session Timeout (seconds)"
                    type="number"
                    value={config.sessionTimeout}
                    onChange={(e) => setConfig({ ...config, sessionTimeout: parseInt(e.target.value) })}
                    inputProps={{ min: 300 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.requireEmailVerification}
                        onChange={(e) => setConfig({ ...config, requireEmailVerification: e.target.checked })}
                      />
                    }
                    label="Require Email Verification"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.enableTwoFactor}
                        onChange={(e) => setConfig({ ...config, enableTwoFactor: e.target.checked })}
                      />
                    }
                    label="Enable Two-Factor Authentication"
                  />
                </Grid>
              </Grid>
            </CardContent>
            <CardActions>
              <Button
                startIcon={<SaveIcon />}
                variant="contained"
                onClick={() => handleSaveConfig('Security')}
                disabled={loading}
              >
                Save Configuration
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* System Toggles */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Toggles
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.maintenanceMode}
                        onChange={(e) => setConfig({ ...config, maintenanceMode: e.target.checked })}
                        color="warning"
                      />
                    }
                    label="Maintenance Mode"
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.registrationEnabled}
                        onChange={(e) => setConfig({ ...config, registrationEnabled: e.target.checked })}
                      />
                    }
                    label="User Registration"
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.payoutsEnabled}
                        onChange={(e) => setConfig({ ...config, payoutsEnabled: e.target.checked })}
                      />
                    }
                    label="Payouts Enabled"
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.debugMode}
                        onChange={(e) => setConfig({ ...config, debugMode: e.target.checked })}
                        color="warning"
                      />
                    }
                    label="Debug Mode"
                  />
                </Grid>
              </Grid>
            </CardContent>
            <CardActions>
              <Button
                startIcon={<SaveIcon />}
                variant="contained"
                onClick={() => handleSaveConfig('System')}
                disabled={loading}
              >
                Save Configuration
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>

      {/* System Logs Dialog */}
      <Dialog open={logsDialog} onClose={() => setLogsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>System Logs</DialogTitle>
        <DialogContent>
          <List>
            {logs.map((log, index) => (
              <ListItem key={index}>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip 
                        label={log.level.toUpperCase()} 
                        color={getLogLevelColor(log.level) as any}
                        size="small"
                      />
                      <Typography variant="body2">
                        {log.message}
                      </Typography>
                    </Box>
                  }
                  secondary={format(new Date(log.timestamp), 'PPpp')}
                />
                <ListItemSecondaryAction>
                  <IconButton edge="end" size="small">
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogsDialog(false)}>Close</Button>
          <Button variant="outlined" onClick={() => setLogs([])}>
            Clear Logs
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Settings;
