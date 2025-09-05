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
  Grid,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import {
  Search as SearchIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { Payout } from '../types';
import { payoutApi } from '../services/api';
import { format } from 'date-fns';

const Payouts: React.FC = () => {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    type: 'process' | 'reject' | null;
    payout: Payout | null;
  }>({ open: false, type: null, payout: null });
  const [actionReason, setActionReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [pagination, setPagination] = useState({
    page: 0,
    pageSize: 25,
    total: 0,
  });

  useEffect(() => {
    loadPayouts();
  }, [pagination.page, pagination.pageSize, searchTerm, statusFilter, startDate, endDate]);

  const loadPayouts = async () => {
    try {
      setLoading(true);
      const response = await payoutApi.getPayouts({
        page: pagination.page + 1,
        limit: pagination.pageSize,
        status: statusFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });

      if (response.success && response.data) {
        setPayouts(response.data.payouts);
        setStats(response.data.stats);
        setPagination(prev => ({
          ...prev,
          total: response.data!.pagination.totalPayouts,
        }));
      } else {
        setError('Failed to load payouts');
      }
    } catch (err) {
      setError('An error occurred while loading payouts');
      console.error('Payouts error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayout = async () => {
    if (!actionDialog.payout) return;

    try {
      const response = await payoutApi.processPayout(
        actionDialog.payout._id,
        adminNotes
      );

      if (response.success) {
        setActionDialog({ open: false, type: null, payout: null });
        setAdminNotes('');
        loadPayouts();
      } else {
        setError('Failed to process payout');
      }
    } catch (err) {
      setError('An error occurred while processing payout');
      console.error('Process payout error:', err);
    }
  };

  const handleRejectPayout = async () => {
    if (!actionDialog.payout || !actionReason) return;

    try {
      const response = await payoutApi.rejectPayout(
        actionDialog.payout._id,
        actionReason
      );

      if (response.success) {
        setActionDialog({ open: false, type: null, payout: null });
        setActionReason('');
        loadPayouts();
      } else {
        setError('Failed to reject payout');
      }
    } catch (err) {
      setError('An error occurred while rejecting payout');
      console.error('Reject payout error:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'processing': return 'info';
      case 'completed': return 'success';
      case 'failed': return 'error';
      case 'cancelled': return 'default';
      default: return 'default';
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'user',
      headerName: 'User',
      width: 180,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            {params.row.userId?.name || 'Unknown User'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {params.row.userId?.email || 'No email'}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'amount',
      headerName: 'Amount',
      width: 120,
      renderCell: (params) => (
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            ${params.value.toFixed(2)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {params.row.coinsDeducted.toLocaleString()} coins
          </Typography>
        </Box>
      ),
    },
    {
      field: 'netAmount',
      headerName: 'Net Amount',
      width: 120,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.main' }}>
          ${params.value.toFixed(2)}
        </Typography>
      ),
    },
    {
      field: 'paypalEmail',
      headerName: 'PayPal Email',
      width: 200,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value.toUpperCase()}
          color={getStatusColor(params.value) as any}
          size="small"
        />
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Requested',
      width: 130,
      renderCell: (params) => (
        <Typography variant="body2">
          {format(new Date(params.value), 'MMM dd, yyyy')}
        </Typography>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="View Details">
            <IconButton
              size="small"
              onClick={() => setSelectedPayout(params.row)}
            >
              <ViewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {params.row.status === 'pending' && (
            <>
              <Tooltip title="Process Payout">
                <IconButton
                  size="small"
                  color="success"
                  onClick={() => setActionDialog({
                    open: true,
                    type: 'process',
                    payout: params.row
                  })}
                >
                  <ApproveIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Reject Payout">
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => setActionDialog({
                    open: true,
                    type: 'reject',
                    payout: params.row
                  })}
                >
                  <RejectIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>
      ),
    },
  ];

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Payout Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Review, process, and manage all payout requests from users.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ScheduleIcon sx={{ color: 'warning.main', mr: 2 }} />
                  <Box>
                    <Typography variant="h6" component="div">
                      {stats.pendingCount || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pending Payouts
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
                  <MoneyIcon sx={{ color: 'success.main', mr: 2 }} />
                  <Box>
                    <Typography variant="h6" component="div">
                      ${stats.totalAmount?.toFixed(2) || '0.00'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Paid Out
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
                      {stats.uniqueUsers || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Users Paid
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
                      {((stats.completedCount / (stats.totalCount || 1)) * 100).toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Success Rate
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              placeholder="Search by user or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="processing">Processing</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="failed">Failed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              variant="outlined"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
                setStartDate('');
                setEndDate('');
              }}
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Payouts Table */}
      <Paper sx={{ height: 600 }}>
        <DataGrid
          rows={payouts}
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

      {/* Payout Details Dialog */}
      <Dialog open={!!selectedPayout} onClose={() => setSelectedPayout(null)} maxWidth="md" fullWidth>
        <DialogTitle>Payout Details</DialogTitle>
        <DialogContent>
          {selectedPayout && (
            <Box sx={{ pt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>User Information</Typography>
                  <Typography variant="body2">Name: {selectedPayout.userId?.name}</Typography>
                  <Typography variant="body2">Email: {selectedPayout.userId?.email}</Typography>
                  <Typography variant="body2">Country: {selectedPayout.userId?.country}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>Payout Information</Typography>
                  <Typography variant="body2">Amount: ${selectedPayout.amount.toFixed(2)}</Typography>
                  <Typography variant="body2">Net Amount: ${selectedPayout.netAmount.toFixed(2)}</Typography>
                  <Typography variant="body2">Coins Deducted: {selectedPayout.coinsDeducted.toLocaleString()}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>PayPal Information</Typography>
                  <Typography variant="body2">Email: {selectedPayout.paypalEmail}</Typography>
                  <Typography variant="body2">Conversion Rate: {selectedPayout.conversionRate}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>Fees</Typography>
                  <Typography variant="body2">PayPal Fee: ${selectedPayout.fees?.paypalFee?.toFixed(2) || '0.00'}</Typography>
                  <Typography variant="body2">Platform Fee: ${selectedPayout.fees?.platformFee?.toFixed(2) || '0.00'}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>Status & Dates</Typography>
                  <Typography variant="body2">Status: <Chip label={selectedPayout.status.toUpperCase()} color={getStatusColor(selectedPayout.status) as any} size="small" /></Typography>
                  <Typography variant="body2">Requested: {format(new Date(selectedPayout.createdAt), 'PPpp')}</Typography>
                  {selectedPayout.processedAt && (
                    <Typography variant="body2">Processed: {format(new Date(selectedPayout.processedAt), 'PPpp')}</Typography>
                  )}
                </Grid>
                {selectedPayout.adminNotes && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>Admin Notes</Typography>
                    <Typography variant="body2">{selectedPayout.adminNotes}</Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedPayout(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={actionDialog.open} onClose={() => setActionDialog({ open: false, type: null, payout: null })} maxWidth="sm" fullWidth>
        <DialogTitle>
          {actionDialog.type === 'process' ? 'Process Payout' : 'Reject Payout'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            {actionDialog.payout && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  User: {actionDialog.payout.userId?.name} ({actionDialog.payout.userId?.email})
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Amount: ${actionDialog.payout.amount.toFixed(2)} (Net: ${actionDialog.payout.netAmount.toFixed(2)})
                </Typography>
              </Box>
            )}
            
            {actionDialog.type === 'process' ? (
              <TextField
                fullWidth
                label="Admin Notes (Optional)"
                multiline
                rows={3}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add any processing notes..."
              />
            ) : (
              <TextField
                fullWidth
                label="Rejection Reason"
                multiline
                rows={3}
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Enter reason for rejecting this payout..."
                required
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialog({ open: false, type: null, payout: null })}>
            Cancel
          </Button>
          <Button
            onClick={actionDialog.type === 'process' ? handleProcessPayout : handleRejectPayout}
            variant="contained"
            color={actionDialog.type === 'process' ? 'success' : 'error'}
            disabled={actionDialog.type === 'reject' && !actionReason}
          >
            {actionDialog.type === 'process' ? 'Process Payout' : 'Reject Payout'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Payouts;
