import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  TrendingUp as AnalyticsIcon,
  VideoLibrary as VideoIcon,
  ViewModule as InterstitialIcon,
  ViewCarousel as BannerIcon,
} from '@mui/icons-material';
import { AdReward } from '../types';
import { adApi } from '../services/api';
import { format } from 'date-fns';

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
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const Ads: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [adRewards, setAdRewards] = useState<AdReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adTypeFilter, setAdTypeFilter] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState('');
  const [createDialog, setCreateDialog] = useState(false);
  const [editDialog, setEditDialog] = useState<{ open: boolean; adReward: AdReward | null }>({
    open: false,
    adReward: null,
  });
  const [analytics, setAnalytics] = useState<any>(null);
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState('monthly');
  const [pagination, setPagination] = useState({
    page: 0,
    pageSize: 25,
    total: 0,
  });

  // Form state
  const [formData, setFormData] = useState({
    adType: 'rewarded_video',
    adUnitId: '',
    adUnitName: '',
    coinReward: 10,
    description: '',
    minimumWatchTime: 30,
    dailyLimit: 10,
    isActive: true,
    requirements: {
      minLevel: 0,
      cooldownMinutes: 5,
    },
  });

  useEffect(() => {
    loadAdRewards();
  }, [pagination.page, pagination.pageSize, adTypeFilter, isActiveFilter]);

  useEffect(() => {
    if (tabValue === 1) {
      loadAnalytics();
    }
  }, [tabValue, analyticsTimeframe]);

  const loadAdRewards = async () => {
    try {
      setLoading(true);
      const response = await adApi.getAdRewards({
        page: pagination.page + 1,
        limit: pagination.pageSize,
        adType: adTypeFilter || undefined,
        isActive: isActiveFilter ? isActiveFilter === 'true' : undefined,
      });

      if (response.success && response.data) {
        setAdRewards(response.data.adRewards);
        setPagination(prev => ({
          ...prev,
          total: response.data!.pagination.totalRewards,
        }));
      } else {
        setError('Failed to load ad rewards');
      }
    } catch (err) {
      setError('An error occurred while loading ad rewards');
      console.error('Ad rewards error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await adApi.getAdAnalytics(analyticsTimeframe);
      if (response.success && response.data) {
        setAnalytics(response.data);
      }
    } catch (err) {
      console.error('Analytics error:', err);
    }
  };

  const handleCreateAdReward = async () => {
    try {
      const response = await adApi.createAdReward(formData as Partial<AdReward>);
      if (response.success) {
        setCreateDialog(false);
        resetForm();
        loadAdRewards();
      } else {
        setError('Failed to create ad reward');
      }
    } catch (err) {
      setError('An error occurred while creating ad reward');
      console.error('Create ad reward error:', err);
    }
  };

  const handleUpdateAdReward = async () => {
    if (!editDialog.adReward) return;

    try {
      const response = await adApi.updateAdReward(editDialog.adReward._id, formData as Partial<AdReward>);
      if (response.success) {
        setEditDialog({ open: false, adReward: null });
        resetForm();
        loadAdRewards();
      } else {
        setError('Failed to update ad reward');
      }
    } catch (err) {
      setError('An error occurred while updating ad reward');
      console.error('Update ad reward error:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      adType: 'rewarded_video',
      adUnitId: '',
      adUnitName: '',
      coinReward: 10,
      description: '',
      minimumWatchTime: 30,
      dailyLimit: 10,
      isActive: true,
      requirements: {
        minLevel: 0,
        cooldownMinutes: 5,
      },
    });
  };

  const openEditDialog = (adReward: AdReward) => {
    setFormData({
      adType: adReward.adType,
      adUnitId: adReward.adUnitId,
      adUnitName: adReward.adUnitName,
      coinReward: adReward.coinReward,
      description: adReward.description || '',
      minimumWatchTime: adReward.minimumWatchTime || 30,
      dailyLimit: adReward.dailyLimit || 10,
      isActive: adReward.isActive,
      requirements: {
        minLevel: adReward.requirements?.minLevel || 0,
        cooldownMinutes: adReward.requirements?.cooldownMinutes || 5,
      },
    });
    setEditDialog({ open: true, adReward });
  };

  const getAdTypeIcon = (adType: string) => {
    switch (adType) {
      case 'rewarded_video': return <VideoIcon />;
      case 'interstitial': return <InterstitialIcon />;
      case 'banner': return <BannerIcon />;
      default: return <ViewIcon />;
    }
  };

  const getAdTypeColor = (adType: string) => {
    switch (adType) {
      case 'rewarded_video': return 'primary';
      case 'interstitial': return 'secondary';
      case 'banner': return 'info';
      default: return 'default';
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'adUnitName',
      headerName: 'Ad Unit',
      width: 200,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            {params.value}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
            {params.row.adUnitId}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'adType',
      headerName: 'Type',
      width: 140,
      renderCell: (params) => (
        <Chip
          icon={getAdTypeIcon(params.value)}
          label={params.value.replace('_', ' ').toUpperCase()}
          color={getAdTypeColor(params.value) as any}
          size="small"
        />
      ),
    },
    {
      field: 'coinReward',
      headerName: 'Reward',
      width: 100,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
          {params.value} coins
        </Typography>
      ),
    },
    {
      field: 'dailyLimit',
      headerName: 'Daily Limit',
      width: 110,
      renderCell: (params) => (
        <Typography variant="body2">
          {params.value || 'Unlimited'}
        </Typography>
      ),
    },
    {
      field: 'minimumWatchTime',
      headerName: 'Watch Time',
      width: 120,
      renderCell: (params) => (
        <Typography variant="body2">
          {params.value}s
        </Typography>
      ),
    },
    {
      field: 'cooldown',
      headerName: 'Cooldown',
      width: 100,
      renderCell: (params) => (
        <Typography variant="body2">
          {params.row.requirements?.cooldownMinutes || 0}m
        </Typography>
      ),
    },
    {
      field: 'isActive',
      headerName: 'Status',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Active' : 'Inactive'}
          color={params.value ? 'success' : 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 120,
      renderCell: (params) => (
        <Typography variant="body2">
          {format(new Date(params.value), 'MMM dd, yyyy')}
        </Typography>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Edit Ad Unit">
            <IconButton
              size="small"
              onClick={() => openEditDialog(params.row)}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="View Analytics">
            <IconButton
              size="small"
              color="primary"
            >
              <AnalyticsIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Ad Rewards Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Configure and monitor different ad reward types and their performance.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Ad Rewards Configuration" />
          <Tab label="Analytics" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        {/* Filters and Actions */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Ad Type</InputLabel>
                <Select
                  value={adTypeFilter}
                  label="Ad Type"
                  onChange={(e) => setAdTypeFilter(e.target.value)}
                >
                  <MenuItem value="">All Types</MenuItem>
                  <MenuItem value="rewarded_video">Rewarded Video</MenuItem>
                  <MenuItem value="interstitial">Interstitial</MenuItem>
                  <MenuItem value="banner">Banner</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={isActiveFilter}
                  label="Status"
                  onChange={(e) => setIsActiveFilter(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="true">Active</MenuItem>
                  <MenuItem value="false">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setCreateDialog(true)}
                >
                  Add Ad Unit
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Ad Rewards Table */}
        <Paper sx={{ height: 600 }}>
          <DataGrid
            rows={adRewards}
            columns={columns}
            loading={loading}
            paginationMode="server"
            rowCount={pagination.total}
            paginationModel={{
              page: pagination.page,
              pageSize: pagination.pageSize,
            }}
            onPaginationModelChange={(model) => {
              setPagination(prev => ({
                ...prev,
                page: model.page,
                pageSize: model.pageSize,
              }));
            }}
            pageSizeOptions={[10, 25, 50, 100]}
            getRowId={(row) => row._id}
            sx={{
              '& .MuiDataGrid-row:hover': {
                backgroundColor: 'action.hover',
              },
            }}
          />
        </Paper>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {/* Analytics */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Timeframe</InputLabel>
              <Select
                value={analyticsTimeframe}
                label="Timeframe"
                onChange={(e) => setAnalyticsTimeframe(e.target.value)}
              >
                <MenuItem value="daily">Today</MenuItem>
                <MenuItem value="weekly">This Week</MenuItem>
                <MenuItem value="monthly">This Month</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {analytics && (
          <Grid container spacing={3}>
            {/* Overall Stats */}
            {analytics.overallStats?.map((stat: any, index: number) => (
              <Grid key={index} xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      {getAdTypeIcon(stat.adType)}
                      <Typography variant="h6" sx={{ ml: 1 }}>
                        {stat.adType.replace('_', ' ').toUpperCase()}
                      </Typography>
                    </Box>
                    <Typography variant="h4" component="div" gutterBottom>
                      {stat.totalViews.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Total Views
                    </Typography>
                    <Typography variant="body2">
                      {stat.totalCoinsDistributed.toLocaleString()} coins distributed
                    </Typography>
                    <Typography variant="body2">
                      {stat.uniqueUserCount} unique users
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}

            {/* Top Performing Ad Units */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Top Performing Ad Units
                  </Typography>
                  {analytics.topAdUnits?.length > 0 ? (
                    <Box>
                      {analytics.topAdUnits.map((unit: any, index: number) => (
                        <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1, borderBottom: index < analytics.topAdUnits.length - 1 ? 1 : 0, borderColor: 'divider' }}>
                          <Box>
                            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                              {unit.adUnitName || unit.adUnitId}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {unit.adType?.replace('_', ' ').toUpperCase()}
                            </Typography>
                          </Box>
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                              {unit.totalViews.toLocaleString()} views
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {unit.totalCoinsDistributed.toLocaleString()} coins
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No data available for the selected timeframe.
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </TabPanel>

      {/* Create/Edit Dialog */}
      <Dialog 
        open={createDialog || editDialog.open} 
        onClose={() => {
          setCreateDialog(false);
          setEditDialog({ open: false, adReward: null });
          resetForm();
        }} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          {createDialog ? 'Create New Ad Unit' : 'Edit Ad Unit'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              <Grid xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Ad Type</InputLabel>
                  <Select
                    value={formData.adType}
                    label="Ad Type"
                    onChange={(e) => setFormData({ ...formData, adType: e.target.value })}
                    disabled={!!editDialog.adReward}
                  >
                    <MenuItem value="rewarded_video">Rewarded Video</MenuItem>
                    <MenuItem value="interstitial">Interstitial</MenuItem>
                    <MenuItem value="banner">Banner</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Ad Unit ID"
                  value={formData.adUnitId}
                  onChange={(e) => setFormData({ ...formData, adUnitId: e.target.value })}
                  disabled={!!editDialog.adReward}
                  required
                />
              </Grid>
              <Grid xs={12}>
                <TextField
                  fullWidth
                  label="Ad Unit Name"
                  value={formData.adUnitName}
                  onChange={(e) => setFormData({ ...formData, adUnitName: e.target.value })}
                  required
                />
              </Grid>
              <Grid xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </Grid>
              <Grid xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Coin Reward"
                  type="number"
                  value={formData.coinReward}
                  onChange={(e) => setFormData({ ...formData, coinReward: parseInt(e.target.value) })}
                  inputProps={{ min: 1, max: 10000 }}
                  required
                />
              </Grid>
              <Grid xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Minimum Watch Time (seconds)"
                  type="number"
                  value={formData.minimumWatchTime}
                  onChange={(e) => setFormData({ ...formData, minimumWatchTime: parseInt(e.target.value) })}
                  inputProps={{ min: 0 }}
                />
              </Grid>
              <Grid xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Daily Limit (0 = unlimited)"
                  type="number"
                  value={formData.dailyLimit}
                  onChange={(e) => setFormData({ ...formData, dailyLimit: parseInt(e.target.value) })}
                  inputProps={{ min: 0 }}
                />
              </Grid>
              <Grid xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Minimum Level Required"
                  type="number"
                  value={formData.requirements.minLevel}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    requirements: { ...formData.requirements, minLevel: parseInt(e.target.value) }
                  })}
                  inputProps={{ min: 0 }}
                />
              </Grid>
              <Grid xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Cooldown (minutes)"
                  type="number"
                  value={formData.requirements.cooldownMinutes}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    requirements: { ...formData.requirements, cooldownMinutes: parseInt(e.target.value) }
                  })}
                  inputProps={{ min: 0 }}
                />
              </Grid>
              <Grid xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    />
                  }
                  label="Active"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setCreateDialog(false);
            setEditDialog({ open: false, adReward: null });
            resetForm();
          }}>
            Cancel
          </Button>
          <Button
            onClick={createDialog ? handleCreateAdReward : handleUpdateAdReward}
            variant="contained"
            disabled={!formData.adUnitId || !formData.adUnitName || !formData.coinReward}
          >
            {createDialog ? 'Create' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Ads;
